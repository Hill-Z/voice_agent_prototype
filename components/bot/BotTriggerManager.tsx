import React, { useState } from 'react';
import { Plus, Trash2, Edit2, X, Check, Power, Zap } from 'lucide-react';
import { BotConfiguration, BotTrigger } from '../../types';

interface BotTriggerManagerProps {
  config: BotConfiguration;
  updateField: <K extends keyof BotConfiguration>(key: K, value: BotConfiguration[K]) => void;
}

const TRIGGER_TIME_OPTIONS = [
  { value: 'call_start', label: '通话开始' },
  { value: 'call_end', label: '通话结束' },
];

const ACTION_OPTIONS = [
  { value: 'satisfaction_survey', label: '发送满意度调查' },
  { value: 'send_sms', label: '发送短信' },
  { value: 'extract_info', label: '提取信息' },
  { value: 'call_api', label: '调用接口' },
];

const BotTriggerManager: React.FC<BotTriggerManagerProps> = ({ config, updateField }) => {
  const [editingTrigger, setEditingTrigger] = useState<BotTrigger | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const triggers = config.triggers || [];

  const handleCreate = () => {
    const newTrigger: BotTrigger = {
      id: Date.now().toString(),
      name: '',
      description: '',
      triggerTime: 'call_start',
      action: 'call_api',
      actionConfig: {},
      isEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEditingTrigger(newTrigger);
    setIsCreating(true);
  };

  const handleEdit = (trigger: BotTrigger) => {
    setEditingTrigger({
      ...trigger,
      action: trigger.action === 'pre_call_fetch' ? 'call_api' : trigger.action,
    });
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    const updatedTriggers = triggers.filter(t => t.id !== id);
    updateField('triggers', updatedTriggers);
  };

  const handleToggleEnabled = (id: string) => {
    const updatedTriggers = triggers.map(t => 
      t.id === id ? { ...t, isEnabled: !t.isEnabled, updatedAt: new Date().toISOString() } : t
    );
    updateField('triggers', updatedTriggers);
  };

  const handleSave = () => {
    if (!editingTrigger) return;
    if (!editingTrigger.name.trim()) {
      alert('请输入触发器名称');
      return;
    }

    const updatedTrigger = { ...editingTrigger, updatedAt: new Date().toISOString() };
    
    if (isCreating) {
      updateField('triggers', [...triggers, updatedTrigger]);
    } else {
      const updatedTriggers = triggers.map(t => t.id === editingTrigger.id ? updatedTrigger : t);
      updateField('triggers', updatedTriggers);
    }

    setEditingTrigger(null);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setEditingTrigger(null);
    setIsCreating(false);
  };

  const updateEditingTrigger = <K extends keyof BotTrigger>(key: K, value: BotTrigger[K]) => {
    if (!editingTrigger) return;
    setEditingTrigger({ ...editingTrigger, [key]: value });
  };

  const updateActionConfig = (updates: NonNullable<BotTrigger['actionConfig']>) => {
    updateEditingTrigger('actionConfig', {
      ...editingTrigger?.actionConfig,
      ...updates,
    });
  };

  const apiTools = (config.agentConfig?.tools || []).filter((tool) => tool.type === 'API');
  const variables = config.variables || [];

  const getTriggerTimeLabel = (value: string) => 
    TRIGGER_TIME_OPTIONS.find(o => o.value === value)?.label || value;

  const getActionLabel = (value: string) => 
    value === 'pre_call_fetch' ? '调用接口' : ACTION_OPTIONS.find(o => o.value === value)?.label || value;

  if (editingTrigger) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              {isCreating ? '新建触发器' : '编辑触发器'}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs text-slate-600 border border-gray-200 rounded hover:bg-slate-50 transition-colors flex items-center gap-1"
              >
                <X size={12} /> 取消
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-sky-600 transition-colors flex items-center gap-1"
              >
                <Check size={12} /> 保存
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">触发器名称 *</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                placeholder="如：通话开始记录、通话结束满意度"
                value={editingTrigger.name}
                onChange={(e) => updateEditingTrigger('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">启用状态</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateEditingTrigger('isEnabled', !editingTrigger.isEnabled)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    editingTrigger.isEnabled 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  <Power size={12} />
                  {editingTrigger.isEnabled ? '已启用' : '已禁用'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">描述</label>
            <textarea
              className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none resize-none"
              placeholder="描述这个触发器的作用..."
              value={editingTrigger.description || ''}
              onChange={(e) => updateEditingTrigger('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">触发时机 *</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                value={editingTrigger.triggerTime}
                onChange={(e) => updateEditingTrigger('triggerTime', e.target.value)}
              >
                {TRIGGER_TIME_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">动作 *</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                value={editingTrigger.action}
                onChange={(e) => updateEditingTrigger('action', e.target.value)}
              >
                {ACTION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 动作配置 */}
          {editingTrigger.action === 'send_sms' && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-700">短信配置</h4>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">短信模板ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                  placeholder="如：SMS_123456"
                  value={editingTrigger.actionConfig?.smsTemplateId || ''}
                  onChange={(e) => updateEditingTrigger('actionConfig', {
                    ...editingTrigger.actionConfig,
                    smsTemplateId: e.target.value
                  })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">短信参数（JSON格式）</label>
                <textarea
                  className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none resize-none font-mono"
                  placeholder='{"name": "{{user_name}}", "order_id": "{{order_id}}"}'
                  value={editingTrigger.actionConfig?.smsParams ? JSON.stringify(editingTrigger.actionConfig.smsParams, null, 2) : ''}
                  onChange={(e) => {
                    try {
                      const params = e.target.value ? JSON.parse(e.target.value) : {};
                      updateEditingTrigger('actionConfig', {
                        ...editingTrigger.actionConfig,
                        smsParams: params
                      });
                    } catch {}
                  }}
                />
              </div>
            </div>
          )}

          {editingTrigger.action === 'call_api' && (
            <div className="space-y-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">接口</label>
                <select
                  className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  value={editingTrigger.actionConfig?.apiConfigId || ''}
                  onChange={(event) => updateActionConfig({ apiConfigId: event.target.value })}
                >
                  <option value="">请选择接口</option>
                  {apiTools.map((tool) => <option key={tool.id} value={tool.id}>{tool.name}</option>)}
                  {editingTrigger.actionConfig?.apiConfigId && !apiTools.some((tool) => tool.id === editingTrigger.actionConfig?.apiConfigId) && (
                    <option value={editingTrigger.actionConfig.apiConfigId}>{editingTrigger.actionConfig.apiConfigId}</option>
                  )}
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-600">请求参数映射</label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:text-sky-600"
                    onClick={() => updateActionConfig({
                      requestMappings: [...(editingTrigger.actionConfig?.requestMappings || []), { parameterName: '', variableId: '' }],
                    })}
                  >
                    添加映射
                  </button>
                </div>
                <div className="space-y-2">
                  {(editingTrigger.actionConfig?.requestMappings || []).map((mapping, index) => (
                    <div key={`${mapping.parameterName}-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <input
                        type="text"
                        className="rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                        placeholder="接口参数"
                        value={mapping.parameterName}
                        onChange={(event) => {
                          const mappings = [...(editingTrigger.actionConfig?.requestMappings || [])];
                          mappings[index] = { ...mappings[index], parameterName: event.target.value };
                          updateActionConfig({ requestMappings: mappings });
                        }}
                      />
                      <select
                        className="rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                        value={mapping.variableId}
                        onChange={(event) => {
                          const mappings = [...(editingTrigger.actionConfig?.requestMappings || [])];
                          mappings[index] = { ...mappings[index], variableId: event.target.value };
                          updateActionConfig({ requestMappings: mappings });
                        }}
                      >
                        <option value="">来源变量</option>
                        {variables.map((variable) => <option key={variable.id} value={variable.id}>{variable.name}</option>)}
                      </select>
                      <button
                        type="button"
                        aria-label="删除请求映射"
                        className="px-2 text-slate-400 hover:text-red-500"
                        onClick={() => updateActionConfig({ requestMappings: (editingTrigger.actionConfig?.requestMappings || []).filter((_, itemIndex) => itemIndex !== index) })}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-600">返回值映射</label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:text-sky-600"
                    onClick={() => updateActionConfig({
                      responseMappings: [...(editingTrigger.actionConfig?.responseMappings || []), { sourcePath: '', variableId: '', defaultValue: '', required: false }],
                    })}
                  >
                    添加映射
                  </button>
                </div>
                <div className="space-y-2">
                  {(editingTrigger.actionConfig?.responseMappings || []).map((mapping, index) => (
                    <div key={`${mapping.sourcePath}-${index}`} className="grid grid-cols-[1fr_1fr_1fr_auto_auto] items-center gap-2">
                      <input
                        type="text"
                        className="rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                        placeholder="返回字段，如 data.orderId"
                        value={mapping.sourcePath}
                        onChange={(event) => {
                          const mappings = [...(editingTrigger.actionConfig?.responseMappings || [])];
                          mappings[index] = { ...mappings[index], sourcePath: event.target.value };
                          updateActionConfig({ responseMappings: mappings });
                        }}
                      />
                      <select
                        className="rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                        value={mapping.variableId}
                        onChange={(event) => {
                          const mappings = [...(editingTrigger.actionConfig?.responseMappings || [])];
                          mappings[index] = { ...mappings[index], variableId: event.target.value };
                          updateActionConfig({ responseMappings: mappings });
                        }}
                      >
                        <option value="">通话变量</option>
                        {variables.map((variable) => <option key={variable.id} value={variable.id}>{variable.name}</option>)}
                      </select>
                      <input
                        type="text"
                        className="rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                        placeholder="默认值"
                        value={mapping.defaultValue || ''}
                        onChange={(event) => {
                          const mappings = [...(editingTrigger.actionConfig?.responseMappings || [])];
                          mappings[index] = { ...mappings[index], defaultValue: event.target.value };
                          updateActionConfig({ responseMappings: mappings });
                        }}
                      />
                      <label className="flex items-center gap-1 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={mapping.required || false}
                          onChange={(event) => {
                            const mappings = [...(editingTrigger.actionConfig?.responseMappings || [])];
                            mappings[index] = { ...mappings[index], required: event.target.checked };
                            updateActionConfig({ responseMappings: mappings });
                          }}
                        />
                        必填
                      </label>
                      <button
                        type="button"
                        aria-label="删除返回值映射"
                        className="px-2 text-slate-400 hover:text-red-500"
                        onClick={() => updateActionConfig({ responseMappings: (editingTrigger.actionConfig?.responseMappings || []).filter((_, itemIndex) => itemIndex !== index) })}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">等待音 ID</label>
                  <input
                    type="text"
                    className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                    value={editingTrigger.actionConfig?.waitAudioId || ''}
                    onChange={(event) => updateActionConfig({ waitAudioId: event.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">超时时间（秒）</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                    value={editingTrigger.actionConfig?.timeoutSeconds || 5}
                    onChange={(event) => updateActionConfig({ timeoutSeconds: Number(event.target.value) || 5 })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">失败处理</label>
                  <select
                    className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                    value={editingTrigger.actionConfig?.failureAction || 'continue'}
                    onChange={(event) => updateActionConfig({ failureAction: event.target.value as NonNullable<BotTrigger['actionConfig']>['failureAction'] })}
                  >
                    <option value="continue">继续通话</option>
                    <option value="transfer">转人工</option>
                    <option value="hangup">结束通话</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {editingTrigger.action === 'extract_info' && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-700">信息提取配置</h4>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">提取字段（逗号分隔）</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                  placeholder="如：用户满意度,问题是否解决,是否需要回访"
                  value={editingTrigger.actionConfig?.extractionFields?.join(', ') || ''}
                  onChange={(e) => updateEditingTrigger('actionConfig', {
                    ...editingTrigger.actionConfig,
                    extractionFields: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                  })}
                />
              </div>
            </div>
          )}

          {editingTrigger.action === 'satisfaction_survey' && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-700">满意度调查配置</h4>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">调查问题（逗号分隔）</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                  placeholder="如：您对本次服务满意吗？,问题是否得到解决？"
                  value={editingTrigger.actionConfig?.surveyQuestions?.join(', ') || ''}
                  onChange={(e) => updateEditingTrigger('actionConfig', {
                    ...editingTrigger.actionConfig,
                    surveyQuestions: e.target.value.split(',').map(q => q.trim()).filter(q => q)
                  })}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-slate-800">触发器管理</h3>
          </div>
          <button
            onClick={handleCreate}
            className="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-sky-600 transition-colors flex items-center gap-1"
          >
            <Plus size={12} /> 新建触发器
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">配置通话开始和结束时的自动化动作</p>
      </div>

      <div className="p-6">
        {triggers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap size={24} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 mb-2">暂无触发器</p>
            <p className="text-xs text-slate-400">点击"新建触发器"开始配置</p>
          </div>
        ) : (
          <div className="space-y-3">
            {triggers.map((trigger) => (
              <div
                key={trigger.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggleEnabled(trigger.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      trigger.isEnabled 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    <Power size={10} />
                    {trigger.isEnabled ? '启用' : '禁用'}
                  </button>
                  <div>
                    <h4 className="text-sm font-medium text-slate-800">{trigger.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">{getTriggerTimeLabel(trigger.triggerTime)}</span>
                      <span className="text-slate-300">→</span>
                      <span className="text-xs text-primary">{getActionLabel(trigger.action)}</span>
                    </div>
                    {trigger.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{trigger.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(trigger)}
                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded transition-colors"
                    title="编辑"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(trigger.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BotTriggerManager;
