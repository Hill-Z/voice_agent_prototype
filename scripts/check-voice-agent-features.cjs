const fs = require('fs');
const path = require('path');

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [
  ['Bot list has current version column', () => read('components/bot/BotListView.tsx').includes('当前版本')],
  ['Bot list has published version column', () => read('components/bot/BotListView.tsx').includes('已发布版本')],
  ['Bot config has version record entry', () => read('components/bot/BotConfigForm.tsx').includes('版本记录')],
  ['Bot config uses draft/published states only', () => read('types.ts').includes("'draft' | 'published' | 'none'") && !read('components/bot/BotConfigForm.tsx').includes('发布范围')],
  ['AI reply log modal component exists', () => exists('components/call/AiReplyLogModal.tsx')],
  ['Call detail exposes AI reply log action', () => read('components/call/CallRecordDetail.tsx').includes('查看日志') && read('components/call/CallRecordDetail.tsx').includes('AiReplyLogModal')],
  ['Customer memory manager exists', () => exists('components/memory/CustomerMemoryManager.tsx')],
  ['Sidebar has customer memory menu', () => read('components/ui/LayoutComponents.tsx').includes('客户记忆')],
  ['Sidebar has memory management submenu', () => read('components/ui/LayoutComponents.tsx').includes('记忆管理') && read('components/ui/LayoutComponents.tsx').includes('记忆配置')],
  ['App routes customer memory pages', () => read('App.tsx').includes('CustomerMemoryManager') && read('App.tsx').includes("case '记忆管理'") && read('App.tsx').includes("case '记忆配置'")],
  ['Memory config has custom field management', () => read('components/memory/CustomerMemoryManager.tsx').includes('自定义记忆字段') && read('components/memory/CustomerMemoryManager.tsx').includes('新增字段') && read('components/memory/CustomerMemoryManager.tsx').includes('字段编码')],
  ['AI reply log has complete audit fields', () => read('components/call/AiReplyLogModal.tsx').includes('ASR final 文本') && read('components/call/AiReplyLogModal.tsx').includes('变量变化') && read('components/call/AiReplyLogModal.tsx').includes('工具原始返回') && read('components/call/AiReplyLogModal.tsx').includes('Prompt 拼接明细')],
  ['AI reply log has two mock scenarios', () => read('components/call/AiReplyLogModal.tsx').includes('search_jobs') && read('components/call/AiReplyLogModal.tsx').includes('知识召回型回复')],
  ['Global first-response filler config exists', () => read('types.ts').includes('firstResponseFillerConfig') && read('components/bot/BotStrategyConfig.tsx').includes('首响连接词')],
  ['Global first-response filler defaults are present', () => read('components/bot/BotStrategyConfig.tsx').includes('稍等') && read('components/bot/BotStrategyConfig.tsx').includes('我看下') && read('components/bot/BotStrategyConfig.tsx').includes('稍等下') && read('components/bot/BotStrategyConfig.tsx').includes('500')],
  ['Global first-response filler guardrails are hidden defaults', () => read('components/bot/BotStrategyConfig.tsx').includes('minUserTurnsBetweenPlays: 2') && read('components/bot/BotStrategyConfig.tsx').includes('avoidConsecutiveRepeat: true') && !read('components/bot/BotStrategyConfig.tsx').includes('至少间隔 2 轮') && !read('components/bot/BotStrategyConfig.tsx').includes('不会连续播放同一句')],
  ['Tool sound effect config exists', () => read('types.ts').includes('soundEffect') && read('components/bot/agent/AgentToolModal.tsx').includes('等待音效')],
  ['Tool sound effect keeps runtime defaults hidden', () => read('components/bot/agent/AgentToolModal.tsx').includes('键盘敲击声') && read('components/bot/agent/AgentToolModal.tsx').includes('stopOnTtsStart: true') && !read('components/bot/agent/AgentToolModal.tsx').includes('最大播放时长') && !read('components/bot/agent/AgentToolModal.tsx').includes('停止规则') && !read('components/bot/agent/AgentToolModal.tsx').includes('正式 TTS 开始时停止')],

  // 计费中心这一组只查「零件在不在、入口通不通」，金额算得对不对交给 tests/billingCenter.static.mjs。
  // 分开的理由：这里挂一次就是少一个页面，那里挂一次是客户看到错的钱，两者的严重程度不一样。
  ['Billing center page exists', () => exists('components/billing/BillingCenter.tsx') && exists('components/billing/billingEngine.ts') && exists('components/billing/billingData.ts') && exists('components/billing/billingUi.tsx')],
  ['Billing center has four tabs', () => ['UsageOverview', 'CallBillingDetail', 'BotBillingStats', 'PublishRatePreview'].every((name) => exists(`components/billing/${name}.tsx`))],
  ['Billing rate basis panel exists', () => exists('components/billing/BillingBasisPanel.tsx') && read('components/billing/BillingBasisPanel.tsx').includes('算不出费率') && read('components/billing/BillingBasisPanel.tsx').includes('内部视角')],
  ['Sidebar has billing center entry', () => read('components/ui/LayoutComponents.tsx').includes('计费中心') && read('components/ui/LayoutComponents.tsx').includes('账户与计费')],
  ['App routes billing center pages', () => read('App.tsx').includes('BillingCenter') && read('App.tsx').includes("case '计费中心'")],
  ['Billing engine pins the pricing rule', () => read('components/billing/billingEngine.ts').includes('PRICING_RULE') && read('components/billing/billingEngine.ts').includes('RESERVE_MINUTES_PER_CALL')],
  ['Publish flow freezes the rate snapshot', () => read('components/bot/BotConfigForm.tsx').includes('billingRateSnapshot:') && read('types.ts').includes('billingRateSnapshot')],
  ['Call record detail shows billing block', () => read('components/call/CallRecordDetail.tsx').includes('计费') && read('components/call/CallRecordDetail.tsx').includes('detailMatchesRequest')],
  ['Billing guard test exists', () => exists('tests/billingCenter.static.mjs') && exists('docs/计费中心PRD.md') && exists('docs/计费引擎规格.md')],
];

let failed = 0;
for (const [name, fn] of checks) {
  let ok = false;
  try { ok = Boolean(fn()); } catch { ok = false; }
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed += 1;
}
if (failed > 0) process.exit(1);
