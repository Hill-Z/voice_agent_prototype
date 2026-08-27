// 检查满意度调查是否覆盖问卷、机器人绑定、通话留痕和报表四条链路。
import fs from 'node:fs';

const app = fs.readFileSync('App.tsx', 'utf8');
const sidebar = fs.readFileSync('components/ui/LayoutComponents.tsx', 'utf8');
const manager = fs.readFileSync('components/satisfaction/SatisfactionSurveyManager.tsx', 'utf8');
const editor = fs.readFileSync('components/satisfaction/SatisfactionSurveyEditor.tsx', 'utf8');
const report = fs.readFileSync('components/satisfaction/SatisfactionSurveyReport.tsx', 'utf8');
const bot = fs.readFileSync('components/bot/BotBusinessConfig.tsx', 'utf8');
const call = fs.readFileSync('components/call/CallRecordDetail.tsx', 'utf8');
const types = fs.readFileSync('types.ts', 'utf8');

const requirements = [
  [app, "case '满意度调查'", '独立页面路由'],
  [sidebar, "label: '满意度调查'", '侧边栏入口'],
  [manager, '问卷管理', '问卷列表'],
  [manager, '满意度报表', '报表入口'],
  [manager, '复制', '安全复制'],
  [editor, '旧版满意度 IVR 可直接选择', 'IVR 兼容说明'],
  [editor, '请选择已发布 IVR', 'IVR 列表绑定'],
  [editor, '开启原因追溯', '原因追溯'],
  [report, '满意度', '统一满意度指标'],
  [report, '调查明细', '结果明细'],
  [report, '评价项目汇总', '逐评价项目汇总'],
  [fs.readFileSync('components/bot/BotTriggerManager.tsx', 'utf8'), '请选择已发布调查', '触发器问卷绑定'],
  [call, 'satisfactionSurveyResult', '通话记录留痕'],
  [types, 'SatisfactionSurveyBinding', '绑定数据模型'],
  [types, "'offered' | 'in_progress' | 'completed' | 'skipped' | 'abandoned' | 'failed'", '调查结果状态'],
];

for (const [content, snippet, name] of requirements) {
  if (!content.includes(snippet)) throw new Error(`满意度调查缺少${name}：${snippet}`);
}

console.log('satisfaction survey static check ok');
