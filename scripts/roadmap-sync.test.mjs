import test from 'node:test';
import assert from 'node:assert/strict';
import { decide, eventFromPayload, relevant, shipComment, isShipComment, SHIP_MARKER } from './roadmap-sync.mjs';

const today = '2026-10-18';
const issue = (extra = {}) => ({ number: 12, title: 'Better death names', state: 'open', labels: [], isPullRequest: false, ...extra });
const row = (extra = {}) => ({ id: 5, status: 'next', title: 'Better death names', visible: true, issue: 12, ...extra });
// Label events carry the issue's labels as they are now (main() reads them fresh).
const labels = (labelNames, extra = {}) => ({ type: 'labeled', label: labelNames[labelNames.length - 1], issue: issue({ labels: labelNames, ...extra }) });
const run = (event, current = null, shipCommentExists = false) => decide(event, current, { today, shipCommentExists });
const kinds = actions => actions.map(a => a.kind);

test('the roadmap label adds the issue as an upcoming row, or shows a hidden one', () => {
  assert.deepEqual(run(labels(['roadmap'])), [{ kind: 'create', fields: { status: 'next', title: 'Better death names', issue: 12 } }]);
  assert.deepEqual(run(labels(['roadmap']), row({ visible: false })), [{ kind: 'update', id: 5, fields: { visible: true } }]);
  assert.deepEqual(run(labels(['roadmap']), row()), []);
});

test('with no status label left the row is hidden, not deleted', () => {
  const removed = { type: 'unlabeled', label: 'roadmap', issue: issue({ labels: ['bug'] }) };
  assert.deepEqual(run(removed, row()), [{ kind: 'update', id: 5, fields: { visible: false } }]);
  assert.deepEqual(run(removed, row({ visible: false })), []);
  assert.deepEqual(run(removed), []);
});

test('in-progress moves the row to now, creating it when missing', () => {
  assert.deepEqual(run(labels(['in-progress'])), [{ kind: 'create', fields: { status: 'now', title: 'Better death names', issue: 12 } }]);
  assert.deepEqual(run(labels(['roadmap', 'in-progress']), row()), [{ kind: 'update', id: 5, fields: { status: 'now' } }]);
  assert.deepEqual(run(labels(['roadmap', 'in-progress']), row({ status: 'now' })), []);
  // Taking in-progress off again puts the row back to next.
  assert.deepEqual(run({ type: 'unlabeled', label: 'in-progress', issue: issue({ labels: ['roadmap'] }) }, row({ status: 'now' })), [{ kind: 'update', id: 5, fields: { status: 'next' } }]);
});

test('shipped rows never move back, whatever labels arrive later', () => {
  const done = row({ status: 'done', done_on: '2026-10-01' });
  assert.deepEqual(run(labels(['roadmap', 'in-progress']), done), []);
  assert.deepEqual(run({ type: 'unlabeled', label: 'deployed', issue: issue({ labels: ['roadmap'], state: 'closed' }) }, done), []);
});

test('deployed ships the row, comments once, drops in-progress and closes the issue', () => {
  const event = labels(['in-progress', 'deployed']);
  assert.deepEqual(run(event, row({ status: 'now' })), [
    { kind: 'update', id: 5, fields: { status: 'done', done_on: today } },
    { kind: 'comment', body: shipComment(today) },
    { kind: 'removeLabel', name: 'in-progress' },
    { kind: 'close' },
  ]);
  assert.deepEqual(kinds(run(event, row({ status: 'done', done_on: '2026-10-01' }), true)), ['removeLabel', 'close']);
  // Not on the roadmap: still comment and close, no roadmap row.
  assert.deepEqual(kinds(run(labels(['deployed']))), ['comment', 'close']);
  assert.deepEqual(kinds(run(labels(['deployed'], { state: 'closed' }), null, true)), []);
  assert.match(shipComment(today), new RegExp(`^${SHIP_MARKER} on 2026-10-18\\.`));
});

test('in-progress and deployed arriving together end shipped in either order', () => {
  // Both runs read the same current labels, so the slower one cannot undo the faster one.
  const both = issue({ labels: ['roadmap', 'in-progress', 'deployed'] });
  const asInProgress = run({ type: 'labeled', label: 'in-progress', issue: both }, row({ status: 'done', done_on: today }), true);
  assert.deepEqual(kinds(asInProgress), ['removeLabel', 'close']);
  const asDeployed = run({ type: 'labeled', label: 'deployed', issue: both }, row({ status: 'next' }));
  assert.deepEqual(asDeployed[0], { kind: 'update', id: 5, fields: { status: 'done', done_on: today } });
  // With no row yet, deployed wins: no "now" row is created for shipped work.
  assert.deepEqual(kinds(run({ type: 'labeled', label: 'in-progress', issue: both }, null, true)), ['removeLabel', 'close']);
});

test('/roadmap from a maintainer adds or retitles the row and adds the roadmap label', () => {
  const comment = (body, association = 'OWNER', extra = {}) => ({ type: 'comment', body, association, issue: issue(extra) });
  assert.deepEqual(run(comment('/roadmap Name the last attacker')), [
    { kind: 'create', fields: { status: 'next', title: 'Name the last attacker', issue: 12 } },
    { kind: 'addLabel', name: 'roadmap' },
  ]);
  assert.deepEqual(run(comment('/roadmap', 'MEMBER', { labels: ['roadmap', 'in-progress'] })), [{ kind: 'create', fields: { status: 'now', title: 'Better death names', issue: 12 } }]);
  assert.deepEqual(run(comment('/roadmap New words\nmore text', 'COLLABORATOR', { labels: ['roadmap'] }), row({ visible: false })), [{ kind: 'update', id: 5, fields: { title: 'New words', visible: true } }]);
  assert.deepEqual(kinds(run(comment('/roadmap', 'OWNER', { labels: ['roadmap'] }), row())), ['log']);
});

test('/roadmap is ignored from others, on pull requests, and refused for bad titles', () => {
  const comment = (body, association = 'OWNER', extra = {}) => ({ type: 'comment', body, association, issue: issue(extra) });
  for (const association of ['CONTRIBUTOR', 'NONE', 'FIRST_TIME_CONTRIBUTOR', null]) assert.deepEqual(kinds(run(comment('/roadmap Hi', association))), ['log']);
  assert.deepEqual(kinds(run(comment('/roadmap Hi', 'OWNER', { isPullRequest: true }))), ['log']);
  assert.deepEqual(kinds(run(comment(`/roadmap ${'x'.repeat(201)}`))), ['log']);
  assert.deepEqual(kinds(run(comment('/roadmap bad\u0007title'))), ['log']);
  assert.deepEqual(run(comment('please add to /roadmap')), []);
  assert.deepEqual(run(comment('/roadmapper')), []);
});

test('long or odd issue titles are cleaned and cut to 200 characters without splitting emoji', () => {
  const [action] = run(labels(['roadmap'], { title: `  ${'a'.repeat(250)}\t` }));
  assert.equal(action.fields.title, 'a'.repeat(200));
  const [emoji] = run(labels(['roadmap'], { title: `${'a'.repeat(199)}😀😀` }));
  assert.equal(emoji.fields.title, `${'a'.repeat(199)}😀`);
});

test('labels on pull requests and unrelated labels do nothing', () => {
  assert.deepEqual(kinds(run(labels(['deployed'], { isPullRequest: true }))), ['log']);
  assert.equal(relevant({ type: 'labeled', label: 'bug', issue: issue() }), false);
});

test('only the workflow\'s own ship comment counts as already shipped', () => {
  assert.equal(isShipComment({ body: shipComment(today), user: { login: 'github-actions[bot]' } }), true);
  assert.equal(isShipComment({ body: shipComment(today), user: { login: 'someone' } }), false);
  assert.equal(isShipComment({ body: 'thanks', user: { login: 'github-actions[bot]' } }), false);
});

test('GitHub payloads become events; irrelevant ones skip the API calls', () => {
  const issuePayload = { number: 12, title: 'T', state: 'open', labels: [{ name: 'roadmap' }] };
  const labeled = eventFromPayload('issues', { action: 'labeled', label: { name: 'deployed' }, issue: issuePayload });
  assert.deepEqual(labeled, { type: 'labeled', label: 'deployed', issue: { number: 12, title: 'T', state: 'open', labels: ['roadmap'], isPullRequest: false } });
  const comment = eventFromPayload('issue_comment', { action: 'created', comment: { body: '/roadmap', author_association: 'OWNER' }, issue: { ...issuePayload, pull_request: {} } });
  assert.equal(comment.type, 'comment');
  assert.equal(comment.issue.isPullRequest, true);
  assert.equal(relevant(labeled), true);
  assert.equal(relevant({ type: 'unlabeled', label: 'in-progress', issue: issue() }), true);
  assert.equal(relevant(comment), false);
  assert.equal(relevant({ type: 'comment', body: '/roadmap x', association: 'NONE', issue: issue() }), false);
  assert.equal(eventFromPayload('issues', { action: 'opened', issue: issuePayload }), null);
});
