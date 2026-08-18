// 变量管理页，统一承接输入变量、通话变量、提取变量和实体配置。
import React, { useMemo, useState } from 'react';
import { Database, Edit3, Lock, MessageSquare, Plus, Server, Trash2, X, Box } from 'lucide-react';
import { BotVariable, BotEntity } from '../../types';

interface BotVariableConfigProps {
  variables: BotVariable[];
  onUpdate: (variables: BotVariable[]) => void;
  onSave: () => void;
  onCancel: () => void;
}

const VARIABLE_TYPES: { label: string; value: BotVariable['type'] }[] = [
  { label: '文本', value: 'TEXT' },
  { label: '数字', value: 'NUMBER' },
  { label: '日期', value: 'DATE' },
  { label: '日期时间', value: 'DATETIME' },
  { label: '时间', value: 'TIME' },
  { label: '布尔值', value: 'BOOLEAN' },
];

const VALIDATION_RULES: { label: string; value: BotEntity['validationRule'] }[] = [
  { label: '数字', value: 'number' },
  { label: '字母', value: 'letter' },
  { label: '日期', value: 'date' },
  { label: '身份证', value: 'id_card' },
  { label: '手机号', value: 'phone' },
  { label: '邮箱', value: 'email' },
  { label: '正则', value: 'regex' },
  { label: '自定义', value: 'custom' },
];

const SYSTEM_VARIABLES: BotVariable[] = [
  { id: 'sys_current_date', name: 'current_date', type: 'DATE', description: '当前日期', isSystem: true, category: 'CONVERSATION', source: 'system' },
  { id: 'sys_current_time', name: 'current_time', type: 'TIME', description: '当前时间', isSystem: true, category: 'CONVERSATION', source: 'system' },
  { id: 'sys_current_datetime', name: 'current_datetime', type: 'DATETIME', description: '当前日期时间', isSystem: true, category: 'CONVERSATION', source: 'system' },
  { id: 'sys_user_phone', name: 'user_phone', type: 'TEXT', description: '用户电话号码', isSystem: true, category: 'CONVERSATION', source: 'system' },
  { id: 'sys_call_id', name: 'call_id', type: 'TEXT', description: '当前通话 ID', isSystem: true, category: 'CONVERSATION', source: 'system' },
  { id: 'sys_turn_count', name: 'turn_count', type: 'NUMBER', description: '当前对话轮次', isSystem: true, category: 'CONVERSATION', source: 'system' },
  { id: 'sys_last_user_utterance', name: 'last_user_utterance', type: 'TEXT', description: '用户上一轮发言', isSystem: true, category: 'CONVERSATION', source: 'system' },
  { id: 'sys_last_bot_utterance', name: 'last_bot_utterance', type: 'TEXT', description: '机器人上一轮回复', isSystem: true, category: 'CONVERSATION', source: 'system' },
  { id: 'sys_active_flow_id', name: 'active_flow_id', type: 'TEXT', description: '当前流程 ID', isSystem: true, category: 'CONVERSATION', source: 'system' },
  { id: 'sys_active_step_id', name: 'active_step_id', type: 'TEXT', description: '当前步骤 ID', isSystem: true, category: 'CONVERSATION', source: 'system' },
  { id: 'sys_last_function_name', name: 'last_function_name', type: 'TEXT', description: '最后调用的函数', isSystem: true, category: 'CONVERSATION', source: 'system' },
  { id: 'sys_last_function_status', name: 'last_function_status', type: 'TEXT', description: '最后函数状态', isSystem: true, category: 'CONVERSATION', source: 'system' },
];

const VARIABLE_SOURCES = [
  { label: '系统', value: 'system' },
  { label: '用户输入', value: 'user_input' },
  { label: '模型提取', value: 'extraction' },
  { label: 'API 调用', value: 'api' },
  { label: '流程写入', value: 'flow' },
];

const DEFAULT_ENTITIES: BotEntity[] = [
  { id: 'entity_phone', name: '手机号', description: '用户手机号码，用于身份验证和联系', validationRule: 'phone', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'entity_order_id', name: '订单号', description: '订单唯一标识符', validationRule: 'number', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const getTypeName = (type: string) => VARIABLE_TYPES.find((item) => item.value === type)?.label || type;
const getSourceName = (source?: string) => VARIABLE_SOURCES.find((item) => item.value === source)?.label || '自定义';
const getValidationRuleName = (rule: string) => VALIDATION_RULES.find((item) => item.value === rule)?.label || rule;

const BotVariableConfig: React.FC<BotVariableConfigProps> = ({
  variables,
  onUpdate,
  onSave,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<'INPUT' | 'CONVERSATION' | 'EXTRACTION' | 'ENTITY'>('INPUT');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<BotVariable | null>(null);
  const [editingEntity, setEditingEntity] = useState<BotEntity | null>(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [formData, setFormData] = useState<Partial<BotVariable>>({
    name: '',
    type: 'TEXT',
    description: '',
    isStateful: false,
    source: 'user_input',
    defaultValue: '',
  });
  const [entityFormData, setEntityFormData] = useState<Partial<BotEntity>>({
    name: '',
    description: '',
    validationRule: 'phone',
    regexPattern: '',
  });
  const [entities, setEntities] = useState<BotEntity[]>(DEFAULT_ENTITIES);

  const customStateVariables = useMemo(
    () => variables.filter((item) => !item.isSystem && (item.category === 'CONVERSATION' || (item.category !== 'INPUT' && item.category !== 'EXTRACTION'))),
    [variables],
  );

  const filteredVariables = useMemo(() => {
    if (activeTab === 'INPUT') {
      return variables.filter((item) => item.category === 'INPUT' || (!item.category && !item.isSystem));
    }
    if (activeTab === 'EXTRACTION') {
      return variables.filter((item) => item.category === 'EXTRACTION');
    }
    return customStateVariables;
  }, [activeTab, customStateVariables, variables]);

  const isStateTab = activeTab === 'CONVERSATION';
  const isEntityTab = activeTab === 'ENTITY';

  const openModal = (variable?: BotVariable) => {
    if (variable) {
      setEditingVar(variable);
      setFormData({ ...variable });
      setShowAdvancedFields(Boolean(variable.source || variable.defaultValue));
    } else {
      setEditingVar(null);
      setFormData({
        name: '',
        type: 'TEXT',
        description: '',
        isStateful: isStateTab,
        source: isStateTab ? 'flow' : activeTab === 'EXTRACTION' ? 'extraction' : 'user_input',
        defaultValue: '',
      });
      setShowAdvancedFields(false);
    }
    setIsModalOpen(true);
  };

  const openEntityModal = (entity?: BotEntity) => {
    if (entity) {
      setEditingEntity(entity);
      setEntityFormData({ ...entity });
    } else {
      setEditingEntity(null);
      setEntityFormData({
        name: '',
        description: '',
        validationRule: 'phone',
        regexPattern: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVar(null);
    setEditingEntity(null);
    setShowAdvancedFields(false);
  };

  const handleSubmit = () => {
    if (isEntityTab) {
      if (!entityFormData.name?.trim()) {
        alert('请输入实体名称');
        return;
      }
      if (editingEntity) {
        setEntities(entities.map((item) =>
          item.id === editingEntity.id
            ? ({ ...item, ...entityFormData, name: entityFormData.name?.trim(), updatedAt: new Date().toISOString() } as BotEntity)
            : item,
        ));
      } else {
        setEntities([
          ...entities,
          {
            id: Date.now().toString(),
            name: entityFormData.name!.trim(),
            description: entityFormData.description || '',
            validationRule: entityFormData.validationRule || 'phone',
            regexPattern: entityFormData.regexPattern || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }
    } else {
      if (!formData.name?.trim()) {
        alert('请输入变量英文名称');
        return;
      }

      if (editingVar) {
        onUpdate(
          variables.map((item) =>
            item.id === editingVar.id
              ? ({ ...item, ...formData, name: formData.name?.trim(), description: formData.description || '' } as BotVariable)
              : item,
          ),
        );
      } else {
        onUpdate([
          ...variables,
          {
            id: Date.now().toString(),
            name: formData.name.trim(),
            type: (formData.type || 'TEXT') as BotVariable['type'],
            description: formData.description || '',
            isSystem: false,
            category: activeTab === 'ENTITY' ? 'INPUT' : activeTab,
            source: (formData.source || (isStateTab ? 'flow' : 'user_input')) as BotVariable['source'],
            isStateful: formData.isStateful ?? isStateTab,
            defaultValue: formData.defaultValue || '',
          },
        ]);
      }
    }

    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定删除吗？')) {
      if (isEntityTab) {
        setEntities(entities.filter((item) => item.id !== id));
      } else {
        onUpdate(variables.filter((item) => item.id !== id));
      }
    }
  };

  const renderVariableRows = (items: BotVariable[], showSystemFirst = false) => (
    <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-500">名称</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500">类型</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500">说明</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500">来源</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500">状态</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {showSystemFirst && SYSTEM_VARIABLES.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors bg-slate-50/50">
              <td className="px-6 py-4 text-sm font-medium text-slate-800 font-mono flex items-center gap-2">
                <Lock size={12} className="text-slate-400" />
                {item.name}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">{getTypeName(item.type)}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{item.description || '-'}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{getSourceName(item.source)}</td>
              <td className="px-6 py-4">
                <span className="text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-500">
                  系统内置
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="text-xs text-slate-400">不可编辑</span>
              </td>
            </tr>
          ))}
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-slate-800 font-mono">{item.name}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{getTypeName(item.type)}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{item.description || '-'}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{getSourceName(item.source)}</td>
              <td className="px-6 py-4">
                <span className={`text-[10px] px-2 py-1 rounded ${item.isStateful ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {item.isStateful ? '跨轮保留' : '当前会话'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => openModal(item)} className="px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center">
                    <Edit3 size={12} className="mr-1" />
                    编辑
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 text-xs font-bold text-red-500 border border-red-100 rounded-lg hover:bg-red-50 flex items-center">
                    <Trash2 size={12} className="mr-1" />
                    删除
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && !showSystemFirst && (
            <tr>
              <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">
                暂无配置
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderEntityRows = () => (
    <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-500">名称</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500">描述</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500">校验规则</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entities.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-slate-800">{item.name}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{item.description || '-'}</td>
              <td className="px-6 py-4">
                <span className="text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-600">
                  {getValidationRuleName(item.validationRule)}
                </span>
                {item.validationRule === 'regex' && item.regexPattern && (
                  <span className="text-xs text-slate-400 ml-2 font-mono">{item.regexPattern}</span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => openEntityModal(item)} className="px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center">
                    <Edit3 size={12} className="mr-1" />
                    编辑
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 text-xs font-bold text-red-500 border border-red-100 rounded-lg hover:bg-red-50 flex items-center">
                    <Trash2 size={12} className="mr-1" />
                    删除
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {entities.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                暂无实体
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200 space-x-8 bg-white/50 px-4 -mx-4">
        {[
          { id: 'INPUT', label: '输入变量', icon: Server },
          { id: 'CONVERSATION', label: '通话变量', icon: MessageSquare },
          { id: 'EXTRACTION', label: '提取变量', icon: Database },
          { id: 'ENTITY', label: '实体', icon: Box },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center ${
              activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon size={14} className="mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm font-bold text-slate-800">
          {isEntityTab ? '实体列表' : isStateTab ? '通话变量列表' : activeTab === 'INPUT' ? '输入变量列表' : '提取变量列表'}
        </div>
        <button 
          onClick={() => isEntityTab ? openEntityModal() : openModal()} 
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-sky-600 transition-all flex items-center shadow-sm"
        >
          <Plus size={16} className="mr-2" />
          {isEntityTab ? '添加实体' : isStateTab ? '添加通话变量' : activeTab === 'INPUT' ? '添加输入变量' : '添加提取变量'}
        </button>
      </div>

      {isEntityTab ? renderEntityRows() : renderVariableRows(filteredVariables, isStateTab)}

      <div className="flex justify-start space-x-4 pt-4 border-t border-gray-100">
        <button onClick={onSave} className="px-6 py-2 bg-primary text-white rounded hover:bg-sky-600 text-sm font-medium shadow-sm transition-all">
          保存配置
        </button>
        <button onClick={onCancel} className="px-6 py-2 border border-gray-200 text-slate-600 rounded hover:bg-slate-50 text-sm font-medium transition-all">
          取消
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl w-[520px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {isEntityTab 
                  ? (editingEntity ? '编辑实体' : '添加实体')
                  : (editingVar ? '编辑变量' : isStateTab ? '添加通话变量' : activeTab === 'INPUT' ? '添加输入变量' : '添加提取变量')}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {isEntityTab ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <span className="text-red-500 mr-1">*</span>实体名称
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm" 
                      placeholder="如：手机号、订单号" 
                      value={entityFormData.name || ''} 
                      onChange={(e) => setEntityFormData({ ...entityFormData, name: e.target.value })} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">描述（提示词）</label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm h-20 resize-none" 
                      placeholder="描述这个实体的用途和含义..." 
                      value={entityFormData.description || ''} 
                      onChange={(e) => setEntityFormData({ ...entityFormData, description: e.target.value })} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <span className="text-red-500 mr-1">*</span>校验规则
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-white" 
                      value={entityFormData.validationRule || 'phone'} 
                      onChange={(e) => setEntityFormData({ ...entityFormData, validationRule: e.target.value as BotEntity['validationRule'] })}
                    >
                      {VALIDATION_RULES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {entityFormData.validationRule === 'regex' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        <span className="text-red-500 mr-1">*</span>正则表达式
                      </label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-mono" 
                        placeholder="如：^[0-9]{11}$" 
                        value={entityFormData.regexPattern || ''} 
                        onChange={(e) => setEntityFormData({ ...entityFormData, regexPattern: e.target.value })} 
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <span className="text-red-500 mr-1">*</span>变量英文名
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-mono" 
                      placeholder="booking_reference" 
                      value={formData.name || ''} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        <span className="text-red-500 mr-1">*</span>类型
                      </label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-white" 
                        value={formData.type || 'TEXT'} 
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as BotVariable['type'] })}
                      >
                        {VARIABLE_TYPES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-slate-50">
                        <span className="text-sm text-slate-700">跨轮保留</span>
                        <input 
                          type="checkbox" 
                          checked={formData.isStateful ?? false} 
                          onChange={(e) => setFormData({ ...formData, isStateful: e.target.checked })} 
                          className="rounded border-slate-300" 
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">说明</label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm h-20 resize-none" 
                      placeholder="用途说明" 
                      value={formData.description || ''} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    />
                  </div>

                  <div>
                    <button 
                      onClick={() => setShowAdvancedFields((value) => !value)} 
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      {showAdvancedFields ? '收起更多设置' : '更多设置'}
                    </button>
                  </div>

                  {showAdvancedFields && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">来源</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-white" 
                          value={formData.source || 'user_input'} 
                          onChange={(e) => setFormData({ ...formData, source: e.target.value as BotVariable['source'] })}
                        >
                          {VARIABLE_SOURCES.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">默认值</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-mono" 
                          placeholder="可选" 
                          value={formData.defaultValue || ''} 
                          onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })} 
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded text-slate-600 text-sm font-medium hover:bg-white transition-colors">
                取消
              </button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 transition-colors">
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotVariableConfig;