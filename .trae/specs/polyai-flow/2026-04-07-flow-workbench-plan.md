# Flow Workbench Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the new `流程配置` workbench as a PolyAI-style multi-flow prototype with annotations and half-simulated debugging, while keeping the existing intent workflow untouched.

**Architecture:** Expand `flowConfig` from a single-canvas model into a workbench model that contains multiple flows, prototype annotations, and debug scenarios. Refactor the current `FlowEditor` into a three-region workbench container with a left flow list, center canvas, and right contextual panel that switches between node configuration, PRD annotation details, and debug details. Keep the runtime fake and deterministic: state changes, retries, and flow jumps are simulated in the browser with seeded demo data.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind, lucide-react

---

### Task 1: Reshape Flow Data Model For Multi-Flow Prototype

**Files:**
- Modify: `C:\Users\13609\.trae-cn\AI-voice-bot\types.ts`
- Modify: `C:\Users\13609\.trae-cn\AI-voice-bot\components\bot\BotConfigForm.tsx`
- Test: `C:\Users\13609\.trae-cn\AI-voice-bot` via `npm run build`

- [ ] **Step 1: Add the failing type usage in the form layer**

```typescript
// BotConfigForm.tsx
const flowConfig = config.flowConfig ?? {
  id: 'flow_demo',
  name: 'Flow Workbench',
  entryFlowId: 'main',
  flows: [],
  annotations: [],
  debugScenarios: [],
  metadata: {},
};

<FlowEditor
  initialFlow={flowConfig}
  // ...
/>;
```

- [ ] **Step 2: Run build to verify the current types fail against the new shape**

Run: `npm run build`
Expected: TypeScript errors because `FlowConfig` does not yet define `entryFlowId`, `flows`, `annotations`, or `debugScenarios`.

- [ ] **Step 3: Add the minimal new flow prototype types**

```typescript
export type FlowStepKind = 'default' | 'function' | 'collect' | 'exit';

export interface FlowEntityConfig {
  enabled: boolean;
  entityName?: string;
  entityType?: 'text' | 'phone' | 'number' | 'datetime' | 'address' | 'email' | 'alphanumeric';
  prompt?: string;
  asrBiasing?: 'default' | 'alphanumeric' | 'name' | 'datetime' | 'number' | 'address';
  required?: boolean;
}

export interface FlowRetryConfig {
  enabled: boolean;
  maxAttempts: number;
  noInputPrompt?: string;
  noMatchPrompt?: string;
  fallbackTargetId?: string;
}

export interface FlowAnnotation {
  id: string;
  index: number;
  targetType: 'page' | 'flow' | 'node' | 'panel' | 'toolbar';
  targetId: string;
  title: string;
  summary: string;
  details: string;
  status?: 'draft' | 'ready';
}

export interface FlowDebugScenario {
  id: string;
  name: string;
  initialState: Record<string, any>;
  mockInputs: string[];
}

export interface FlowNodeData {
  name: string;
  description?: string;
  stepType?: FlowStepKind;
  stepPrompt?: StepPromptConfig;
  visibleFunctionIds?: string[];
  transitionFunctionIds?: string[];
  toolIds?: string[];
  fewShotExamples?: Array<{ input: string; output: string }>;
  entityConfig?: FlowEntityConfig;
  retryConfig?: FlowRetryConfig;
  exitType?: ExitNodeType;
  gotoFlowId?: string;
  [key: string]: any;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  edgeType?: 'normal' | 'conditional' | 'fallback' | 'goto_flow';
  conditionSummary?: string;
  priority?: number;
}

export interface FlowDefinition {
  id: string;
  name: string;
  isEntry?: boolean;
  nodes: FlowNode[];
  edges: FlowEdge[];
  metadata?: FlowMetadata;
}

export interface FlowConfig {
  id: string;
  name: string;
  entryFlowId: string;
  flows: FlowDefinition[];
  annotations: FlowAnnotation[];
  debugScenarios: FlowDebugScenario[];
  metadata?: FlowMetadata;
}
```

- [ ] **Step 4: Seed `BotConfigForm` with a safe empty workbench config**

```typescript
const EMPTY_FLOW_CONFIG: FlowConfig = {
  id: 'flow_demo',
  name: 'Flow Workbench',
  entryFlowId: 'main',
  flows: [],
  annotations: [],
  debugScenarios: [],
  metadata: {}
};
```

- [ ] **Step 5: Run build to verify the new type model compiles**

Run: `npm run build`
Expected: Build progresses past the type-model errors from Step 2.

### Task 2: Refactor FlowEditor Into A Workbench Container

**Files:**
- Modify: `C:\Users\13609\.trae-cn\AI-voice-bot\components\flow\FlowEditor.tsx`
- Create: `C:\Users\13609\.trae-cn\AI-voice-bot\components\flow\FlowListPanel.tsx`
- Create: `C:\Users\13609\.trae-cn\AI-voice-bot\components\flow\FlowTopToolbar.tsx`
- Create: `C:\Users\13609\.trae-cn\AI-voice-bot\components\flow\FlowCanvas.tsx`
- Test: `C:\Users\13609\.trae-cn\AI-voice-bot` via `npm run build`

- [ ] **Step 1: Add the failing component imports and split responsibilities**

```typescript
import FlowListPanel from './FlowListPanel';
import FlowTopToolbar from './FlowTopToolbar';
import FlowCanvas from './FlowCanvas';
```

- [ ] **Step 2: Run build to verify the workbench split fails before implementation**

Run: `npm run build`
Expected: Module resolution errors because the new workbench components do not exist yet.

- [ ] **Step 3: Create the left flow list panel**

```typescript
// FlowListPanel.tsx
import React from 'react';
import { FlowDefinition } from '../../types';

interface FlowListPanelProps {
  flows: FlowDefinition[];
  activeFlowId: string;
  onSelect: (flowId: string) => void;
}

export default function FlowListPanel({ flows, activeFlowId, onSelect }: FlowListPanelProps) {
  return (
    <div className="w-64 bg-slate-50 border-r border-gray-200 p-3 space-y-2 overflow-y-auto">
      {flows.map(flow => (
        <button
          key={flow.id}
          onClick={() => onSelect(flow.id)}
          className={`w-full text-left rounded-lg border px-3 py-2 ${
            flow.id === activeFlowId ? 'bg-white border-primary text-primary' : 'bg-white border-gray-200 text-slate-700'
          }`}
        >
          <div className="text-sm font-semibold">{flow.name}</div>
          <div className="text-[11px] text-slate-400">{flow.nodes.length} nodes</div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create the top toolbar for view mode and annotation mode**

```typescript
// FlowTopToolbar.tsx
import React from 'react';

interface FlowTopToolbarProps {
  annotationMode: boolean;
  onToggleAnnotationMode: () => void;
  onSave: () => void;
}

export default function FlowTopToolbar({ annotationMode, onToggleAnnotationMode, onSave }: FlowTopToolbarProps) {
  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      <div className="text-sm font-semibold text-slate-700">Flow Workbench</div>
      <div className="flex items-center gap-2">
        <button onClick={onToggleAnnotationMode} className="px-3 py-1.5 border rounded text-xs">
          {annotationMode ? '隐藏标号' : '显示标号'}
        </button>
        <button onClick={onSave} className="px-3 py-1.5 bg-primary text-white rounded text-xs">
          保存原型
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Move canvas-only rendering into `FlowCanvas`**

```typescript
// FlowCanvas.tsx
import React from 'react';
import { FlowDefinition, FlowAnnotation } from '../../types';

interface FlowCanvasProps {
  flow: FlowDefinition;
  annotations: FlowAnnotation[];
  annotationMode: boolean;
  selectedAnnotationId?: string | null;
  onAnnotationSelect: (annotationId: string) => void;
}

export default function FlowCanvas({ flow, annotations, annotationMode, onAnnotationSelect }: FlowCanvasProps) {
  return <div className="flex-1 relative overflow-hidden bg-slate-50">{/* existing canvas rendering goes here */}</div>;
}
```

- [ ] **Step 6: Update `FlowEditor` to orchestrate active flow, toolbar, and canvas**

```typescript
const [activeFlowId, setActiveFlowId] = useState(initialFlow.entryFlowId);
const [annotationMode, setAnnotationMode] = useState(false);
const activeFlow = initialFlow.flows.find(flow => flow.id === activeFlowId) ?? initialFlow.flows[0];

return (
  <div className="flex flex-col h-full">
    <FlowTopToolbar
      annotationMode={annotationMode}
      onToggleAnnotationMode={() => setAnnotationMode(v => !v)}
      onSave={handleSave}
    />
    <div className="flex flex-1 overflow-hidden">
      <FlowListPanel flows={initialFlow.flows} activeFlowId={activeFlowId} onSelect={setActiveFlowId} />
      <FlowCanvas flow={activeFlow} annotations={initialFlow.annotations} annotationMode={annotationMode} onAnnotationSelect={setSelectedAnnotationId} />
      {/* existing right panel placeholder */}
    </div>
  </div>
);
```

- [ ] **Step 7: Run build to verify the workbench shell compiles**

Run: `npm run build`
Expected: Build succeeds with the editor now acting as a workbench container.

### Task 3: Expand Right Panel Into Node Config, PRD, And Debug Modes

**Files:**
- Modify: `C:\Users\13609\.trae-cn\AI-voice-bot\components\flow\FlowNodeConfig.tsx`
- Create: `C:\Users\13609\.trae-cn\AI-voice-bot\components\flow\FlowAnnotationPanel.tsx`
- Create: `C:\Users\13609\.trae-cn\AI-voice-bot\components\flow\FlowDebugPanel.tsx`
- Test: `C:\Users\13609\.trae-cn\AI-voice-bot` via `npm run build`

- [ ] **Step 1: Add the failing right-panel mode API in `FlowEditor`**

```typescript
type RightPanelMode = 'node' | 'annotation' | 'debug';

const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>('node');
```

- [ ] **Step 2: Run build to verify the new right-panel components are missing**

Run: `npm run build`
Expected: Module resolution errors for `FlowAnnotationPanel` and `FlowDebugPanel`.

- [ ] **Step 3: Create the PRD annotation panel**

```typescript
// FlowAnnotationPanel.tsx
import React from 'react';
import { FlowAnnotation } from '../../types';

export default function FlowAnnotationPanel({ annotation }: { annotation?: FlowAnnotation | null }) {
  if (!annotation) return <div className="w-80 border-l border-gray-200 bg-white p-4 text-sm text-slate-400">选择一个标号查看 PRD</div>;
  return (
    <div className="w-80 border-l border-gray-200 bg-white p-4 space-y-3">
      <div className="text-xs text-slate-400">#{annotation.index}</div>
      <div className="text-base font-semibold text-slate-800">{annotation.title}</div>
      <div className="text-sm text-slate-500">{annotation.summary}</div>
      <div className="text-sm leading-6 text-slate-700 whitespace-pre-wrap">{annotation.details}</div>
    </div>
  );
}
```

- [ ] **Step 4: Create the half-sim debug panel**

```typescript
// FlowDebugPanel.tsx
import React from 'react';

interface FlowDebugPanelProps {
  currentNodeName?: string;
  state: Record<string, any>;
  history: string[];
}

export default function FlowDebugPanel({ currentNodeName, state, history }: FlowDebugPanelProps) {
  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="text-sm font-semibold text-slate-800">半模拟调试</div>
        <div className="text-xs text-slate-400 mt-1">当前节点：{currentNodeName ?? '未开始'}</div>
      </div>
      <div className="p-4 space-y-4 overflow-y-auto">
        <pre className="text-[11px] bg-slate-50 p-3 rounded">{JSON.stringify(state, null, 2)}</pre>
        <div className="space-y-2">
          {history.map((item, index) => <div key={index} className="text-xs text-slate-600">{item}</div>)}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add entity and retry sections to `FlowNodeConfig`**

```typescript
<CollapsibleSection title="实体采集" icon={<BrainCircuit size={16} />}>
  <Select
    label="实体类型"
    options={[
      { label: '文本', value: 'text' },
      { label: '手机号', value: 'phone' },
      { label: '验证码/字母数字', value: 'alphanumeric' },
      { label: '日期时间', value: 'datetime' }
    ]}
    value={localNode.data.entityConfig?.entityType || 'text'}
    onChange={(e) => handleNodeChange({ entityConfig: { ...localNode.data.entityConfig, enabled: true, entityType: e.target.value } })}
  />
</CollapsibleSection>

<CollapsibleSection title="重试策略" icon={<Thermometer size={16} />}>
  <Select
    label="最大重试次数"
    options={[1, 2, 3].map(value => ({ label: `${value} 次`, value }))}
    value={localNode.data.retryConfig?.maxAttempts || 3}
    onChange={(e) => handleNodeChange({ retryConfig: { ...localNode.data.retryConfig, enabled: true, maxAttempts: Number(e.target.value) } })}
  />
</CollapsibleSection>
```

- [ ] **Step 6: Mount the correct right panel by mode**

```typescript
{rightPanelMode === 'node' && <FlowNodeConfig node={selectedNode ?? null} /* ... */ />}
{rightPanelMode === 'annotation' && <FlowAnnotationPanel annotation={selectedAnnotation} />}
{rightPanelMode === 'debug' && <FlowDebugPanel currentNodeName={debugCurrentNodeName} state={debugState} history={debugHistory} />}
```

- [ ] **Step 7: Run build to verify the panel system compiles**

Run: `npm run build`
Expected: Build succeeds and the right side can host config, annotation, and debug content.

### Task 4: Seed Demo Data For Entry Flow, Sub-Flows, And PRD Annotations

**Files:**
- Modify: `C:\Users\13609\.trae-cn\AI-voice-bot\components\bot\BotConfigForm.tsx`
- Modify: `C:\Users\13609\.trae-cn\AI-voice-bot\types.ts`
- Test: `C:\Users\13609\.trae-cn\AI-voice-bot` via `npm run build`

- [ ] **Step 1: Add failing usage of `entryFlowId`, sub-flows, and annotations in the default data**

```typescript
const DEMO_FLOW_CONFIG: FlowConfig = {
  id: 'flow_demo',
  name: 'PolyAI Flow Demo',
  entryFlowId: 'main',
  flows: [
    { id: 'main', name: '主入口 Flow', isEntry: true, nodes: [], edges: [] },
    { id: 'verification', name: '身份验证 Flow', nodes: [], edges: [] },
    { id: 'lookup', name: '订单查询 Flow', nodes: [], edges: [] },
    { id: 'handoff', name: '转人工 Flow', nodes: [], edges: [] }
  ],
  annotations: [],
  debugScenarios: [],
  metadata: {}
};
```

- [ ] **Step 2: Run build to verify missing or incompatible demo structure before filling it in**

Run: `npm run build`
Expected: Type or property errors until all demo objects use the new node data shape consistently.

- [ ] **Step 3: Seed the main and verification flows with realistic prototype nodes**

```typescript
const mainFlowNodes = [
  { id: 'start', type: FlowNodeType.START, position: { x: 80, y: 220 }, data: { name: '开始' } },
  {
    id: 'collect_phone',
    type: FlowNodeType.DEFAULT,
    position: { x: 320, y: 200 },
    data: {
      name: '收集手机号',
      stepType: 'collect',
      stepPrompt: { prompt: '请收集用户手机号用于身份验证。', visibleFunctionIds: [], transitionFunctionIds: ['builtin_goto_flow'] },
      entityConfig: { enabled: true, entityName: 'phone_number', entityType: 'phone', asrBiasing: 'number', required: true },
      retryConfig: { enabled: true, maxAttempts: 3, noInputPrompt: '请说一下您的手机号。', noMatchPrompt: '手机号没有听清，请重新说一遍。' }
    }
  }
];
```

- [ ] **Step 4: Seed page-level annotations for the major review points**

```typescript
annotations: [
  {
    id: 'ann_toolbar_mode',
    index: 1,
    targetType: 'toolbar',
    targetId: 'annotation_mode_toggle',
    title: '标号模式开关',
    summary: '切换 Axure 式评审标号。',
    details: '打开后页面显示所有关键功能点编号，点击编号后右侧切换到 PRD 说明模式。'
  },
  {
    id: 'ann_collect_step',
    index: 2,
    targetType: 'node',
    targetId: 'collect_phone',
    title: '实体采集节点',
    summary: '展示 Collect Step 的实体类型、ASR biasing 和重试策略。',
    details: '用于模拟 PolyAI Flow 中的 collect step，覆盖手机号、验证码、日期时间等场景。'
  }
]
```

- [ ] **Step 5: Seed one deterministic debug scenario**

```typescript
debugScenarios: [
  {
    id: 'scenario_verify_retry',
    name: '验证失败后重试并转人工',
    initialState: { retryCount: 0, isVerified: false },
    mockInputs: ['13800138000', '验证码不对', '验证码还是不对']
  }
]
```

- [ ] **Step 6: Run build to verify the seeded workbench data compiles**

Run: `npm run build`
Expected: Build succeeds with the new workbench opening directly into a rich demo state.

### Task 5: Implement Half-Sim Debugging And Annotation Overlay

**Files:**
- Modify: `C:\Users\13609\.trae-cn\AI-voice-bot\components\flow\FlowEditor.tsx`
- Modify: `C:\Users\13609\.trae-cn\AI-voice-bot\components\flow\FlowCanvas.tsx`
- Test: `C:\Users\13609\.trae-cn\AI-voice-bot` via `npm run build`

- [ ] **Step 1: Add the failing debug state and annotation selection wiring**

```typescript
const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
const [debugState, setDebugState] = useState<Record<string, any>>({});
const [debugHistory, setDebugHistory] = useState<string[]>([]);
```

- [ ] **Step 2: Run build to verify the debug wiring is incomplete before implementation**

Run: `npm run build`
Expected: Prop or variable errors where the canvas and panel contracts are not wired yet.

- [ ] **Step 3: Render annotation badges over matching nodes and toolbar targets**

```typescript
{annotationMode && annotations
  .filter(annotation => annotation.targetType === 'node')
  .map(annotation => (
    <button
      key={annotation.id}
      onClick={() => onAnnotationSelect(annotation.id)}
      className="absolute w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold"
      style={{ left: node.position.x + 150, top: node.position.y - 10 }}
    >
      {annotation.index}
    </button>
  ))}
```

- [ ] **Step 4: Implement a deterministic fake run for the seeded scenario**

```typescript
const runDebugScenario = () => {
  setRightPanelMode('debug');
  setDebugState({ retryCount: 0, phone_number: '13800138000', isVerified: false });
  setDebugHistory([
    '进入主入口 Flow',
    '执行收集手机号节点',
    '跳转到身份验证子 Flow',
    '验证失败，触发重试 #1',
    '验证失败，触发重试 #2',
    '超过重试上限，进入转人工 Flow'
  ]);
};
```

- [ ] **Step 5: Add a toolbar action to launch the fake debug scenario**

```typescript
<button onClick={runDebugScenario} className="px-3 py-1.5 border rounded text-xs">
  半模拟调试
</button>
```

- [ ] **Step 6: Run final build verification**

Run: `npm run build`
Expected: Vite build completes successfully with the new workbench, annotations, and debug simulation.

- [ ] **Step 7: Commit the implementation**

```bash
git add types.ts components/bot/BotConfigForm.tsx components/flow/FlowEditor.tsx components/flow/FlowNodeConfig.tsx components/flow/FlowListPanel.tsx components/flow/FlowTopToolbar.tsx components/flow/FlowCanvas.tsx components/flow/FlowAnnotationPanel.tsx components/flow/FlowDebugPanel.tsx .trae/specs/polyai-flow/2026-04-07-flow-workbench-plan.md
git commit -m "feat: build flow workbench prototype"
```
