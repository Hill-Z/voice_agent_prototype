import React from 'react';
import { Activity, Database, Play, Plus, Route, Trash2, X } from 'lucide-react';
import { FlowDebugScenario } from '../../types';

interface FlowDebugPanelProps {
  scenarios: FlowDebugScenario[];
  selectedScenarioId: string | null;
  currentNodeName?: string | null;
  state: Record<string, any>;
  history: string[];
  onClose?: () => void;
  onCreateScenario?: () => void;
  onDeleteScenario?: (scenarioId: string) => void;
  onRunScenario?: (scenarioId: string) => void;
  onSelectScenario?: (scenarioId: string) => void;
  onUpdateScenario?: (scenarioId: string, updates: Partial<FlowDebugScenario>) => void;
}

export default function FlowDebugPanel({
  scenarios,
  selectedScenarioId,
  currentNodeName,
  state,
  history,
  onClose,
  onCreateScenario,
  onDeleteScenario,
  onRunScenario,
  onSelectScenario,
  onUpdateScenario,
}: FlowDebugPanelProps) {
  const selectedScenario = scenarios.find((item) => item.id === selectedScenarioId) || scenarios[0] || null;

  const updateInitialState = (value: string) => {
    if (!selectedScenario) return;
    try {
      const parsed = value.trim() ? JSON.parse(value) : {};
      onUpdateScenario?.(selectedScenario.id, { initialState: parsed });
    } catch {
      // Keep editor permissive. Invalid JSON will be corrected by the user.
    }
  };

  const updateMockInputs = (value: string) => {
    if (!selectedScenario) return;
    const inputs = value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    onUpdateScenario?.(selectedScenario.id, { mockInputs: inputs });
  };

  const updateExpectedPath = (value: string) => {
    if (!selectedScenario) return;
    const path = value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    onUpdateScenario?.(selectedScenario.id, { expectedPath: path });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-gray-200 bg-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Activity size={16} className="text-primary" />
              调试场景 / 半模拟预演
            </div>
            <div className="mt-1 text-xs text-slate-400">维护 mock state 和输入序列，直接在前端预演 Flow 走向。</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex flex-1">
        <div className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Scenarios</div>
            <button
              type="button"
              onClick={onCreateScenario}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
              title="新建场景"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {scenarios.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-xs text-slate-400">
                还没有调试场景，点击右上角加号创建。
              </div>
            ) : (
              scenarios.map((scenario) => {
                const selected = scenario.id === (selectedScenario?.id || '');
                return (
                  <div
                    key={scenario.id}
                    className={`mb-2 rounded-2xl border p-3 transition-colors ${
                      selected ? 'border-primary bg-white shadow-sm' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectScenario?.(scenario.id)}
                      className="w-full text-left"
                    >
                      <div className="text-sm font-medium text-slate-800">{scenario.name}</div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        {Object.keys(scenario.initialState || {}).length} 个 state · {scenario.mockInputs.length} 条输入
                      </div>
                    </button>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onRunScenario?.(scenario.id)}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-600"
                      >
                        <Play size={12} />
                        运行
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteScenario?.(scenario.id)}
                        className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-2 py-1.5 text-rose-600 transition-colors hover:bg-rose-50"
                        title="删除场景"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {selectedScenario ? (
            <div key={selectedScenario.id} className="space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{selectedScenario.name}</div>
                    <div className="mt-1 text-xs text-slate-400">配置该场景的初始变量和 mock 输入序列。</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRunScenario?.(selectedScenario.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-600"
                  >
                    <Play size={12} />
                    重新预演
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="mb-2 text-xs font-medium text-slate-600">场景名称</div>
                    <input
                      type="text"
                      value={selectedScenario.name}
                      onChange={(event) => onUpdateScenario?.(selectedScenario.id, { name: event.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-medium text-slate-600">初始 State JSON</div>
                    <textarea
                      rows={7}
                      defaultValue={JSON.stringify(selectedScenario.initialState || {}, null, 2)}
                      onBlur={(event) => updateInitialState(event.target.value)}
                      className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-medium text-slate-600">Mock 输入序列</div>
                    <textarea
                      rows={5}
                      defaultValue={(selectedScenario.mockInputs || []).join('\n')}
                      onBlur={(event) => updateMockInputs(event.target.value)}
                      className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                      placeholder={'13800138000\n验证码 9988\n继续失败'}
                    />
                    <div className="mt-1 text-[11px] text-slate-400">每行一条用户输入，运行时按顺序消费。</div>
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-medium text-slate-600">预期路径（每行一个节点 ID）</div>
                    <textarea
                      rows={4}
                      defaultValue={(selectedScenario.expectedPath || []).join('\n')}
                      onBlur={(event) => updateExpectedPath(event.target.value)}
                      className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                      placeholder={'collect_phone\ncollect_code\nverify_result'}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Route size={14} />
                  当前轨迹
                </div>
                <div className="text-sm font-medium text-slate-700">{currentNodeName || '未开始'}</div>
                <div className="mt-3 space-y-2">
                  {history.length > 0 ? (
                    history.map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-6 text-slate-600"
                      >
                        {index + 1}. {item}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400">点击“运行”后生成执行轨迹。</div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Database size={14} />
                  当前 State
                </div>
                <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-[11px] leading-6 text-slate-700">
                  {JSON.stringify(state, null, 2)}
                </pre>
              </section>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-400">
              先创建一个调试场景，再进行 Flow 预演。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
