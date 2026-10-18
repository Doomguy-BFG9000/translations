// Keeps the viewer roadmap in step with this repository's issues. Run by
// .github/workflows/roadmap.yml on label changes and /roadmap comments.
//
//   roadmap label (or a maintainer's "/roadmap [English title]")  -> row added as "next"
//   in-progress label                                              -> row moves to "now"
//   deployed label     -> row "done" today, ship comment, in-progress removed, issue closed
//   roadmap label removed                                          -> row hidden
//
// decide() is pure; main() reads the event, calls the viewer admin API (HD2_ADMIN_TOKEN)
// and the GitHub API (GITHUB_TOKEN), and stops at the first failure.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Public values: the viewer's Supabase project URL and publishable key.
const SUPABASE_URL = 'https://jlngttopcavjotemqgms.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_kczRbZxa9vAdoJ1gSURl2g_zVDiDrM0';
export const SHIP_MARKER = 'Shipped to https://hd2-replay.code0987.me';
const MAINTAINERS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);
const LABELS = new Set(['roadmap', 'in-progress', 'deployed']);
const COMMAND = /^\/roadmap(?:\s+(.*))?$/;

export const shipComment = day => `${SHIP_MARKER} on ${day}.\n\n${day}에 사이트에 반영했습니다.`;
const issueTitle = title => String(title ?? '').replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, 200).trim();
const command = body => String(body ?? '').split(/\r?\n/, 1)[0].trim().match(COMMAND);

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

// event + the roadmap row linked to the issue (or null) -> actions, in order.
export function decide(event, row, { today, shipCommentExists }) {
  const { issue } = event;
  const log = message => [{ kind: 'log', message }];
  const create = status => ({ kind: 'create', fields: { status, title: issueTitle(issue.title), issue: issue.number } });
  if (event.type === 'comment') {
    const match = command(event.body);
    if (!match) return [];
    if (issue.isPullRequest) return log('ignored: /roadmap on a pull request');
    if (!MAINTAINERS.has(event.association)) return log(`ignored: /roadmap from ${event.association ?? 'an unknown author'}`);
    const given = match[1]?.trim() ?? '';
    if (given.length > 200 || /[\x00-\x1f\x7f]/.test(given)) return log('refused: the roadmap title must be 1-200 characters on one line');
    const label = issue.labels.includes('roadmap') ? [] : [{ kind: 'addLabel', name: 'roadmap' }];
    if (!row) return [{ kind: 'create', fields: { status: 'next', title: given || issueTitle(issue.title), issue: issue.number } }, ...label];
    const fields = { ...(given ? { title: given } : {}), ...(row.visible ? {} : { visible: true }) };
    return Object.keys(fields).length ? [{ kind: 'update', id: row.id, fields }, ...label] : [...log('already on the roadmap'), ...label];
  }
  if (issue.isPullRequest) return log('ignored: label on a pull request');
  if (event.type === 'unlabeled') {
    return event.label === 'roadmap' && row?.visible ? [{ kind: 'update', id: row.id, fields: { visible: false } }] : [];
  }
  if (event.type !== 'labeled') return [];
  switch (event.label) {
    case 'roadmap':
      if (!row) return [create('next')];
      return row.visible ? [] : [{ kind: 'update', id: row.id, fields: { visible: true } }];
    case 'in-progress':
      if (!row) return [create('now')];
      return row.status === 'next' ? [{ kind: 'update', id: row.id, fields: { status: 'now' } }] : [];
    case 'deployed': {
      const actions = [];
      if (row && row.status !== 'done') actions.push({ kind: 'update', id: row.id, fields: { status: 'done', done_on: today } });
      if (!shipCommentExists) actions.push({ kind: 'comment', body: shipComment(today) });
      if (issue.labels.includes('in-progress')) actions.push({ kind: 'removeLabel', name: 'in-progress' });
      if (issue.state === 'open') actions.push({ kind: 'close' });
      return actions;
    }
    default: return [];
  }
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
  const { items } = await request(admin, { adminToken: env.HD2_ADMIN_TOKEN });
  const row = items.find(item => item.issue === event.issue.number) ?? null;
  let shipCommentExists = false;
  if (event.type === 'labeled' && event.label === 'deployed') {
    const comments = await gh('/comments?per_page=100');
    shipCommentExists = comments.some(comment => String(comment.body ?? '').startsWith(SHIP_MARKER));
  }
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
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

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
