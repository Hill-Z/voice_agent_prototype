

import React, { useState } from 'react';
import { ExtractionConfig, BotVariable, AuthenticationConfig } from '../../types';
import { 
  Plus, 
  Trash2,
  Database, 
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Variable,
  PlayCircle
  ,Search
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
  authMode: 'reference',
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
  authentications: AuthenticationConfig[];
}

export default function InterfaceConfig({ configs, onUpdateConfigs, availableVariables = [], authentications }: InterfaceConfigProps) {
  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
  const [editingConfig, setEditingConfig] = useState<ExtractionConfig | null>(null);

  const handleCreate = () => {
    setEditingConfig({ ...DEFAULT_CONFIG, id: Date.now().toString(), authConfigId: authentications[0]?.id });
    setView('FORM');
  };

  const handleEdit = (config: ExtractionConfig) => {
    setEditingConfig(config);
    setView('FORM');
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('确认删除这个接口吗？')) return;
    onUpdateConfigs(configs.filter(c => c.id !== id));
  };

  const handleCopy = (source: ExtractionConfig) => {
    const copy: ExtractionConfig = { ...source, id: Date.now().toString(), name: `${source.name} - 副本`, lastUpdated: Date.now(), params: source.params.map((item) => ({ ...item, id: `${item.id}_copy` })), responseMapping: source.responseMapping.map((item) => ({ ...item })) };
    onUpdateConfigs([copy, ...configs]);
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
        onCopy={handleCopy}
        authentications={authentications}
      />
    );
  }

  return (
    <ExtractionFormView 
      initialData={editingConfig!} 
      onSave={handleSave} 
      onCancel={() => { setView('LIST'); setEditingConfig(null); }}
      availableVariables={availableVariables}
      authentications={authentications}
    />
  );
}

// --- LIST VIEW ---

const ExtractionListView: React.FC<{ 
  configs: ExtractionConfig[]; 
  onCreate: () => void; 
  onEdit: (c: ExtractionConfig) => void; 
  onDelete: (id: string) => void; 
  onCopy: (config: ExtractionConfig) => void;
  authentications: AuthenticationConfig[];
}> = ({ configs, onCreate, onEdit, onDelete, onCopy, authentications }) => {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const filtered = configs.filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(keyword.trim().toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const changeKeyword = (value: string) => { setKeyword(value); setPage(1); };
  return (
  <div className="p-8 max-w-7xl mx-auto w-full">
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">接口配置</h1>
        <p className="text-sm text-slate-500 mt-1">管理单个上游接口，可直接供机器人调用，也可作为工作流步骤。</p>
      </div>
      <button 
        onClick={onCreate}
        className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-sky-600 transition-all flex items-center shadow-lg shadow-sky-100"
      >
        <Plus size={18} className="mr-2" /> 新建接口
      </button>
    </div>

    <div className="mb-4 flex items-center justify-between">
      <div className="relative w-80"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={keyword} onChange={(event) => changeKeyword(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary" placeholder="搜索接口名称或描述" /></div>
      <span className="text-xs text-slate-400">共 {filtered.length} 个接口</span>
    </div>
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">名称</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">描述</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">鉴权</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {visible.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Database size={32} className="opacity-20" />
                  </div>
                  <p>{keyword ? '没有找到匹配的接口' : '暂无接口'}</p>
                </div>
              </td>
            </tr>
          ) : (
            visible.map(config => (
              <tr key={config.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{config.name || '未命名'}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs">
                  {config.description || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {config.authMode === 'reference' ? (authentications.find((item) => item.id === config.authConfigId)?.name || '未选择') : config.authMode === 'none' ? '无鉴权' : <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">兼容模式</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-4"><button onClick={() => onEdit(config)} className="text-sm text-primary hover:text-blue-700">编辑</button><button onClick={() => onCopy(config)} className="text-sm text-primary hover:text-blue-700">复制</button><button onClick={() => onDelete(config.id)} className="text-sm text-red-500 hover:text-red-600">删除</button></div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-sm"><span className="text-slate-400">第 {currentPage} / {pageCount} 页</span><div className="flex gap-2"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded border border-slate-200 px-3 py-1.5 text-slate-600 disabled:opacity-40">上一页</button><button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} className="rounded border border-slate-200 px-3 py-1.5 text-slate-600 disabled:opacity-40">下一页</button></div></div>
    </div>
  </div>
  );
};

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

type LegacyUrlAuthConfig = NonNullable<ExtractionConfig['legacyUrlAuthConfig']>;

const DEFAULT_URL_AUTH_CONFIG: LegacyUrlAuthConfig = {
  parameters: [
    { id: 'url_auth_token', name: 'token', type: 'variable', value: '', encode: false },
    { id: 'url_auth_timestamp', name: 'timestamp', type: 'timestamp', value: '', encode: true },
    { id: 'url_auth_nonce', name: 'nonce', type: 'random', value: '', encode: true },
    { id: 'url_auth_version', name: 'sign_version', type: 'constant', value: 'v2', encode: true },
  ],
  algorithm: 'sha256',
  signatureParameterName: 'sign',
};

function LegacyAuthenticationEditor({ config, authentications, availableVariables, onChange }: { config: ExtractionConfig; authentications: AuthenticationConfig[]; availableVariables: BotVariable[]; onChange: (config: ExtractionConfig) => void }) {
  const isReference = config.authMode === 'reference';
  const urlConfig = config.legacyUrlAuthConfig ?? DEFAULT_URL_AUTH_CONFIG;
  const selectLegacy = (authType: 'basic' | 'url') => onChange({ ...config, authMode: 'legacy', authType });
  const updateUrlConfig = (next: LegacyUrlAuthConfig) => onChange({ ...config, authMode: 'legacy', authType: 'url', legacyUrlAuthConfig: next });

  return <>
    <FormRow label="鉴权方式" tooltip="旧接口继续使用原鉴权；也可以改为引用鉴权管理中的配置。">
      <div className="flex items-center gap-6 py-2">
        <label className="flex items-center gap-2 text-sm text-slate-700"><input type="radio" name="interface-auth" checked={!isReference && config.authType === 'basic'} onChange={() => selectLegacy('basic')} />基本身份验证</label>
        <label className="flex items-center gap-2 text-sm text-slate-700"><input type="radio" name="interface-auth" checked={!isReference && config.authType === 'url'} onChange={() => selectLegacy('url')} />URL 鉴权</label>
        <label className="flex items-center gap-2 text-sm text-slate-700"><input type="radio" name="interface-auth" checked={isReference} onChange={() => onChange({ ...config, authMode: 'reference', authConfigId: config.authConfigId ?? authentications[0]?.id })} />引用已有鉴权</label>
      </div>
    </FormRow>

    {isReference && <FormRow label="引用鉴权"><select value={config.authConfigId ?? ''} onChange={(e) => onChange({ ...config, authConfigId: e.target.value })} className="w-96 rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"><option value="">请选择鉴权</option>{authentications.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormRow>}

    {!isReference && config.authType === 'basic' && <div className="ml-32 mb-6 grid grid-cols-2 gap-3 pl-4"><input value={config.legacyAuthConfig?.username ?? ''} onChange={(e) => onChange({ ...config, legacyAuthConfig: { ...config.legacyAuthConfig, username: e.target.value } })} className="rounded border border-gray-200 px-3 py-2 text-sm" placeholder="用户名" /><input type="password" value={config.legacyAuthConfig?.password ?? ''} onChange={(e) => onChange({ ...config, legacyAuthConfig: { ...config.legacyAuthConfig, password: e.target.value } })} className="rounded border border-gray-200 px-3 py-2 text-sm" placeholder="密码" /></div>}

    {!isReference && config.authType === 'url' && <LegacyUrlAuthentication config={urlConfig} variables={availableVariables} onChange={updateUrlConfig} />}
  </>;
}

function LegacyUrlAuthentication({ config, variables, onChange }: { config: LegacyUrlAuthConfig; variables: BotVariable[]; onChange: (config: LegacyUrlAuthConfig) => void }) {
  const updateParameter = (id: string, patch: Partial<LegacyUrlAuthConfig['parameters'][number]>) => onChange({ ...config, parameters: config.parameters.map((item) => item.id === id ? { ...item, ...patch } : item) });
  return <div className="ml-32 mb-6 space-y-5 pl-4">
    <div className="space-y-2"><div className="grid grid-cols-[150px_190px_1fr_120px_32px] gap-3 px-1 text-xs text-slate-400"><span>参数名</span><span>类型</span><span>参数值</span><span>URL 编码</span><span /></div>{config.parameters.map((parameter) => <div key={parameter.id} className="grid grid-cols-[150px_190px_1fr_120px_32px] gap-3 items-center"><input value={parameter.name} onChange={(e) => updateParameter(parameter.id, { name: e.target.value })} className="rounded border border-gray-200 px-3 py-2 text-sm" placeholder="参数名" /><select value={parameter.type} onChange={(e) => updateParameter(parameter.id, { type: e.target.value as LegacyUrlAuthConfig['parameters'][number]['type'], value: '' })} className="rounded border border-gray-200 bg-white px-3 py-2 text-sm"><option value="constant">常量</option><option value="variable">变量</option><option value="timestamp">时间戳</option><option value="random">随机字符串</option></select>{parameter.type === 'variable' ? <select value={parameter.value} onChange={(e) => updateParameter(parameter.id, { value: e.target.value })} className="rounded border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">请选择变量</option>{variables.map((item) => <option key={item.id} value={item.name}>{item.name}（{item.description}）</option>)}</select> : parameter.type === 'constant' ? <input value={parameter.value} onChange={(e) => updateParameter(parameter.id, { value: e.target.value })} className="rounded border border-gray-200 px-3 py-2 text-sm" placeholder="参数值" /> : <div className="rounded border border-gray-100 bg-slate-50 px-3 py-2 text-sm text-slate-400">系统自动生成</div>}<select value={parameter.encode ? 'yes' : 'no'} onChange={(e) => updateParameter(parameter.id, { encode: e.target.value === 'yes' })} className="rounded border border-gray-200 bg-white px-3 py-2 text-sm"><option value="yes">是</option><option value="no">否</option></select><button onClick={() => onChange({ ...config, parameters: config.parameters.filter((item) => item.id !== parameter.id) })} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button></div>)}</div>
    <button onClick={() => onChange({ ...config, parameters: [...config.parameters, { id: `url_auth_${Date.now()}`, name: '', type: 'constant', value: '', encode: false }] })} className="rounded border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:border-primary hover:text-primary"><Plus size={15} className="inline mr-1" />添加参数</button>
    <div className="grid grid-cols-[150px_260px] gap-3 items-center"><span className="text-right text-sm text-slate-600">加密算法</span><select value={config.algorithm} onChange={(e) => onChange({ ...config, algorithm: e.target.value as LegacyUrlAuthConfig['algorithm'] })} className="rounded border border-gray-200 bg-white px-3 py-2 text-sm"><option value="sha256">sha256</option></select><span className="text-right text-sm text-slate-600">签名参数名</span><input value={config.signatureParameterName} onChange={(e) => onChange({ ...config, signatureParameterName: e.target.value })} className="rounded border border-gray-200 px-3 py-2 text-sm" placeholder="sign" /></div>
  </div>;
}

const ExtractionFormView: React.FC<{ 
  initialData: ExtractionConfig; 
  onSave: (c: ExtractionConfig) => void; 
  onCancel: () => void;
  availableVariables: BotVariable[];
  authentications: AuthenticationConfig[];
}> = ({ initialData, onSave, onCancel, availableVariables, authentications }) => {
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
              {initialData.name ? '编辑接口' : '新建接口'}
            </h1>
           </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm font-medium text-primary hover:bg-slate-50 transition-all flex items-center">
            <PlayCircle size={14} className="mr-1" /> 接口测试
          </button>
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
            placeholder="请输入接口名称"
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
                onChange={(e) => updateField('method', e.target.value as ExtractionConfig['method'])}
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

        <LegacyAuthenticationEditor config={config} authentications={authentications} availableVariables={availableVariables} onChange={setConfig} />

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
