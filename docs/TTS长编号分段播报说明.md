# TTS 长编号分段播报说明

## 功能定义

开启后，系统在文本送入自研 TTS 前，自动识别手机号、长数字编号和字母数字混合编号，在编号内部按固定节律插入停顿。原始对话文本、变量值和通话记录不做修改。

前端配置字段：

```text
ttsIdentifierSlowReadingEnabled: boolean
```

- `true`：启用长编号分段播报。
- `false`：保持原有播报方式。
- 仅当 TTS 模型为自研 TTS 时生效。

## 识别顺序

按以下顺序匹配，前一种命中后不再重复处理同一段文本：

### 1. 中国大陆手机号

```regex
(?<!\d)1[3-9]\d{9}(?!\d)
```

固定按 `3-4-4` 分组：

```text
19110321134 → 191〔停顿〕1032〔停顿〕1134
```

### 2. 纯数字长编号

```regex
(?<![A-Za-z0-9])\d{10,32}(?![A-Za-z0-9])
```

从左向右每 4 个字符一组，最后不足 4 个字符单独成组：

```text
191103211345 → 1911〔停顿〕0321〔停顿〕1345
```

### 3. 字母数字混合编号

编号必须同时包含字母和数字，总长度为 10～32 个字符：

```regex
(?<![A-Za-z0-9])(?=[A-Za-z0-9]{10,32}(?![A-Za-z0-9]))(?=[A-Za-z0-9]*[A-Za-z])(?=[A-Za-z0-9]*\d)[A-Za-z0-9]+(?![A-Za-z0-9])
```

从左向右每 4 个字符一组：

```text
DZOE2024072482 → DZOE〔停顿〕2024〔停顿〕0724〔停顿〕82
SF123456789012 → SF12〔停顿〕3456〔停顿〕7890〔停顿〕12
```

## 停顿处理

- 默认组间停顿为 `300ms`。
- 只在相邻分组之间插入，编号开头和结尾不插入。
- 页面不展示内部标记；后端在调用自研 TTS 时转换为自研引擎支持的停顿标记。
- 停顿时长和分组规则先作为服务端配置项管理，不开放给客户。

## 避免误处理

不能只凭“连续 10 位”直接处理全部内容，应先排除特殊内容，再按置信度识别。

### 匹配优先级

1. 来源字段已明确标记为手机号、订单号、快递单号或业务编号时，直接处理。
2. 中国大陆手机号规则命中时，按手机号处理。
3. 通用长编号只有在前文 12 个字符内出现“订单号、订单编号、快递单号、运单号、物流单号、编号、编码、单号”等提示词时才处理。
4. 不满足以上条件的连续字符保持原样，宁可漏处理，不误改变正常内容。

### 必须排除的内容

- URL、邮箱地址、IP 地址、文件路径。
- 日期、时间、小数、金额、百分比、版本号。
- UUID、JWT、Base64、哈希值和程序代码。
- 验证码、密码及其他长度不足 10 位的短数字。
- 已经包含空格、停顿标记或其他 TTS 控制标记的内容。
- 超过 32 位的连续字符串，避免误处理密钥、Token 和哈希值。

### 重复与数量保护

- 同一段编号只处理一次，已经插入停顿标记的内容不得再次分组。
- 多条规则重叠时，按“手机号 → 明确业务字段 → 通用编号”的顺序取第一个结果。
- 单次播报最多处理 5 个长编号，超过部分保持原样，避免整段语音过慢。
- 只在编号内部插入停顿，原有标点、空格和编号前后文字保持不变。

### 异常回退

- 正则执行失败、处理超时或生成结果为空时，直接使用原文调用 TTS。
- 自研 TTS 不识别停顿标记或首次合成失败时，移除新增标记并使用原文重试一次。
- 回退不得阻塞通话，也不能把错误信息或内部标记播报给客户。
- 开关关闭、使用第三方 TTS 或未命中规则时，原文直接送入 TTS。
- 服务端保留总开关和租户开关，出现集中误判时可立即停用，不影响普通 TTS 播报。

### 监控记录

记录是否命中、命中类型、分组结果、是否回退和 TTS 合成结果，但日志中的手机号、订单号等内容应按现有隐私规则处理。持续统计命中率、回退率和合成失败率，用于判断规则是否产生负面效果。

## 处理位置

处理顺序建议为：复制原文生成播报工作文本 → 执行文本替换规则 → 基于替换后的文本重新识别 URL 等保护区间 → 长编号识别与分组 → 转换自研停顿标记 → 调用 TTS。保护区间和可信编号区间必须基于同一份工作文本计算，禁止复用替换前的字符位置。后端应保留处理前文本用于日志和排查，处理后的文本仅用于语音合成。

## 后端实现原则

不要用一条复杂正则直接完成识别和替换。建议只用简单正则找出候选字符，再用普通代码完成长度、类型、语境、排除区间和数量判断。这样可以避免不同语言正则引擎不兼容，也能降低正则回溯导致性能问题的风险。

候选正则：

```regex
[A-Za-z0-9]+
```

候选命中后依次判断：

1. 长度是否为 10～32。
2. 是否至少包含一个数字。
3. 是否落在 URL、邮箱、日期等受保护区间内。
4. 是否为手机号、明确类型的变量，或附近包含编号类关键词。
5. 本次文本已处理数量是否少于 5。

不要直接把 `[break]` 拼进普通字符串。内部应使用“文本片段”和“停顿片段”两种结构，最后由自研 TTS 适配层转换成引擎实际支持的格式，避免用户文本碰巧包含控制标记时发生注入或误播。

## TypeScript 参考代码

下面代码只负责识别和分段。URL、邮箱、日期等受保护区间应在进入该方法前由现有文本解析层生成。

```ts
type TextRange = {
  start: number;
  end: number;
};

type SpeechSegment =
  | { type: 'text'; value: string }
  | { type: 'pause'; milliseconds: 300 };

type OptimizeInput = {
  text: string;
  enabled: boolean;
  isSelfDevelopedTts: boolean;
  protectedRanges: TextRange[];
  trustedIdentifierRanges: TextRange[];
};

type OptimizeResult = {
  segments: SpeechSegment[];
  appliedCount: number;
  fallback: boolean;
};

const CANDIDATE_PATTERN = /[A-Za-z0-9]+/g;
const PHONE_PATTERN = /^1[3-9]\d{9}$/;
const IDENTIFIER_KEYWORDS = [
  '订单号', '订单编号', '快递单号', '运单号',
  '物流单号', '编号', '编码', '单号', '手机号', '电话号码',
];

// 判断两个文本区间是否有重叠。
function overlaps(range: TextRange, ranges: TextRange[]): boolean {
  return ranges.some((item) => range.start < item.end && range.end > item.start);
}

// 判断候选编号左侧是否存在明确的业务提示词。
function hasIdentifierContext(text: string, start: number): boolean {
  const context = text.slice(Math.max(0, start - 12), start);
  return IDENTIFIER_KEYWORDS.some((keyword) => context.includes(keyword));
}

// 按手机号或普通编号的节奏进行分组。
function groupIdentifier(token: string): string[] {
  if (PHONE_PATTERN.test(token)) {
    return [token.slice(0, 3), token.slice(3, 7), token.slice(7, 11)];
  }

  const groups: string[] = [];
  for (let index = 0; index < token.length; index += 4) {
    groups.push(token.slice(index, index + 4));
  }
  return groups;
}

// 生成供自研 TTS 使用的文本和停顿片段；任何异常都返回原文。
function optimizeIdentifierReading(input: OptimizeInput): OptimizeResult {
  const { text, enabled, isSelfDevelopedTts, protectedRanges, trustedIdentifierRanges } = input;

  if (!enabled || !isSelfDevelopedTts || !text || text.length > 5000) {
    return { segments: [{ type: 'text', value: text }], appliedCount: 0, fallback: false };
  }

  try {
    const segments: SpeechSegment[] = [];
    let cursor = 0;
    let appliedCount = 0;

    for (const match of text.matchAll(CANDIDATE_PATTERN)) {
      if (appliedCount >= 5 || match.index === undefined) break;

      const token = match[0];
      const range = { start: match.index, end: match.index + token.length };
      const validLength = token.length >= 10 && token.length <= 32;
      const containsDigit = /\d/.test(token);
      const protectedContent = overlaps(range, protectedRanges);
      const trustedIdentifier = overlaps(range, trustedIdentifierRanges);
      const phone = PHONE_PATTERN.test(token);
      const clearContext = hasIdentifierContext(text, range.start);

      if (!validLength || !containsDigit || protectedContent) continue;
      if (!phone && !trustedIdentifier && !clearContext) continue;

      if (range.start > cursor) {
        segments.push({ type: 'text', value: text.slice(cursor, range.start) });
      }

      const groups = groupIdentifier(token);
      groups.forEach((group, index) => {
        segments.push({ type: 'text', value: group });
        if (index < groups.length - 1) {
          segments.push({ type: 'pause', milliseconds: 300 });
        }
      });

      cursor = range.end;
      appliedCount += 1;
    }

    if (appliedCount === 0) {
      return { segments: [{ type: 'text', value: text }], appliedCount: 0, fallback: false };
    }

    if (cursor < text.length) {
      segments.push({ type: 'text', value: text.slice(cursor) });
    }

    // 删除停顿片段后必须能恢复原文，否则放弃优化。
    const restoredText = segments
      .filter((segment): segment is Extract<SpeechSegment, { type: 'text' }> => segment.type === 'text')
      .map((segment) => segment.value)
      .join('');

    if (restoredText !== text) {
      return { segments: [{ type: 'text', value: text }], appliedCount: 0, fallback: true };
    }

    return { segments, appliedCount, fallback: false };
  } catch (error: unknown) {
    logger.warn('TTS 编号分段处理失败，已回退原文', { error: normalizeError(error) });
    return { segments: [{ type: 'text', value: text }], appliedCount: 0, fallback: true };
  }
}
```

实际日志不得写入完整原文和完整编号，只记录请求标识、错误类型、规则版本和是否回退。

## 流式文本处理

LLM 的流式输出可能把一个编号拆在多个数据片段中，例如第一段为 `订单号是 SF1234`，下一段才是 `56789012。`。如果逐段立即送入 TTS，会漏掉分段或把同一编号处理两次。

流式处理必须满足：

- 每次保留数据片段末尾尚未结束的连续字母数字串，遇到空格、标点或本轮文本结束后再判断。
- 缓冲区最多保留 32 个字符；超过 32 个字符后按原文释放，避免异常内容长期阻塞播报。
- 缓冲状态只属于当前通话的当前播报请求，不允许使用全局变量，避免不同通话相互串扰。
- 通话取消、用户打断、TTS 超时或连接断开时立即清空缓冲区。
- 已经送入 TTS 的字符不得再次进入下一次匹配。
- 如果自研 TTS 支持一次接收结构化文本片段，优先在完整语句层处理；只有真正的低延迟流式场景才使用尾部缓冲。

## 能力判断

后端不能只根据前端传入的模型名称判断是否支持。应由 TTS 服务端维护音色能力，例如 `supportsSegmentedPause`。只有前端开关开启、当前音色能力支持、服务端总开关开启三个条件同时满足时才执行。前端参数不可作为唯一可信依据。

不同通话必须使用独立的处理实例；不要共享带状态的全局正则、字符缓冲或片段数组。

## TTS 调用异常处理

分段模块成功，不代表 TTS 一定成功。调用层还要区分是否已经产生音频：

```ts
async function synthesizeWithSafeFallback(text: string): Promise<AudioResult> {
  const optimized = optimizeIdentifierReading(buildOptimizeInput(text));

  try {
    return await selfDevelopedTts.synthesizeSegments(optimized.segments);
  } catch (error: unknown) {
    const audioStarted = isAudioOutputStarted(error);

    // 尚未返回任何音频时，可以安全地用原文重试一次。
    if (!audioStarted && optimized.appliedCount > 0) {
      return await selfDevelopedTts.synthesizeText(text);
    }

    // 已经播放部分音频时不能从头重播，避免客户听到重复内容。
    throw error;
  }
}
```

第二次原文合成仍失败时，交给现有 TTS 异常策略处理，不允许继续循环重试。分段处理本身必须是纯函数，不写数据库、不改原始变量，也不抛出异常阻断通话。

## 必测错误方向

上线前至少覆盖以下情况：

- 开关关闭、第三方 TTS、空文本和超长文本保持原样。
- 9 位、10 位、32 位和 33 位的边界。
- 纯数字、大小写字母数字混合、纯字母和含中文字符。
- 手机号的 3-4-4 分组及普通编号的每 4 位分组。
- URL、邮箱、IP、日期、时间、金额、版本号、UUID、JWT 和哈希值不处理。
- 同一文本包含多个编号、超过 5 个编号及编号之间存在标点。
- 已有停顿或 TTS 控制标记不重复处理。
- 文本替换后再分段，字符不能丢失、重复或改变顺序。
- 分段合成失败且尚未播放时回退原文一次。
- 已播放部分音频时不重新从头播报。
- 规则模块内部异常时原文仍能正常进入 TTS。
- 日志不记录完整手机号、订单号或敏感控制标记。

## 上线保护

建议先仅对测试租户开放，观察误命中率、回退率、TTS 失败率和平均合成耗时，再逐步开放。服务端必须保留全局熔断开关；发现误读或合成异常升高时，可直接关闭本能力并恢复原文播报，无需修改客户配置。
