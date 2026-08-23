// 检查音色市场是否覆盖品牌、语种、筛选、试听和选择的核心原型能力。
import fs from 'node:fs';

const page = fs.readFileSync('components/market/VoiceMarket.tsx', 'utf8');
const data = fs.readFileSync('components/market/voiceMarketData.ts', 'utf8');
const types = fs.readFileSync('types.ts', 'utf8');

const requiredPageSnippets = [
  '音色市场',
  '按厂商筛选',
  '按语种筛选',
  '按性别筛选',
  'grid grid-cols-12',
  '>音色</span>',
  '>厂商</span>',
  '>语种</span>',
  '>性别</span>',
  '>标签</span>',
  'text-right">试听</span>',
  'togglePlay',
];

const requiredDataSnippets = [
  '自研音色',
  'MiniMax',
  '豆包',
  'Google',
  'ElevenLabs',
  '中文',
  '英文',
  '阿拉伯语',
  '印尼语',
  '泰语',
  '马来西亚语',
];

for (const snippet of requiredPageSnippets) {
  if (!page.includes(snippet)) throw new Error(`音色市场页面缺少：${snippet}`);
}

for (const snippet of requiredDataSnippets) {
  if (!data.includes(snippet)) throw new Error(`音色市场数据缺少：${snippet}`);
}

if (!types.includes("gender: 'Male' | 'Female' | 'Neutral'")) {
  throw new Error('音色类型缺少中性音色支持');
}

console.log('voice market static check ok');
