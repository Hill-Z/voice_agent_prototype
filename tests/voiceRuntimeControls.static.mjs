// 检查语音运行控制配置及播放进度同步入口。
import fs from 'node:fs';

const strategy = fs.readFileSync('components/bot/BotStrategyConfig.tsx', 'utf8');
const tool = fs.readFileSync('components/bot/agent/AgentToolModal.tsx', 'utf8');
const trigger = fs.readFileSync('components/bot/BotTriggerManager.tsx', 'utf8');
const basic = fs.readFileSync('components/bot/BotBasicConfig.tsx', 'utf8');
const callDetail = fs.readFileSync('components/call/CallRecordDetail.tsx', 'utf8');
const types = fs.readFileSync('types.ts', 'utf8');

for (const text of ['打断灵敏度', '有效短回复词', '强制打断词', '打断后话术']) {
  if (!strategy.includes(text)) throw new Error(`对话策略缺少：${text}`);
}
if (strategy.includes('忽略短词') || strategy.includes('附和词处理')) throw new Error('对话策略仍展示已取消的短词配置');

for (const text of ['重复调用', '用户打断后', '执行期间暂停静默计时', '首次反馈（秒）', '反馈间隔（秒）', '最大执行（秒）', '等待反馈话术']) {
  if (!tool.includes(text)) throw new Error(`工具配置缺少：${text}`);
}

for (const text of ['调用接口', '请求参数映射', '返回值映射', '通话变量', '必填']) {
  if (!trigger.includes(text)) throw new Error(`触发器缺少：${text}`);
}
if (trigger.includes("value: 'pre_call_fetch'")) throw new Error('触发器仍展示独立的前置数据拉取动作');
if (!basic.includes('上下文压缩')) throw new Error('模型配置缺少上下文压缩');
if (!callDetail.includes('role="progressbar"') || !callDetail.includes('playingAudioIndex') || !callDetail.includes('CheckCircle2')) throw new Error('通话详情缺少播放自动跟随');

for (const text of ['duplicateCallPolicy?', 'interruptionPolicy?', 'pauseSilenceTimer?', 'firstProgressFeedbackSeconds?', 'progressSpeeches?', 'contextCompactionEnabled?', 'interruptionSensitivity?', 'validShortReplyWords?', 'forceInterruptWords?', 'forceInterruptReply?: string | string[];', 'requestMappings?', 'responseMappings?']) {
  if (!types.includes(text)) throw new Error(`配置类型缺少：${text}`);
}

console.log('voice runtime controls static check ok');
