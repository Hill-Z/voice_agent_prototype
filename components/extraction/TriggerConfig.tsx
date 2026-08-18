
import React, { useState } from 'react';
import { 
  Plus, Edit3, Trash2, Zap, X, MinusCircle, PlusCircle, HelpCircle, 
  Menu, Trash
} from 'lucide-react';
import { TriggerConfigItem, TriggerCondition, TriggerAction } from '../../types';
import { Switch } from '../ui/FormComponents';

// --- MOCK DATA ---
const MOCK_TRIGGERS: TriggerConfigItem[] = [
  {
    id: '1',
    name: '测试',
    description: '',
    isActive: false,
    subjectType: '意向标签',
    subjectValue: 'LY-测试意向标签',
    timing: '机器人通话结束时',
    conditions: [
      { id: 'c1', field: '意向标签', operator: '等于', value: 'A级 (有明确意向)' }
    ],
    logicType: 'ALL',
    actions: [
      { id: 'a1', type: '请求接口', value: '11.4鉴权token' }
    ]
  },
  {
    id: '2',
    name: '1111',
    description: '',
    isActive: false,
    subjectType: '机器人话术',
    subjectValue: '韩肖杰的语音机器人',
    timing: '通话结束时',
    conditions: [],
    logicType: 'ALL',
    actions: []
  },
  {
    id: '3',
    name: '闪信发送测试',
    description: '',
    isActive: true,
    subjectType: '',
    subjectValue: '',
    timing: '',
    conditions: [],
    logicType: 'ALL',
    actions: []
  },
  {
    id: '4',
    name: '石玉触发器',
    description: '',
    isActive: true,
    subjectType: '',
    subjectValue: '',
    timing: '',
    conditions: [],
    logicType: 'ALL',
    actions: []
  },
  {
    id: '5',
    name: '加盟咨询创建工单',
    description: '将加盟咨询的客户创建成一个工单，方便后续销售跟进',
    isActive: true,
    subjectType: '机器人话术',
    subjectValue: '语音机器人演示Demo-202511',
    timing: '',
    conditions: [],
    logicType: 'ALL',
    actions: []
  }
];

const DEFAULT_TRIGGER: TriggerConfigItem = {
  id: '',
  name: '',
  description: '',
  isActive: false,
  subjectType: '机器人话术',
  subjectValue: '',
  timing: '机器人通话结束时',
  conditions: [{ id: 'new_1', field: '意向标签', operator: '等于', value: 'A级 (有明确意向)' }],
  logicType: 'ALL',
  actions: [{ id: 'new_a1', type: '请求接口', value: '' }]
};

export default function TriggerConfig() {
  const [triggers, setTriggers] = useState<TriggerConfigItem[]>(MOCK_TRIGGERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<TriggerConfigItem | null>(null);

  const openModal = (trigger?: TriggerConfigItem) => {
    if (trigger) {
      setEditingTrigger({ ...trigger });
    } else {
      setEditingTrigger({ ...DEFAULT_TRIGGER, id: Date.now().toString() });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTrigger(null);
  };

  const handleSave = () => {
    if (!editingTrigger) return;
    setTriggers(prev => {
      const exists = prev.find(t => t.id === editingTrigger.id);
      if (exists) return prev.map(t => t.id === editingTrigger.id ? editingTrigger : t);
      return [editingTrigger, ...prev];
    });
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('确认删除该触发器吗？')) {
      setTriggers(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">触发器设置</h1>
          <p className="text-sm text-slate-500 mt-1">管理自动触发逻辑与执行动作</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-sky-600 transition-all flex items-center shadow-lg shadow-sky-100"
        >
          <Plus size={18} className="mr-2" /> 新建
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">名称</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">触发主体</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">描述</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {triggers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <Zap size={32} className="opacity-20" />
                    </div>
                    <p>暂无触发器</p>
                  </div>
                </td>
              </tr>
            ) : (
              triggers.map(trigger => (
                <tr key={trigger.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{trigger.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{trigger.subjectValue || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{trigger.description}</td>
                  <td className="px-6 py-4">
                     <Switch label="" checked={trigger.isActive} onChange={(v) => {
                       setTriggers(triggers.map(t => t.id === trigger.id ? { ...t, isActive: v } : t));
                     }} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-4 text-sm">
                      <button onClick={() => openModal(trigger)} className="text-primary hover:underline flex items-center">
                        编辑
                      </button>
                      <button onClick={() => handleDelete(trigger.id)} className="text-primary hover:underline flex items-center">
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && editingTrigger && (
        <TriggerEditModal 
          trigger={editingTrigger} 
          onChange={setEditingTrigger} 
          onSave={handleSave} 
          onClose={closeModal} 
        />
      )}
    </div>
  );
}

// --- MODAL COMPONENT ---

const TriggerEditModal: React.FC<{ 
  trigger: TriggerConfigItem; 
  onChange: (t: TriggerConfigItem) => void; 
  onSave: () => void; 
  onClose: () => void;
}> = ({ trigger, onChange, onSave, onClose }) => {

  const addCondition = () => {
    const newCond: TriggerCondition = { id: Date.now().toString(), field: '', operator: '等于', value: '' };
    onChange({ ...trigger, conditions: [...trigger.conditions, newCond] });
  };

  const removeCondition = (id: string) => {
    onChange({ ...trigger, conditions: trigger.conditions.filter(c => c.id !== id) });
  };

  const updateCondition = (id: string, updates: Partial<TriggerCondition>) => {
    onChange({ 
      ...trigger, 
      conditions: trigger.conditions.map(c => c.id === id ? { ...c, ...updates } : c) 
    });
  };

  const addAction = () => {
    const newAction: TriggerAction = { id: Date.now().toString(), type: '请求接口', value: '' };
    onChange({ ...trigger, actions: [...trigger.actions, newAction] });
  };

  const removeAction = (id: string) => {
    onChange({ ...trigger, actions: trigger.actions.filter(a => a.id !== id) });
  };
  
  const updateAction = (id: string, updates: Partial<TriggerAction>) => {
    onChange({
      ...trigger,
      actions: trigger.actions.map(a => a.id === id ? { ...a, ...updates } : a)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-[900px] h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <h3 className="text-base font-bold text-slate-800">编辑AI触发器</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8">
           <div className="space-y-6">
              {/* Name */}
              <div className="flex items-center">
                 <label className="w-24 text-right pr-4 text-sm font-medium text-slate-700">
                   <span className="text-red-500 mr-1">*</span>名称:
                 </label>
                 <input 
                   className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:border-primary outline-none"
                   value={trigger.name}
                   onChange={(e) => onChange({...trigger, name: e.target.value})}
                 />
              </div>

              {/* Description */}
              <div className="flex items-start">
                 <label className="w-24 text-right pr-4 text-sm font-medium text-slate-700 pt-2">
                   描述:
                 </label>
                 <textarea 
                   className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:border-primary outline-none h-20 resize-none"
                   value={trigger.description}
                   onChange={(e) => onChange({...trigger, description: e.target.value})}
                 />
              </div>

              {/* Subject */}
              <div className="flex items-center">
                 <label className="w-24 text-right pr-4 text-sm font-medium text-slate-700">
                   <span className="text-red-500 mr-1">*</span>触发主体:
                 </label>
                 <div className="flex space-x-4 flex-1">
                    <select 
                      className="w-1/3 px-3 py-2 text-sm border border-gray-300 rounded bg-white outline-none focus:border-primary"
                      value={trigger.subjectType}
                      onChange={(e) => onChange({...trigger, subjectType: e.target.value})}
                    >
                      <option>机器人话术</option>
                      <option>意向标签</option>
                    </select>
                    <select 
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-white outline-none focus:border-primary"
                      value={trigger.subjectValue}
                      onChange={(e) => onChange({...trigger, subjectValue: e.target.value})}
                    >
                      <option value="">请选择</option>
                      <option value="LY-测试意向标签">LY-测试意向标签</option>
                      <option value="韩肖杰的语音机器人">韩肖杰的语音机器人</option>
                      <option value="语音机器人演示Demo-202511">语音机器人演示Demo-202511</option>
                    </select>
                 </div>
              </div>

              {/* Timing */}
              <div className="flex items-center">
                 <label className="w-24 text-right pr-4 text-sm font-medium text-slate-700">
                   <span className="text-red-500 mr-1">*</span>触发时机:
                 </label>
                 <select 
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-white outline-none focus:border-primary"
                    value={trigger.timing}
                    onChange={(e) => onChange({...trigger, timing: e.target.value})}
                  >
                    <option value="">请选择</option>
                    <option value="机器人通话结束时">机器人通话结束时</option>
                    <option value="通话结束时">通话结束时</option>
                  </select>
              </div>

              {/* Conditions */}
              <div className="flex items-start">
                 <label className="w-24 text-right pr-4 text-sm font-medium text-slate-700 pt-2">
                   满足条件:
                 </label>
                 <div className="flex-1 space-y-3">
                    {trigger.conditions.map((cond, idx) => (
                      <div key={cond.id} className="flex items-center space-x-3">
                         <span className="text-sm font-bold text-slate-600 w-4">{idx + 1}</span>
                         <div className="w-1/3 relative">
                           <input 
                             className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-primary"
                             placeholder="选择变量"
                             value={cond.field}
                             onChange={(e) => updateCondition(cond.id, { field: e.target.value })}
                             list="condition-fields"
                           />
                           <datalist id="condition-fields">
                             <option value="意向标签" />
                             <option value="标签" />
                             <option value="变量" />
                             <option value="对话轮次" />
                             <option value="通话时长" />
                           </datalist>
                         </div>
                         <select 
                           className="w-24 px-3 py-2 text-sm border border-gray-300 rounded bg-white outline-none focus:border-primary"
                           value={cond.operator}
                           onChange={(e) => updateCondition(cond.id, { operator: e.target.value })}
                         >
                           <option>等于</option>
                           <option>不等于</option>
                           <option>包含</option>
                           <option>大于</option>
                           <option>小于</option>
                         </select>
                         <select 
                           className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-white outline-none focus:border-primary"
                           value={cond.value}
                           onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                         >
                           <option value="">请选择值</option>
                           <option value="A级 (有明确意向)">A级 (有明确意向)</option>
                           <option value="B级 (可能有回向)">B级 (可能有回向)</option>
                         </select>
                         <button onClick={() => removeCondition(cond.id)} className="text-red-400 hover:text-red-600">
                           <MinusCircle size={18} className="fill-current" />
                         </button>
                      </div>
                    ))}
                    <button onClick={addCondition} className="text-green-600 hover:text-green-700 transition-colors">
                      <PlusCircle size={24} className="fill-current" />
                    </button>
                 </div>
              </div>

              {/* Logic */}
              <div className="flex items-center">
                 <label className="w-24 text-right pr-4 text-sm font-medium text-slate-700">
                   执行逻辑:
                 </label>
                 <div className="flex items-center space-x-6">
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" checked={trigger.logicType === 'ALL'} onChange={() => onChange({...trigger, logicType: 'ALL'})} className="mr-2" />
                      <span className="text-sm text-slate-700">满足所有条件</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" checked={trigger.logicType === 'ANY'} onChange={() => onChange({...trigger, logicType: 'ANY'})} className="mr-2" />
                      <span className="text-sm text-slate-700">满足任意条件</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" checked={trigger.logicType === 'CUSTOM'} onChange={() => onChange({...trigger, logicType: 'CUSTOM'})} className="mr-2" />
                      <span className="text-sm text-slate-700">自定义条件</span>
                      <HelpCircle size={14} className="ml-1 text-slate-400" />
                    </label>
                 </div>
              </div>

              {/* Actions */}
              <div className="flex items-start">
                 <label className="w-24 text-right pr-4 text-sm font-medium text-slate-700 pt-2">
                   触发动作:
                 </label>
                 <div className="flex-1 space-y-3">
                    {trigger.actions.map((action) => (
                      <div key={action.id} className="flex items-center border border-gray-200 rounded overflow-hidden">
                         <div className="px-3 py-2 bg-slate-50 border-r border-gray-200">
                           <Menu size={16} className="text-primary" />
                         </div>
                         <select 
                           className="w-1/3 px-3 py-2 text-sm border-r border-gray-200 bg-blue-50/30 text-slate-700 font-medium outline-none focus:bg-blue-50"
                           value={action.type}
                           onChange={(e) => updateAction(action.id, { type: e.target.value })}
                         >
                           <option>请求接口</option>
                           <option>发送短信</option>
                           <option>更新AI通话</option>
                           <option>更新客户信息</option>
                         </select>
                         <select 
                           className="flex-1 px-3 py-2 text-sm bg-white outline-none"
                           value={action.value}
                           onChange={(e) => updateAction(action.id, { value: e.target.value })}
                         >
                           <option value="">请选择配置</option>
                           <option value="11.4鉴权token">11.4鉴权token</option>
                           <option value="更新工单状态">更新工单状态</option>
                         </select>
                         <button onClick={() => removeAction(action.id)} className="px-3 py-2 text-slate-300 hover:text-red-500 hover:bg-slate-50 transition-colors">
                           <Trash size={16} />
                         </button>
                      </div>
                    ))}
                    <button onClick={addAction} className="text-primary hover:text-sky-600 transition-colors mt-2">
                      <PlusCircle size={20} />
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end space-x-3 shrink-0 bg-gray-50 rounded-b-lg">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded text-slate-600 text-sm hover:bg-white transition-colors">
            取消
          </button>
          <button onClick={onSave} className="px-6 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-sky-600 transition-colors shadow-sm">
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
