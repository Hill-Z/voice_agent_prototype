import { readFileSync } from 'node:fs';

const component = readFileSync(new URL('../components/seats/SeatManager.tsx', import.meta.url), 'utf8');
const types = readFileSync(new URL('../types.ts', import.meta.url), 'utf8');

for (const text of ['排队语音提示', 'queuePromptAudioId']) {
  if (!component.includes(text)) {
    throw new Error(`Expected SeatManager to contain: ${text}`);
  }
}

if (!types.includes('queuePromptAudioId?: string')) {
  throw new Error('Expected Seat type to persist queuePromptAudioId.');
}

console.log('seat manager queue prompt config ok');
