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
const data = fs.readFileSync('components/satisfaction/satisfactionData.ts', 'utf8');

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
  [manager, '已发布问卷不能修改，需要调整请复制新建。', '发布锁定说明'],
  [data, 'SATISFACTION_IVR_FLOWS', 'IVR 流程题目定义'],
  [report, 'resolveSurveyQuestions', '报表按 IVR 流程解析题目'],
  [manager, '总体满意度', '新建问卷预置核心满意度题'],
  [call, 'buildCallDetailFromSurvey', '通话记录按 Call ID 解析满意度记录'],
];

for (const [content, snippet, name] of requirements) {
  if (!content.includes(snippet)) throw new Error(`满意度调查缺少${name}：${snippet}`);
}

// 列表页只保留名称、采集方式、状态、更新时间和操作，有效回答是逐题口径，不下沉到问卷列表。
if (manager.includes('有效回答')) throw new Error('问卷列表不应再展示有效回答列');

// 开放回答的分类由模型按内容归纳，客户不再手配枚举；评分和枚举题也不需要聚合提示词。
if (editor.includes('聚合分类')) throw new Error('编辑器不应再要求客户填写开放回答的聚合分类');
if (editor.includes('placeholder="枚举值"')) throw new Error('枚举选项不应再单独填写枚举值');

// 去掉注释后再做「不应再出现」检查：说明性注释里会提到被移除的字段名（例如解释某个开关为什么不再展开），
// 直接匹配整份源码会把注释一起算进去，变成假红。
const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const editorCode = stripComments(editor);
const reportCode = stripComments(report);

// 原因追溯只保留开关，触发条件、追问话术和原因归类都由平台统一处理，客户不再逐题填写。
for (const removed of ['触发条件', '触发回答', '追问话术', '原因聚合提示词', '原因分类']) {
  if (editorCode.includes(removed)) throw new Error(`编辑器不应再要求配置原因追溯细节：${removed}`);
}

// 满意度趋势图按产品决定移除；满意度只在统计卡上按核心题口径计算，不再按天出趋势线。
if (reportCode.includes('满意度趋势') || reportCode.includes('SatisfactionTrendChart')) throw new Error('报表不应再展示满意度趋势');

// 原因追溯不再做聚合，评价项目汇总不再有原因列；评价项目列也不再标核心满意度题。
if (reportCode.includes('原因追溯</th>')) throw new Error('评价项目汇总不应再有原因追溯列');
if (reportCode.includes('核心满意度题</span>')) throw new Error('评价项目汇总不应再标核心满意度题');
if (reportCode.includes('reasonDistribution')) throw new Error('报表不应再计算原因聚合分布');

// 评价项目汇总没有可汇总的数据时整块不渲染，不再留占位提示顶着页面。
if (reportCode.includes('请选择一份调查问卷')) throw new Error('评价项目汇总没数据时应整块不渲染，不应保留占位提示');

// 调查明细只到「完成状态」为止：核心题结果按产品决定不再在报表里展开，要看就进通话记录。
if (reportCode.includes('核心题结果')) throw new Error('调查明细不应再有核心题结果列');

console.log('satisfaction survey static check ok');
