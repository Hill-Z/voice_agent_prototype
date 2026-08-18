

import React, { useState } from 'react';
import { ModelType, ExtractionConfig, BotVariable } from '../../types';
import { 
  Plus, 
  Trash2, 
  Database, 
  Edit3, 
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Variable
} from 'lucide-react';

const DEFAULT_CONFIG: ExtractionConfig = {
  id: '',
  name: '',
  description: '',
  lastUpdated: Date.now(),
  params: [],
  interfaceUrl: '',
  method: 'POST',
  authType: 'url',
  bodyType: 'json',
  bodyContent: '{}',
  responseMapping: []
};

const INTERFACE_TEMPLATES = [
  { name: 'Udesk工单鉴权', config: {} },
  { name: 'Udesk工单创建', config: {} },
  { name: '微丰RPA自动加好友', config: {} },
  { name: '微丰客户标签更新', config: {} },
  { name: 'Udesk工单查询', config: {} },
  { name: 'SG记录更新', config: {} }
];

interface InterfaceConfigProps {
  configs: ExtractionConfig[];
  onUpdateConfigs: (configs: ExtractionConfig[]) => void;
  availableVariables?: BotVariable[];
}

export default function InterfaceConfig({ configs, onUpdateConfigs, availableVariables = [] }: InterfaceConfigProps) {
  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
  const [editingConfig, setEditingConfig] = useState<ExtractionConfig | null>(null);

  const handleCreate = () => {
    setEditingConfig({ ...DEFAULT_CONFIG, id: Date.now().toString() });
    setView('FORM');
  };

  const handleEdit = (config: ExtractionConfig) => {
    setEditingConfig(config);
    setView('FORM');
  };

  const handleDelete = (id: string) => {
    onUpdateConfigs(configs.filter(c => c.id !== id));
  };

  const handleSave = (config: ExtractionConfig) => {
    const exists = configs.find(c => c.id === config.id);
    if (exists) {
      onUpdateConfigs(configs.map(c => c.id === config.id ? config : c));
    } else {
      onUpdateConfigs([config, ...configs]);
    }
    setView('LIST');
    setEditingConfig(null);
  };

  if (view === 'LIST') {
    return (
      <ExtractionListView 
        configs={configs} 
        onCreate={handleCreate} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />
    );
  }

  return (
    <ExtractionFormView 
      initialData={editingConfig!} 
      onSave={handleSave} 
      onCancel={() => { setView('LIST'); setEditingConfig(null); }}
      availableVariables={availableVariables}
    />
  );
}

// --- LIST VIEW ---

const ExtractionListView: React.FC<{ 
  configs: ExtractionConfig[]; 
  onCreate: () => void; 
  onEdit: (c: ExtractionConfig) => void; 
  onDelete: (id: string) => void; 
}> = ({ configs, onCreate, onEdit, onDelete }) => (
  <div className="p-8 max-w-7xl mx-auto w-full">
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">接口配置</h1>
        <p className="text-sm text-slate-500 mt-1">管理接口调用与信息提取方案</p>
      </div>
      <button 
        onClick={onCreate}
        className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-sky-600 transition-all flex items-center shadow-lg shadow-sky-100"
      >
        <Plus size={18} className="mr-2" /> 新建提取方案
      </button>
    </div>

    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">方案名称</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">描述</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">接口类型</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {configs.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Database size={32} className="opacity-20" />
                  </div>
                  <p>暂无提取方案</p>
                </div>
              </td>
            </tr>
          ) : (
            configs.map(config => (
              <tr key={config.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{config.name || '未命名'}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs">
                  {config.description || '-'}
                </td>
                <td className="px-6 py-4">
                   <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${config.method === 'POST' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                     {config.method}
                   </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(config)} className="p-2 text-slate-400 hover:text-primary hover:bg-sky-50 rounded-lg transition-colors">
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => onDelete(config.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// --- FORM VIEW ---

interface FormRowProps {
  label: string;
  required?: boolean;
  tooltip?: string;
  children: React.ReactNode;
  alignTop?: boolean;
}

const FormRow: React.FC<FormRowProps> = ({ label, required, tooltip, children, alignTop = false }) => (
  <div className={`flex ${alignTop ? 'items-start' : 'items-center'} space-x-4 mb-6`}>
    <div className={`w-28 text-right pr-4 shrink-0 ${alignTop ? 'pt-2' : ''}`}>
      <span className="text-sm font-medium text-slate-600 relative">
        {required && <span className="text-red-500 absolute -left-2.5 top-0">*</span>}
        {label}
        {tooltip && (
          <div className="inline-block ml-1 group relative align-middle">
            <HelpCircle size={12} className="text-slate-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {tooltip}
            </div>
          </div>
        )}
      </span>
    </div>
    <div className="flex-1 max-w-4xl">
      {children}
    </div>
  </div>
);

const ExtractionFormView: React.FC<{ 
  initialData: ExtractionConfig; 
  onSave: (c: ExtractionConfig) => void; 
  onCancel: () => void;
  availableVariables: BotVariable[];
}> = ({ initialData, onSave, onCancel, availableVariables }) => {
  const [config, setConfig] = useState<ExtractionConfig>({ ...initialData });
  const [showTemplates, setShowTemplates] = useState(false);

  const updateField = <K extends keyof ExtractionConfig>(key: K, value: ExtractionConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full pb-20 animate-in fade-in duration-300">
      {/* Header with Template Selector */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
        <div>
           <div className="flex items-center mb-2">
            <button onClick={onCancel} className="text-xs text-slate-400 hover:text-primary flex items-center transition-colors mr-2">
              <ArrowRight size={12} className="rotate-180 mr-1" /> 返回
            </button>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {initialData.id ? '编辑提取方案' : '新建提取方案'}
            </h1>
           </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button 
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm font-medium text-primary hover:bg-slate-50 transition-all flex items-center"
            >
              预置模板 <ChevronDown size={14} className="ml-1" />
            </button>
            {showTemplates && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
                <div className="px-3 py-2 text-[10px] text-slate-400 bg-slate-50 font-bold border-b border-slate-100">
                  选择模板填充配置
                </div>
                {INTERFACE_TEMPLATES.map((t, i) => (
                  <button 
                    key={i} 
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-sky-50 hover:text-primary border-b border-slate-50 last:border-0"
                    onClick={() => {
                      updateField('name', t.name);
                      setShowTemplates(false);
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded border border-gray-200 shadow-sm p-8">
        
        {/* Basic Info */}
        <FormRow label="名称" required>
          <input 
            className="w-1/3 min-w-[300px] px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none transition-all"
            value={config.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="请输入方案名称"
          />
        </FormRow>

        <FormRow label="描述" alignTop>
          <textarea 
            className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none transition-all resize-none bg-slate-50/30"
            value={config.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="描述该接口的功能及返回值映射关系..."
          />
        </FormRow>

        {/* Removed LLM & Prompt Section */}

        {/* Request Type & URL */}
        <FormRow label="类型" required>
           <div className="w-1/4">
             <div className="relative">
                <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded appearance-none bg-white focus:outline-none focus:border-primary">
                  <option>自定义</option>
                  <option>系统预设</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
             </div>
           </div>
        </FormRow>

        <FormRow label="请求类型" required>
          <div className="flex space-x-2 w-full">
            <div className="relative w-28 shrink-0">
              <select 
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded appearance-none bg-white outline-none focus:border-primary"
                value={config.method}
                onChange={(e) => updateField('method', e.target.value as any)}
              >
                <option>POST</option>
                <option>GET</option>
                <option>PUT</option>
                <option>DELETE</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
            </div>
            <input 
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded outline-none focus:border-primary" 
              value={config.interfaceUrl}
              onChange={(e) => updateField('interfaceUrl', e.target.value)}
              placeholder="https://api.example.com/v1/resource" 
            />
          </div>
        </FormRow>

        <FormRow label="鉴权方式">
          <div className="flex items-center space-x-6 py-2">
            <label className="flex items-center cursor-pointer group">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-2 transition-colors ${config.authType === 'basic' ? 'border-primary' : 'border-gray-300'}`}>
                {config.authType === 'basic' && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <input 
                type="radio" 
                name="auth" 
                className="hidden" 
                checked={config.authType === 'basic'} 
                onChange={() => updateField('authType', 'basic')} 
              /> 
              <span className={`text-sm ${config.authType === 'basic' ? 'text-slate-800' : 'text-slate-600'}`}>基本身份验证</span>
            </label>
            <label className="flex items-center cursor-pointer group">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-2 transition-colors ${config.authType === 'url' ? 'border-primary' : 'border-gray-300'}`}>
                {config.authType === 'url' && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <input 
                type="radio" 
                name="auth" 
                className="hidden" 
                checked={config.authType === 'url'} 
                onChange={() => updateField('authType', 'url')} 
              /> 
               <span className={`text-sm ${config.authType === 'url' ? 'text-slate-800' : 'text-slate-600'}`}>url鉴权</span>
            </label>
          </div>
        </FormRow>
        
        {config.authType === 'basic' && (
           <div className="ml-32 pl-4 mb-6 space-y-3 border-l border-slate-100">
             <div className="flex items-center space-x-4">
               <span className="w-16 text-right text-xs text-slate-500">用户名</span>
               <input className="w-64 px-3 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-primary" placeholder="用户名" />
             </div>
             <div className="flex items-center space-x-4">
               <span className="w-16 text-right text-xs text-slate-500">密码</span>
               <input className="w-64 px-3 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-primary" type="password" placeholder="密码" />
             </div>
           </div>
        )}

        <FormRow label="接口参数" alignTop>
           <div className="w-full space-y-3">
             {config.params.map((param, idx) => (
               <div key={param.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                 <input 
                   className="w-32 px-3 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-primary bg-white"
                   value={param.key}
                   onChange={(e) => {
                     const newParams = [...config.params];
                     newParams[idx] = { ...param, key: e.target.value };
                     updateField('params', newParams);
                   }}
                   placeholder="参数名"
                 />
                 <input 
                   className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-primary bg-white"
                   value={param.desc}
                   onChange={(e) => {
                     const newParams = [...config.params];
                     newParams[idx] = { ...param, desc: e.target.value };
                     updateField('params', newParams);
                   }}
                   placeholder="参数描述"
                 />
                 
                 {/* 来源选择 */}
                 <div className="flex items-center space-x-2">
                   <select
                     className="px-2 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-primary bg-white"
                     value={param.source || 'llm'}
                     onChange={(e) => {
                       const newParams = [...config.params];
                       newParams[idx] = { 
                         ...param, 
                         source: e.target.value as 'llm' | 'variable',
                         variableName: e.target.value === 'variable' ? (availableVariables[0]?.name || '') : undefined
                       };
                       updateField('params', newParams);
                     }}
                   >
                     <option value="llm">LLM提取</option>
                     <option value="variable">变量映射</option>
                   </select>
                   
                   {param.source === 'variable' && (
                     <select
                       className="px-2 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-primary bg-white min-w-[120px]"
                       value={param.variableName || ''}
                       onChange={(e) => {
                         const newParams = [...config.params];
                         newParams[idx] = { ...param, variableName: e.target.value };
                         updateField('params', newParams);
                       }}
                     >
                       <option value="">选择变量</option>
                       {availableVariables.map(v => (
                         <option key={v.id} value={v.name}>{v.name} ({v.description})</option>
                       ))}
                     </select>
                   )}
                 </div>
                 
                 <button 
                   onClick={() => {
                     const newParams = config.params.filter((_, i) => i !== idx);
                     updateField('params', newParams);
                   }}
                   className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                 >
                   <Trash2 size={14} />
                 </button>
               </div>
             ))}
             <button 
               onClick={() => {
                 updateField('params', [
                   ...config.params, 
                   { id: Date.now().toString(), key: '', desc: '', source: 'llm' }
                 ]);
               }}
               className="px-3 py-1.5 border border-dashed border-gray-300 rounded text-xs text-slate-600 flex items-center hover:border-primary hover:text-primary transition-all"
             >
               <Plus size={12} className="mr-1" /> 添加参数
             </button>
             
             {availableVariables.length === 0 && (
               <p className="text-[10px] text-slate-400">暂无可用变量，变量映射功能需要先在机器人配置中定义变量</p>
             )}
           </div>
        </FormRow>

        <FormRow label="请求体" alignTop>
           <div className="w-full">
              <div className="flex border border-gray-200 rounded-t overflow-hidden w-fit">
                <button 
                  onClick={() => updateField('bodyType', 'form')}
                  className={`px-4 py-1.5 text-xs font-medium transition-colors ${config.bodyType === 'form' ? 'bg-white text-primary border-t-2 border-t-primary' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-t-2 border-t-transparent'}`}
                >
                  x-www-form-urlencoded
                </button>
                <button 
                  onClick={() => updateField('bodyType', 'json')}
                  className={`px-4 py-1.5 text-xs font-medium border-l border-gray-200 transition-colors ${config.bodyType === 'json' ? 'bg-white text-primary border-t-2 border-t-primary' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-t-2 border-t-transparent'}`}
                >
                  Body
                </button>
              </div>
              <div className="border border-t-0 border-gray-200 rounded-b p-3 min-h-[160px] font-mono text-sm leading-relaxed relative">
                  {config.bodyType === 'json' ? (
                    <textarea 
                      className="w-full h-40 outline-none resize-none text-slate-700" 
                      value={config.bodyContent}
                      onChange={(e) => updateField('bodyContent', e.target.value)}
                    />
                  ) : (
                    <div className="text-slate-400 italic p-4 text-center text-xs">表单参数配置占位符...</div>
                  )}
                  {/* Floating Action Button */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <button className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105" title="格式化JSON">
                       <HelpCircle size={16} />
                    </button>
                  </div>
              </div>
           </div>
        </FormRow>

        <FormRow label="接口返回值" alignTop>
           <div className="space-y-3 w-full">
              {config.responseMapping.map((map, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <input 
                    className="w-1/3 min-w-[200px] px-3 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-primary" 
                    value={map.key} 
                    readOnly 
                    placeholder="变量名"
                  />
                  <span className="text-slate-400">=</span>
                  <input 
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-primary" 
                    value={map.path} 
                    readOnly 
                    placeholder="JSONPath (e.g. $.data.id)"
                  />
                  <button className="p-1.5 text-slate-300 hover:text-red-500 border border-transparent hover:border-slate-200 rounded-full transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => updateField('responseMapping', [...config.responseMapping, { key: 'new_var', path: '$.data' }])}
                className="px-3 py-1.5 border border-dashed border-gray-300 rounded text-xs text-slate-600 flex items-center hover:border-primary hover:text-primary transition-all mt-2"
              >
                <Plus size={12} className="mr-1" /> 添加接口参数
              </button>
           </div>
        </FormRow>
        
        {/* Footer Actions */}
        <div className="flex justify-center space-x-4 mt-10 pt-6 border-t border-gray-100">
           <button onClick={onCancel} className="px-8 py-2.5 border border-gray-300 rounded text-slate-600 hover:bg-slate-50 text-sm font-medium transition-all">
             取消
           </button>
           <button onClick={() => onSave(config)} className="px-8 py-2.5 bg-primary text-white rounded hover:bg-sky-600 text-sm font-medium shadow-md transition-all">
             保存
           </button>
        </div>

      </div>
    </div>
  );
}
