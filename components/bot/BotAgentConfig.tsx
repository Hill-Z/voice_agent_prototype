import React, { useEffect, useMemo, useState } from 'react';
import { 
  Wrench, Plus, Trash2, Edit3, Volume2, MessageSquare, Zap, Link, Settings, Clock, PhoneForwarded
} from 'lucide-react';
import { BotConfiguration, AgentTool, ExtractionConfig } from '../../types';
import AgentToolModal from './agent/AgentToolModal';
import McpServerModal from './agent/McpServerModal';
import { loadStoredCustomFunctions, getFunctionCatalogStoreEventName } from '../../services/functionCatalogStore';
import { mergeFunctionCatalog } from '../../services/polyaiConfigHelpers';
import { getAllPresetTools, getPresetToolConfig } from '../../services/presetTools';

interface Props {
  config: BotConfiguration;
  updateField: <K extends keyof BotConfiguration>(key: K, value: BotConfiguration[K]) => void;
  extractionConfigs: ExtractionConfig[];
}

export default function BotAgentConfig({ config, updateField, extractionConfigs }: Props) {
  const [editingTool, setEditingTool] = useState<AgentTool | null>(null);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
  const [catalogFunctions, setCatalogFunctions] = useState(() => mergeFunctionCatalog(loadStoredCustomFunctions()));

  // Helper to ensure agentConfig exists
  const agentConfig = config.agentConfig || {
    tools: [],
    mcpServers: [], // MCP 服务器列表
    generalFiller: { enabled: true, type: 'TTS', content: '请稍等...' },
    functionCallModel: 'gemini-pro'
  };

  const updateAgentConfig = (updates: any) => {
    updateField('agentConfig', { ...agentConfig, ...updates });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncCatalog = () => setCatalogFunctions(mergeFunctionCatalog(loadStoredCustomFunctions()));
    syncCatalog();
    const eventName = getFunctionCatalogStoreEventName();
    window.addEventListener(eventName, syncCatalog);
    return () => window.removeEventListener(eventName, syncCatalog);
  }, []);

  const visibleFunctions = useMemo(
    () => catalogFunctions.filter((fn) => fn.category === 'visible'),
    [catalogFunctions],
  );

  const transitionFunctions = useMemo(
    () => catalogFunctions.filter((fn) => fn.category === 'transition'),
    [catalogFunctions],
  );

  // Tool Handlers
  const handleSaveTool = (tool: AgentTool) => {
    let newTools = [...agentConfig.tools];
    const index = newTools.findIndex(t => t.id === tool.id);
    if (index >= 0) {
      newTools[index] = tool;
    } else {
      newTools.push(tool);
    }
    updateAgentConfig({ tools: newTools });
    setIsToolModalOpen(false);
  };

  const handleDeleteTool = (id: string) => {
    if (confirm('确定删除该工具吗？')) {
      updateAgentConfig({ tools: agentConfig.tools.filter(t => t.id !== id) });
    }
  };

  const openToolModal = (tool?: AgentTool) => {
    setEditingTool(tool || null);
    setIsToolModalOpen(true);
  };

  // Quick add tool handler
  const handleQuickAddTool = (presetId: string) => {
    const presetTool = getPresetToolConfig(presetId);
    if (presetTool) {
      openToolModal(presetTool);
    }
  };

  // Group tools by category
  const groupedTools = useMemo(() => {
    const groups: Record<string, AgentTool[]> = {
      api_call: [],
      knowledge: [],
      pricing: [],
      communication: [],
      transfer: [],
      other: []
    };
    
    agentConfig.tools.forEach(tool => {
      const category = tool.category || 'other';
      if (groups[category]) {
        groups[category].push(tool);
      }
    });
    
    return groups;
  }, [agentConfig.tools]);
  const groupedToolEntries = Object.entries(groupedTools) as Array<[string, AgentTool[]]>;

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] bg-slate-50 border border-gray-200 rounded-lg overflow-hidden shadow-sm relative">
      
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
         <div>
            <h3 className="font-bold text-slate-800 flex items-center">
               <Wrench size={18} className="mr-2 text-indigo-600" />
               工具调用
            </h3>
            <p className="text-xs text-slate-500 mt-1">配置智能体可调用的外部能力。提示词请在"基础配置"中设置。</p>
         </div>
         <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMcpModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center"
              title="添加 MCP 服务器"
            >
               <Link size={14} className="mr-1.5" /> 添加 MCP
            </button>
            <button 
              onClick={() => openToolModal()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm flex items-center"
            >
               <Plus size={14} className="mr-1.5" /> 添加工具
            </button>
         </div>
      </div>
      
      {/* 需求 4：新增配置区块 */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50">
        {/* 可用工具范围 */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Wrench size={14} className="text-indigo-600" />
            可用工具范围
          </h4>
          <div className="flex flex-wrap gap-2">
            {agentConfig.tools.map((tool) => {
              const selected = (agentConfig.enabledToolIds || []).includes(tool.id);
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => {
                    const current = agentConfig.enabledToolIds || [];
                    const updated = selected
                      ? current.filter(id => id !== tool.id)
                      : [...current, tool.id];
                    updateAgentConfig({ enabledToolIds: updated });
                  }}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    selected
                      ? 'bg-indigo-600 text-white border-transparent'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {tool.name}
                </button>
              );
            })}
            {agentConfig.tools.length === 0 && (
              <div className="text-xs text-slate-400">暂无工具，请先添加工具</div>
            )}
          </div>
        </div>

        {/* 可用函数范围 */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Zap size={14} className="text-amber-600" />
            可用函数范围
          </h4>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-600 mb-2 block">已启用函数</label>
              <div className="flex flex-wrap gap-2">
                {catalogFunctions.map((fn) => {
                  const selected = (agentConfig.enabledFunctionIds || []).includes(fn.id);
                  return (
                    <button
                      key={fn.id}
                      type="button"
                      onClick={() => {
                        const current = agentConfig.enabledFunctionIds || [];
                        const updated = selected
                          ? current.filter(id => id !== fn.id)
                          : [...current, fn.id];
                        updateAgentConfig({ enabledFunctionIds: updated });
                      }}
                      className={`px-2 py-1 text-[11px] rounded-full border transition-all ${
                        selected
                          ? 'bg-amber-600 text-white border-transparent'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      {fn.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-600 mb-2 block">默认可见函数</label>
                <div className="flex flex-wrap gap-1.5">
                  {visibleFunctions.map((fn) => {
                    const selected = (agentConfig.defaultVisibleFunctionIds || []).includes(fn.id);
                    return (
                      <button
                        key={fn.id}
                        type="button"
                        onClick={() => {
                          const current = agentConfig.defaultVisibleFunctionIds || [];
                          const updated = selected
                            ? current.filter(id => id !== fn.id)
                            : [...current, fn.id];
                          updateAgentConfig({ defaultVisibleFunctionIds: updated });
                        }}
                        className={`px-2 py-1 text-[10px] rounded border transition-all ${
                          selected
                            ? 'bg-sky-600 text-white border-transparent'
                            : 'bg-white text-slate-500 border-slate-200'
                        }`}
                      >
                        {fn.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-2 block">默认过渡函数</label>
                <div className="flex flex-wrap gap-1.5">
                  {transitionFunctions.map((fn) => {
                    const selected = (agentConfig.defaultTransitionFunctionIds || []).includes(fn.id);
                    return (
                      <button
                        key={fn.id}
                        type="button"
                        onClick={() => {
                          const current = agentConfig.defaultTransitionFunctionIds || [];
                          const updated = selected
                            ? current.filter(id => id !== fn.id)
                            : [...current, fn.id];
                          updateAgentConfig({ defaultTransitionFunctionIds: updated });
                        }}
                        className={`px-2 py-1 text-[10px] rounded border transition-all ${
                          selected
                            ? 'bg-emerald-600 text-white border-transparent'
                            : 'bg-white text-slate-500 border-slate-200'
                        }`}
                      >
                        {fn.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delay Control 配置 */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Clock size={14} className="text-purple-600" />
            延迟话术配置
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-600 mb-1 block">默认延迟配置</label>
                <select
                  value={agentConfig.defaultDelayProfileId || ''}
                  onChange={(e) => updateAgentConfig({ defaultDelayProfileId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">使用全局默认</option>
                  {(agentConfig.delayProfiles || []).map((profile: any) => (
                    <option key={profile.id} value={profile.id}>{profile.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={agentConfig.allowUserInterruptDuringDelay ?? true}
                    onChange={(e) => updateAgentConfig({ allowUserInterruptDuringDelay: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  允许用户打断延迟话术
                </label>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-600 mb-2 block">延迟配置列表</label>
              <div className="space-y-2">
                {(agentConfig.delayProfiles || []).map((profile: any, index: number) => (
                  <div key={profile.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <div className="text-sm font-medium text-slate-700">{profile.name}</div>
                      <div className="text-[10px] text-slate-500">{profile.triggerMs}ms · {profile.message}</div>
                    </div>
                    <button
                      onClick={() => {
                        const updated = (agentConfig.delayProfiles || []).filter((_: any, i: number) => i !== index);
                        updateAgentConfig({ delayProfiles: updated });
                      }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newProfile = {
                      id: `delay_${Date.now()}`,
                      name: '新延迟配置',
                      triggerMs: 2000,
                      message: '请稍等...',
                      allowBargeIn: true
                    };
                    updateAgentConfig({ delayProfiles: [...(agentConfig.delayProfiles || []), newProfile] });
                  }}
                  className="w-full py-2 text-xs text-slate-500 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  + 添加延迟配置
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 插话与恢复策略 */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Settings size={14} className="text-teal-600" />
            插话与恢复策略
          </h4>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={agentConfig.allowUserCutInDuringGreeting ?? false}
                onChange={(e) => updateAgentConfig({ allowUserCutInDuringGreeting: e.target.checked })}
                className="rounded border-slate-300"
              />
              允许在欢迎语期间打断
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={agentConfig.allowUserCutInDuringTts ?? true}
                onChange={(e) => updateAgentConfig({ allowUserCutInDuringTts: e.target.checked })}
                className="rounded border-slate-300"
              />
              允许在 TTS 播报期间打断
            </label>
            <div>
              <label className="text-xs text-slate-600 mb-1 block">恢复策略</label>
              <select
                value={agentConfig.resumeStrategy || 'continue'}
                onChange={(e) => updateAgentConfig({ resumeStrategy: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="continue">继续播放</option>
                <option value="restart">重新开始</option>
                <option value="skip">跳过剩余</option>
              </select>
            </div>
          </div>
        </div>

        {/* 默认转人工配置 */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <PhoneForwarded size={14} className="text-rose-600" />
            默认转人工配置
          </h4>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-600 mb-1 block">默认转人工目标</label>
              <select
                value={agentConfig.defaultHandoffTargetId || ''}
                onChange={(e) => updateAgentConfig({ defaultHandoffTargetId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="">未指定</option>
                <option value="handoff_human_service">人工客服队列</option>
                <option value="handoff_vip_service">VIP 专席</option>
                <option value="handoff_risk_service">高风险专员</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 mb-1 block">摘要模板</label>
              <textarea
                value={agentConfig.summaryTemplate || ''}
                onChange={(e) => updateAgentConfig({ summaryTemplate: e.target.value })}
                rows={3}
                placeholder="用户 {{user_name}} 因 {{reason}} 转人工，当前状态：{{state_summary}}"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none"
              />
            </div>
          </div>
        </div>

        {/* TOOL LIST */}
        <div className="p-6">
          <h4 className="text-sm font-bold text-slate-700 mb-4">工具列表</h4>
        {agentConfig.tools.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <Wrench size={32} className="mb-3 opacity-20" />
            <p className="text-sm">暂无工具，请点击右上角添加或使用下方快速添加</p>
          </div>
        ) : (
          // Category Sections
          <div>
            {groupedToolEntries.map(([category, tools]) => 
              tools.length > 0 && (
                // <ToolCategorySection
                //   key={category}
                //   category={category}
                //   tools={tools}
                //   onEditTool={openToolModal}
                //   onDeleteTool={handleDeleteTool}
                // />
                <div key={category} className="mb-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-2">{category}</h3>
                  {tools.map(tool => (
                    <div key={tool.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white rounded flex items-center justify-center border border-slate-200">
                          <span className="text-sm">{tool.icon || '🔧'}</span>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{tool.name}</div>
                          <div className="text-[10px] text-slate-500">{tool.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => openToolModal(tool)} className="text-slate-400 hover:text-primary">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDeleteTool(tool.id)} className="text-slate-400 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* Quick Add Panel */}
        {/* <QuickAddToolPanel onAddTool={handleQuickAddTool} /> */}
      </div>
      </div>

      {/* Tool Modal */}
      {isToolModalOpen && (
         <AgentToolModal 
            tool={editingTool || undefined}
            onSave={handleSaveTool}
            onClose={() => setIsToolModalOpen(false)}
            extractionConfigs={extractionConfigs}
            availableVariables={config.variables || []}
         />
      )}

      {/* MCP Server Modal */}
      {isMcpModalOpen && (
         <McpServerModal 
            onClose={() => setIsMcpModalOpen(false)}
            onSave={(mcpServer) => {
              const newServers = [...(agentConfig.mcpServers || []), mcpServer];
              updateAgentConfig({ mcpServers: newServers });
              setIsMcpModalOpen(false);
            }}
         />
      )}

    </div>
  );
}
