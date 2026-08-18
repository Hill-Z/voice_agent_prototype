import { readFileSync } from 'node:fs';

const files = {
  types: readFileSync(new URL('../types.ts', import.meta.url), 'utf8'),
  app: readFileSync(new URL('../App.tsx', import.meta.url), 'utf8'),
  sidebar: readFileSync(new URL('../components/ui/LayoutComponents.tsx', import.meta.url), 'utf8'),
  profile: readFileSync(new URL('../components/marketing/CustomerProfileManager.tsx', import.meta.url), 'utf8'),
  campaign: readFileSync(new URL('../components/marketing/CampaignManager.tsx', import.meta.url), 'utf8'),
  botMarketing: readFileSync(new URL('../components/bot/BotMarketingConfig.tsx', import.meta.url), 'utf8'),
};

const followUpPath = new URL('../components/followup/FollowUpManager.tsx', import.meta.url);
const followUpWorkspacePath = new URL('../components/followup/FollowUpRulesWorkspace.tsx', import.meta.url);
const followUpGraphPath = new URL('../components/followup/followUpRuleGraph.ts', import.meta.url);
const followUpInspectorPath = new URL('../components/followup/FollowUpRuleInspector.tsx', import.meta.url);
const followUpMockPath = new URL('../components/marketing/mockCustomerOperations.ts', import.meta.url);
let followUp = '';
let followUpWorkspace = '';
let followUpGraph = '';
let followUpInspector = '';
let followUpMock = '';
try {
  followUp = readFileSync(followUpPath, 'utf8');
  followUpWorkspace = readFileSync(followUpWorkspacePath, 'utf8');
  followUpGraph = readFileSync(followUpGraphPath, 'utf8');
  followUpInspector = readFileSync(followUpInspectorPath, 'utf8');
  followUpMock = readFileSync(followUpMockPath, 'utf8');
} catch {
  followUp = '';
  followUpWorkspace = '';
  followUpGraph = '';
  followUpInspector = '';
  followUpMock = '';
}

const checks = [
  [files.types, 'interface CustomerTag'],
  [files.types, 'interface CustomerInteraction'],
  [files.types, 'interface FollowUpRule'],
  [files.types, 'interface FollowUpTask'],
  [files.types, 'interface FollowUpAttempt'],
  [files.types, 'interface TouchProtectionPolicy'],
  [files.types, 'interface BotMarketingConfig'],
  [files.profile, '标签来源'],
  [files.profile, '当前可推荐活动'],
  [files.profile, '禁止触达原因'],
  [files.profile, '营销状态'],
  [files.profile, '跟进状态'],
  [files.campaign, '活动目标'],
  [files.campaign, '触发时机'],
  [files.campaign, '关联 Flow'],
  [files.campaign, '负反馈'],
  [files.botMarketing, '营销与跟进配置'],
  [files.botMarketing, '客户画像识别'],
  [files.botMarketing, '自动跟进'],
  [files.botMarketing, '触达保护'],
  [files.botMarketing, '结果回写'],
  [files.sidebar + files.app, '自动跟进'],
  [files.sidebar, '跟进任务'],
  [files.sidebar, '规则编排'],
  [files.sidebar, '跟进记录'],
  [followUp, '跟进任务'],
  [followUpWorkspace, '跟进 Flow'],
  [followUp, '跟进记录'],
  [followUp, '关联 Flow'],
  [followUpGraph, '用户要求稍后联系'],
  [followUpGraph, '未接通'],
  [followUpInspector, '投诉风险客户'],
  [followUpMock, 'botNames'],
  [followUpMock, 'flowNames'],
];

for (const [content, text] of checks) {
  if (!content.includes(text)) {
    throw new Error(`Expected implementation to include: ${text}`);
  }
}

console.log('voice customer operations static check ok');
