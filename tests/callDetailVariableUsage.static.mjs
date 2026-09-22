// 检查通话详情的左侧栏：三个标签板块和四个变量分类连续排布、共用同一套折叠逻辑，
// 变量分类沿用「变量配置」页那套分类（id 与顺序对齐），只展示本次通话真正用到的变量。
// 侧边栏宽度固定（w-64），变量值可能很长且没有空格，溢出风险靠 truncate / break-all 守住。
import fs from 'node:fs';

const call = fs.readFileSync('components/call/CallRecordDetail.tsx', 'utf8');
const variableConfig = fs.readFileSync('components/bot/BotVariableConfig.tsx', 'utf8');

// 两个页面共用同一套变量分类，id 和顺序必须对齐，否则同一类变量会被认成两种东西。
// 这里只比 id：变量配置页的页签名称归它自己那部分管，不在本测试的范围内。
const tabPattern = /\{\s*id:\s*'(INPUT|CONVERSATION|EXTRACTION|ENTITY)',\s*label:\s*'([^']+)'/g;
const configIds = [...variableConfig.matchAll(tabPattern)].map(([, id]) => id);
if (configIds.length !== 4) {
  throw new Error(`变量配置页应有 4 个页签，实际解析到 ${configIds.length} 个，解析规则可能已失效`);
}

const callPattern = /\{\s*id:\s*'(INPUT|CONVERSATION|EXTRACTION|ENTITY)',\s*label:\s*'([^']+)'\s*\}/g;
const callCategories = [...call.matchAll(callPattern)].map(([, id, label]) => ({ id, label }));

if (JSON.stringify(callCategories.map((item) => item.id)) !== JSON.stringify(configIds)) {
  throw new Error(
    `通话详情变量分类的 id/顺序与变量配置页不一致：\n  变量配置页 ${JSON.stringify(configIds)}\n  通话详情   ${JSON.stringify(callCategories.map((item) => item.id))}`,
  );
}

// 分类名已统一规整为这四个，不带「话术」前缀，也不叫「通话变量」。
const expectedLabels = ['输入变量', '对话变量', '提取变量', '实体'];
if (JSON.stringify(callCategories.map((item) => item.label)) !== JSON.stringify(expectedLabels)) {
  throw new Error(
    `变量分类名应为 ${JSON.stringify(expectedLabels)}，实际 ${JSON.stringify(callCategories.map((item) => item.label))}`,
  );
}
for (const retired of ['话术输入变量', '通话变量']) {
  if (call.includes(retired)) {
    throw new Error(`通话详情变量分类不应再叫「${retired}」`);
  }
}

// 每条变量只展示「变量名 + 取值」两项，不展示英文变量名（code）。
if (/\bcode\b/.test(call)) {
  throw new Error('通话详情变量不应再展示英文变量名 code，只保留变量名和取值');
}

for (const snippet of [
  'VARIABLE_CATEGORIES.map',
  // 没用到变量的分类整段不渲染，不能留下空标题。
  'if (items.length === 0) return null;',
  'callDetail.variableUsages.filter',
  // 七个板块共用同一个折叠渲染函数，折叠行为必须一致。
  'const renderSection = (key: string, title: string, count: number | null, body: React.ReactNode)',
  'const expanded = expandedSections[key] ?? true;',
  // 取值可能很长且没有空格（比如通话 ID），必须允许任意位置换行。
  'break-all',
  // 变量名过长时截断，避免顶破侧边栏右边界。
  'truncate',
  // 通话统计保留在左侧栏最上面。
  '通话统计',
  // 变量名是浅灰标签、取值是深色加重文字，两者靠深浅和字重区分开。
  'bg-slate-100 py-0.5 px-1.5 text-[11px] font-medium text-slate-500',
  'break-all text-sm font-medium leading-5 text-slate-800',
]) {
  if (!call.includes(snippet)) {
    throw new Error(`通话详情左侧栏缺少实现：${snippet}`);
  }
}

// 三个标签板块必须走 renderSection，不能各写一套折叠逻辑。
for (const title of ['客户意向标签', '标签', '情绪标签']) {
  if (!call.includes(`renderSection('${title}', '${title}'`)) {
    throw new Error(`板块「${title}」没有走共用的折叠逻辑 renderSection`);
  }
}

// 通话统计必须在标签板块之前（在左侧栏最上面）。
const statsIndex = call.indexOf('通话统计');
const firstSectionIndex = call.indexOf("renderSection('客户意向标签'");
if (statsIndex === -1 || firstSectionIndex === -1 || statsIndex > firstSectionIndex) {
  throw new Error('通话统计应排在左侧栏最上面，位于客户意向标签等板块之前');
}

// 这几个板块已从左侧栏移除，不能再回来。
for (const removed of ['客户画像', '对话路径', '对话变量赋值结果']) {
  if (call.includes(removed)) {
    throw new Error(`通话详情左侧栏仍展示已移除板块：${removed}`);
  }
}

console.log('call detail variable usage static check ok');
