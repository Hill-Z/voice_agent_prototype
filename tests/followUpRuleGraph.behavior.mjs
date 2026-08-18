import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const entryPoint = fileURLToPath(new URL('../components/followup/followUpRuleGraph.ts', import.meta.url));
const output = await build({
  entryPoints: [entryPoint],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString('base64')}`;
const { createBlankFollowUpRule, moveFollowUpRuleNode, toggleFollowUpRuleStatus } = await import(moduleUrl);

const draft = createBlankFollowUpRule('草稿 Flow');
const disabledDraft = toggleFollowUpRuleStatus(draft);
assert.equal(disabledDraft.status, 'disabled');
assert.equal(disabledDraft.disabledFromStatus, 'draft');
const restoredDraft = toggleFollowUpRuleStatus(disabledDraft);
assert.equal(restoredDraft.status, 'draft');
assert.equal(restoredDraft.disabledFromStatus, undefined);

const published = { ...draft, status: 'published', version: 3 };
const disabledPublished = toggleFollowUpRuleStatus(published);
assert.equal(disabledPublished.status, 'disabled');
assert.equal(disabledPublished.disabledFromStatus, 'published');
const restoredPublished = toggleFollowUpRuleStatus(disabledPublished);
assert.equal(restoredPublished.status, 'published');
assert.equal(restoredPublished.version, 3);

const nodeId = published.nodes[0].id;
const moved = moveFollowUpRuleNode(published, nodeId, { x: 320, y: 180 });
assert.equal(moved.status, 'draft');
assert.deepEqual(moved.nodes.find(node => node.id === nodeId).position, { x: 320, y: 180 });

console.log('follow-up rule graph behavior checks passed');
