import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

const followUp = read('../components/followup/FollowUpManager.tsx');
const followUpWorkspace = read('../components/followup/FollowUpRulesWorkspace.tsx');
const followUpCanvas = read('../components/followup/FollowUpRuleCanvas.tsx');
const followUpInspector = read('../components/followup/FollowUpRuleInspector.tsx');
const sidebar = read('../components/ui/LayoutComponents.tsx');
const app = read('../App.tsx');
const profile = read('../components/marketing/CustomerProfileManager.tsx');
const campaign = read('../components/marketing/CampaignManager.tsx');
const botMarketing = read('../components/bot/BotMarketingConfig.tsx');

const checks = [
  [sidebar, '跟进任务'],
  [sidebar, '规则编排'],
  [sidebar, '跟进记录'],
  [app, 'page="tasks"'],
  [app, 'page="flows"'],
  [app, 'page="records"'],
  [followUp, '关联 Flow'],
  [followUp, '跟进记录详情'],
  [followUpWorkspace, '新建 Flow'],
  [followUpWorkspace, 'toggleFollowUpRuleStatus'],
  [followUpWorkspace, '规则校验'],
  [followUpWorkspace, '试运行'],
  [followUpWorkspace, '发布'],
  [followUpCanvas, '节点库'],
  [followUpCanvas, '适应画布'],
  [followUpCanvas, 'onConnectNodes'],
  [followUpCanvas, 'FollowUpMiniMap'],
  [followUpInspector, '事件类型'],
  [followUpInspector, '来源结果'],
  [followUpInspector, '默认分支'],
  [followUpInspector, '幂等键'],
  [profile, '客户筛选'],
  [profile, '通话时间线'],
  [profile, '标签证据链'],
  [campaign, '目标人群规则'],
  [campaign, '排除人群规则'],
  [campaign, '触发规则'],
  [campaign, '命中预估'],
  [botMarketing, '能力绑定'],
  [botMarketing, '绑定可用营销活动'],
  [botMarketing, '绑定自动跟进规则'],
  [botMarketing, '策略模板'],
];

for (const [content, expected] of checks) {
  if (!content.includes(expected)) {
    throw new Error(`Expected B端 UI implementation to include: ${expected}`);
  }
}

console.log('customer operations enterprise ui static check ok');
