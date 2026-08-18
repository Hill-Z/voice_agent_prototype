// 语音输出安全解析器：在流式文本进入 TTS 前过滤内部标签，并把控制指令拆成独立动作。

export type VoiceSafetyAction =
  | { type: 'transfer'; target: string; raw: string }
  | { type: 'hangup'; raw: string };

export interface VoiceSafetyState {
  pending: string;
  suppressedTag?: string;
}

export interface VoiceSafetyChunkResult {
  speech: string;
  actions: VoiceSafetyAction[];
  state: VoiceSafetyState;
}

const ACTION_PREFIXES = ['#Transfer[', '#Hangup['] as const;

// 创建单通电话、单次模型输出使用的解析状态。
export function createVoiceSafetyState(): VoiceSafetyState {
  return { pending: '' };
}

// 把兼容标签转换为内部动作，标签文本本身永远不会进入 TTS。
function parseActionToken(token: string): VoiceSafetyAction | null {
  if (token.startsWith('#Transfer[')) {
    const payload = token.slice('#Transfer['.length, -1).trim();
    const target = payload.startsWith('ivr:') ? payload.slice(4).trim() : payload;
    return target ? { type: 'transfer', target, raw: token } : null;
  }

  if (token.startsWith('#Hangup[')) {
    return { type: 'hangup', raw: token };
  }

  return null;
}

// 判断当前分片末尾是否可能只是控制动作的半截前缀。
function isPartialActionPrefix(value: string): boolean {
  return ACTION_PREFIXES.some((prefix) => prefix.startsWith(value));
}

// 逐分片解析模型输出；普通文字立即放行，仅缓存未闭合标签和动作。
export function processVoiceSafetyChunk(
  currentState: VoiceSafetyState,
  chunk: string,
  isFinal = false,
): VoiceSafetyChunkResult {
  const state: VoiceSafetyState = { ...currentState, pending: '' };
  const actions: VoiceSafetyAction[] = [];
  let speech = '';
  let source = `${currentState.pending}${chunk}`;

  while (source) {
    if (state.suppressedTag) {
      const closingTag = `</${state.suppressedTag}>`;
      const closeIndex = source.toLowerCase().indexOf(closingTag.toLowerCase());
      if (closeIndex < 0) {
        if (isFinal) state.suppressedTag = undefined;
        source = '';
        break;
      }
      source = source.slice(closeIndex + closingTag.length);
      state.suppressedTag = undefined;
      continue;
    }

    const tagIndex = source.indexOf('<');
    const actionIndex = source.indexOf('#');
    const controlIndexes = [tagIndex, actionIndex].filter((index) => index >= 0);

    if (controlIndexes.length === 0) {
      speech += source;
      source = '';
      break;
    }

    const controlIndex = Math.min(...controlIndexes);
    speech += source.slice(0, controlIndex);
    source = source.slice(controlIndex);

    if (source.startsWith('<')) {
      if (!/^<\/?[A-Za-z]/.test(source)) {
        speech += '<';
        source = source.slice(1);
        continue;
      }

      const tagEnd = source.indexOf('>');
      if (tagEnd < 0) {
        if (!isFinal) state.pending = source;
        source = '';
        break;
      }

      const rawTag = source.slice(0, tagEnd + 1);
      const nameMatch = rawTag.match(/^<\/?\s*([A-Za-z][A-Za-z0-9_-]*)/);
      const tagName = nameMatch?.[1]?.toLowerCase();
      const isClosing = /^<\//.test(rawTag);
      const isSelfClosing = /\/\s*>$/.test(rawTag);
      source = source.slice(tagEnd + 1);

      if (tagName && !isClosing && !isSelfClosing) {
        state.suppressedTag = tagName;
      }
      continue;
    }

    const knownPrefix = ACTION_PREFIXES.find((prefix) => source.startsWith(prefix));
    if (knownPrefix) {
      const actionEnd = source.indexOf(']');
      if (actionEnd < 0) {
        if (!isFinal) state.pending = source;
        source = '';
        break;
      }

      const token = source.slice(0, actionEnd + 1);
      const action = parseActionToken(token);
      if (action) actions.push(action);
      source = source.slice(actionEnd + 1);
      continue;
    }

    if (!isFinal && isPartialActionPrefix(source)) {
      state.pending = source;
      source = '';
      break;
    }

    const unknownAction = source.match(/^#[A-Za-z][A-Za-z0-9_]*\[/);
    if (unknownAction) {
      const actionEnd = source.indexOf(']');
      if (actionEnd < 0) {
        if (!isFinal) state.pending = source;
        source = '';
        break;
      }
      source = source.slice(actionEnd + 1);
      continue;
    }

    speech += '#';
    source = source.slice(1);
  }

  if (isFinal) state.pending = '';
  return { speech, actions, state };
}

// 处理非流式完整输出，便于调试和回归测试。
export function sanitizeVoiceModelOutput(output: string): Omit<VoiceSafetyChunkResult, 'state'> {
  const result = processVoiceSafetyChunk(createVoiceSafetyState(), output, true);
  return { speech: result.speech, actions: result.actions };
}
