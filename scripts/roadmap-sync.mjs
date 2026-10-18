// Keeps the viewer roadmap in step with this repository's issues. Run by
// .github/workflows/roadmap.yml on label changes and /roadmap comments.
//
// Each run reads the issue's labels as they are now and moves the linked row to match,
// so runs that overlap or arrive late cannot undo each other:
//   deployed     -> row "done" today; ship comment, in-progress removed; the issue stays
//                   open while the change settles
//   in-progress  -> row "now" (added if missing)
//   roadmap      -> row "next" (added if missing)
//   none of them -> row hidden
// While the issue is open a shipped row can still move back (say, in-progress again after
// a regression); once the issue is closed the row stays shipped. "ongoing" rows (continuous
// work) are never touched. A maintainer's "/roadmap [English title]" comment also adds the
// row (or retitles it) and puts the roadmap label on the issue.
//
// `--close-stable` (run daily) closes open issues whose deployed label is at least
// STABLE_DAYS old, as completed, with a comment.
//
// decide() is pure; main() reads the event, calls the viewer admin API (HD2_ADMIN_TOKEN)
// and the GitHub API (GITHUB_TOKEN), and stops at the first failure.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Public values: the viewer's Supabase project URL and publishable key.
const SUPABASE_URL = 'https://jlngttopcavjotemqgms.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_kczRbZxa9vAdoJ1gSURl2g_zVDiDrM0';
export const SHIP_MARKER = 'Shipped to https://hd2-replay.code0987.me';
const BOT = 'github-actions[bot]';
const MAINTAINERS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);
const LABELS = new Set(['roadmap', 'in-progress', 'deployed']);
const COMMAND = /^\/roadmap(?:\s+(.*))?$/;

export const STABLE_DAYS = 7;
export const shipComment = day => `${SHIP_MARKER} on ${day}.\n\n${day}에 사이트에 반영했습니다.`;
// One ship comment per deploy day: a redeploy on a later day comments again.
export const isShipComment = (comment, day) => comment?.user?.login === BOT && String(comment.body ?? '').startsWith(`${SHIP_MARKER} on ${day}.`);
export const stableComment = days => `No problems reported in the ${days} days since it was deployed, so this is closed. Reopen it if the problem comes back.\n\n배포 후 ${days}일 동안 문제가 없어 닫습니다. 문제가 다시 생기면 이슈를 다시 열어 주세요.`;
// Whether the latest "deployed" label on an issue is at least `days` old.
export function dueForClosing(events, now, days = STABLE_DAYS) {
  const labeled = events.filter(event => event.event === 'labeled' && event.label?.name === 'deployed').map(event => Date.parse(event.created_at)).filter(Number.isFinite);
  return labeled.length > 0 && now.getTime() - Math.max(...labeled) >= days * 86400000;
}
// Cut by characters, not UTF-16 units, so an emoji is never split.
const issueTitle = title => Array.from(String(title ?? '').replace(/[\x00-\x1f\x7f]/g, ' ').trim()).slice(0, 200).join('').trim();
const command = body => String(body ?? '').split(/\r?\n/, 1)[0].trim().match(COMMAND);
// The roadmap status the issue's labels ask for, strongest first.
const wanted = labels => labels.includes('deployed') ? 'done' : labels.includes('in-progress') ? 'now' : labels.includes('roadmap') ? 'next' : null;

// The workflow's view of a GitHub webhook payload, or null for other actions.
export function eventFromPayload(name, payload) {
  const raw = payload?.issue;
  if (!raw) return null;
  const issue = { number: raw.number, title: raw.title, state: raw.state, labels: (raw.labels ?? []).map(label => label.name), isPullRequest: Boolean(raw.pull_request) };
  if (name === 'issues' && (payload.action === 'labeled' || payload.action === 'unlabeled')) return { type: payload.action, label: payload.label?.name, issue };
  if (name === 'issue_comment' && payload.action === 'created') return { type: 'comment', body: payload.comment?.body, association: payload.comment?.author_association, issue };
  return null;
}

// Whether an event can change anything, so other events skip every API call.
export function relevant(event) {
  if (!event || event.issue.isPullRequest) return false;
  if (event.type === 'comment') return Boolean(command(event.body)) && MAINTAINERS.has(event.association);
  return LABELS.has(event.label);
}

// Ship side effects for an issue carrying the deployed label. The issue stays open to settle.
function ship(issue, { today, shipCommentExists }) {
  const actions = [];
  if (!shipCommentExists) actions.push({ kind: 'comment', body: shipComment(today) });
  if (issue.labels.includes('in-progress')) actions.push({ kind: 'removeLabel', name: 'in-progress' });
  return actions;
}

// event (with the issue's current labels) + the linked roadmap row (or null) -> actions, in order.
export function decide(event, row, { today, shipCommentExists }) {
  const { issue } = event;
  const log = message => [{ kind: 'log', message }];
  const status = wanted(issue.labels);
  const createFields = (title, target) => ({ status: target, title, issue: issue.number, ...(target === 'done' ? { done_on: today } : {}) });
  // Ongoing rows never move; a shipped row moves back only while its issue is still open.
  const settled = () => row.status === 'ongoing' || (row.status === 'done' && issue.state !== 'open');
  const moveTo = target => !target || settled() || row.status === target ? {}
    : { status: target, ...(target === 'done' ? { done_on: today } : row.status === 'done' ? { done_on: null } : {}) };
  const shipping = status === 'done' ? ship(issue, { today, shipCommentExists }) : [];

  if (event.type === 'comment') {
    const match = command(event.body);
    if (!match) return [];
    if (issue.isPullRequest) return log('ignored: /roadmap on a pull request');
    if (!MAINTAINERS.has(event.association)) return log(`ignored: /roadmap from ${event.association ?? 'an unknown author'}`);
    const given = match[1]?.trim() ?? '';
    if (given.length > 200 || /[\x00-\x1f\x7f]/.test(given)) return log('refused: the roadmap title must be 1-200 characters on one line');
    const label = issue.labels.includes('roadmap') ? [] : [{ kind: 'addLabel', name: 'roadmap' }];
    if (!row) return [{ kind: 'create', fields: createFields(given || issueTitle(issue.title), status ?? 'next') }, ...label, ...shipping];
    const fields = { ...(given ? { title: given } : {}), ...(row.visible ? {} : { visible: true }), ...moveTo(status) };
    return [...(Object.keys(fields).length ? [{ kind: 'update', id: row.id, fields }] : log('already on the roadmap')), ...label, ...shipping];
  }

  if (issue.isPullRequest) return log('ignored: label on a pull request');
  if (event.type !== 'labeled' && event.type !== 'unlabeled') return [];
  if (!row) {
    // Shipped work that never was on the roadmap gets no row; it is only commented and closed.
    return status && status !== 'done' ? [{ kind: 'create', fields: createFields(issueTitle(issue.title), status) }] : shipping;
  }
  const fields = { ...(row.status === 'ongoing' || row.visible === Boolean(status) ? {} : { visible: Boolean(status) }), ...moveTo(status) };
  return [...(Object.keys(fields).length ? [{ kind: 'update', id: row.id, fields }] : []), ...shipping];
}

async function request(url, { token, adminToken, method = 'GET', body } = {}) {
  const headers = adminToken
    ? { apikey: PUBLISHABLE_KEY, 'X-Admin-Token': adminToken }
    : { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'hd2-roadmap-sync' };
  const response = await fetch(url, { method, headers: { ...headers, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${method} ${url.replace(/\?.*$/, '')}: HTTP ${response.status} ${data?.error ?? data?.message ?? ''}`.trim());
  return data;
}

async function main() {
  const env = process.env;
  const event = eventFromPayload(env.GITHUB_EVENT_NAME, JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8')));
  if (!relevant(event)) { console.log('Nothing to do for this event.'); return; }
  if (!env.HD2_ADMIN_TOKEN) throw new Error('HD2_ADMIN_TOKEN secret is not set');
  const admin = `${SUPABASE_URL}/functions/v1/replay-share?roadmap=admin`;
  const github = `https://api.github.com/repos/${env.GITHUB_REPOSITORY}/issues/${event.issue.number}`;
  const gh = (path, options) => request(`${github}${path}`, { token: env.GITHUB_TOKEN, ...options });
  // The labels and state as they are now, not as they were when this event fired.
  const current = await gh('');
  event.issue = { ...event.issue, title: current.title, state: current.state, labels: (current.labels ?? []).map(label => label.name) };
  const { items } = await request(admin, { adminToken: env.HD2_ADMIN_TOKEN });
  const row = items.find(item => item.issue === event.issue.number) ?? null;
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  let shipCommentExists = false;
  if (wanted(event.issue.labels) === 'done') {
    for (let page = 1; page <= 20 && !shipCommentExists; page++) {
      const comments = await gh(`/comments?per_page=100&page=${page}`);
      shipCommentExists = comments.some(comment => isShipComment(comment, today));
      if (comments.length < 100) break;
    }
  }
  for (const action of decide(event, row, { today, shipCommentExists })) {
    console.log(`#${event.issue.number}: ${action.kind}${action.fields ? ` ${JSON.stringify(action.fields)}` : ''}${action.name ? ` ${action.name}` : ''}${action.message ? ` ${action.message}` : ''}`);
    if (action.kind === 'create') await request(admin, { adminToken: env.HD2_ADMIN_TOKEN, method: 'POST', body: action.fields });
    else if (action.kind === 'update') await request(`${admin}&item=${action.id}`, { adminToken: env.HD2_ADMIN_TOKEN, method: 'PATCH', body: action.fields });
    else if (action.kind === 'comment') await gh('/comments', { method: 'POST', body: { body: action.body } });
    else if (action.kind === 'addLabel') await gh('/labels', { method: 'POST', body: { labels: [action.name] } });
    else if (action.kind === 'removeLabel') await gh(`/labels/${encodeURIComponent(action.name)}`, { method: 'DELETE' }).catch(error => { if (!/HTTP 404/.test(error.message)) throw error; });
    else if (action.kind === 'close') await gh('', { method: 'PATCH', body: { state: 'closed', state_reason: 'completed' } });
  }
}

// Daily: close open issues whose deployed label has settled for STABLE_DAYS. Needs only GITHUB_TOKEN.
async function closeStable() {
  const env = process.env;
  const repo = `https://api.github.com/repos/${env.GITHUB_REPOSITORY}`;
  const gh = (path, options) => request(`${repo}${path}`, { token: env.GITHUB_TOKEN, ...options });
  const issues = (await gh('/issues?state=open&labels=deployed&per_page=100')).filter(issue => !issue.pull_request);
  const now = new Date();
  for (const issue of issues) {
    const events = [];
    for (let page = 1; page <= 10; page++) {
      const batch = await gh(`/issues/${issue.number}/events?per_page=100&page=${page}`);
      events.push(...batch);
      if (batch.length < 100) break;
    }
    if (!dueForClosing(events, now)) { console.log(`#${issue.number}: still settling`); continue; }
    console.log(`#${issue.number}: closing after ${STABLE_DAYS} days`);
    await gh(`/issues/${issue.number}/comments`, { method: 'POST', body: { body: stableComment(STABLE_DAYS) } });
    await gh(`/issues/${issue.number}`, { method: 'PATCH', body: { state: 'closed', state_reason: 'completed' } });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  (process.argv.includes('--close-stable') ? closeStable() : main()).catch(error => { console.error(error.message); process.exitCode = 1; });
}
