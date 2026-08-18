
// 客户记忆管理后台，管理客户级记忆字段、通话小结和记忆配置，入口由 App 与侧边栏挂载。
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Database, FileText, Search, Settings, X } from 'lucide-react';

type MemoryPage = 'manage' | 'detail' | 'config';

type CustomerMemory = {
  id: string;
  name: string;
  phone: string;
  enabled: boolean;
  lastCall: string;
  summaryUpdated: string;
  fields: Record<string, string>;
};

type MemoryField = {
  name: string;
  code: string;
  value: string;
  display: string;
  sourceType: string;
  callId: string;
  fragment: string;
  method: string;
  confidence: string;
  updated: string;
  ttl: string;
  inPrompt: string;
  status: string;
};

const customers: CustomerMemory[] = [
  { id: 'C10086', name: '张女士', phone: '138****8899', enabled: true, lastCall: '2026-06-21 18:44', summaryUpdated: '2026-06-21 18:46', fields: { 订单编号: 'TS202606210018', 渠道: '抖音', 服务类型: '日常保洁', 当前处理状态: '预约不上' } },
  { id: 'C10087', name: '李先生', phone: '139****1188', enabled: true, lastCall: '2026-06-19 10:28', summaryUpdated: '2026-06-19 10:31', fields: { 渠道: '美团', 服务类型: '家电清洗', 当前处理状态: '已解决' } },
  { id: 'C10088', name: '王女士', phone: '137****6622', enabled: false, lastCall: '2026-06-16 15:33', summaryUpdated: '2026-06-16 15:35', fields: { 渠道: 'APP', 服务类型: '做饭', 当前处理状态: '退款中' } },
];

const fieldRecords: MemoryField[] = [
  { name: '订单编号', code: 'order_no', value: 'TS202606210018', display: 'TS202606210018', sourceType: '工具结果', callId: 'call_20260621_1844', fragment: '订单查询结果显示订单编号 TS202606210018，当前未完成预约。', method: '工具同步', confidence: '1.00', updated: '2026-06-21 18:44', ttl: '30天', inPrompt: '是', status: '生效' },
  { name: '渠道', code: 'channel', value: '抖音', display: '抖音', sourceType: '用户表达', callId: 'call_20260621_1844', fragment: '我是在抖音买的券，现在约不上。', method: 'LLM抽取', confidence: '0.96', updated: '2026-06-21 18:44', ttl: '30天', inPrompt: '是', status: '生效' },
  { name: '服务类型', code: 'service_type', value: '日常保洁', display: '日常保洁', sourceType: '工具结果', callId: 'call_20260621_1844', fragment: '订单服务项目：日常保洁 3 小时。', method: '工具同步', confidence: '1.00', updated: '2026-06-21 18:44', ttl: '30天', inPrompt: '是', status: '生效' },
  { name: '当前处理状态', code: 'handle_status', value: '预约不上', display: '预约不上', sourceType: '通话小结', callId: 'call_20260621_1844', fragment: '客户表示页面时间置灰，无法选择上门时间。', method: 'LLM抽取', confidence: '0.91', updated: '2026-06-21 18:46', ttl: '14天', inPrompt: '是', status: '生效' },
];

const summaries = [
  { callId: 'call_20260621_1844', time: '2026-06-21 18:44', summary: '客户购买抖音日常保洁券后无法预约，页面时间置灰；已确认订单存在，当前问题未解决。', ttl: '14天', inPrompt: '是' },
  { callId: 'call_20260619_1028', time: '2026-06-19 10:28', summary: '客户咨询日常保洁是否包含擦玻璃，已告知需以购买项目和页面说明为准。', ttl: '14天', inPrompt: '是' },
];

const Pill: React.FC<React.PropsWithChildren> = ({ children }) => <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium mr-1 mb-1">{children}</span>;

interface CustomerMemoryManagerProps {
  initialPage?: 'manage' | 'config';
}

export default function CustomerMemoryManager({ initialPage = 'manage' }: CustomerMemoryManagerProps) {
  const [page, setPage] = useState<MemoryPage>(initialPage);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMemory>(customers[0]);
  const [selectedField, setSelectedField] = useState<MemoryField | null>(null);
  const [activeTab, setActiveTab] = useState<'fields' | 'summaries'>('fields');
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [configNotice, setConfigNotice] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

  // 打开客户详情页，展示该客户已沉淀的字段与小结。
  const openCustomer = (customer: CustomerMemory) => {
    setSelectedCustomer(customer);
    setPage('detail');
  };

  // 原型态交互：本地切换客户记忆开关，避免按钮看起来无效。
  const toggleSelectedCustomerMemory = () => {
    setSelectedCustomer(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">客户记忆</h1>
          <p className="text-sm text-slate-500 mt-1">管理客户记忆字段、最近通话小结和进入提示词的记忆配置。</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPage('manage')} className={`px-3 py-2 rounded-lg text-sm border ${page !== 'config' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200'}`}>记忆管理</button>
          <button onClick={() => setPage('config')} className={`px-3 py-2 rounded-lg text-sm border ${page === 'config' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200'}`}>记忆配置</button>
        </div>
      </div>

      {page === 'manage' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="relative w-96 max-w-full">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input value={searchKeyword} onChange={event => setSearchKeyword(event.target.value)} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="搜索客户ID / 名称 / 手机号 / 自定义字段" />
            </div>
            <button onClick={() => setSearchKeyword('')} className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">重置筛选</button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="text-left px-5 py-3">客户ID</th><th className="text-left px-5 py-3">名称</th><th className="text-left px-5 py-3">手机号</th><th className="text-left px-5 py-3">自定义字段</th><th className="text-left px-5 py-3">最近通话时间</th><th className="text-left px-5 py-3">最近小结更新时间</th><th className="text-left px-5 py-3">记忆开关</th><th className="text-left px-5 py-3">操作</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map(customer => (
                <tr key={customer.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-mono text-xs text-slate-600">{customer.id}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{customer.name}</td>
                  <td className="px-5 py-4 text-slate-600">{customer.phone}</td>
                  <td className="px-5 py-4 max-w-xs">{Object.entries(customer.fields).slice(0, 3).map(([key, value]) => <Pill key={key}>{key}：{value}</Pill>)}</td>
                  <td className="px-5 py-4 text-slate-500">{customer.lastCall}</td>
                  <td className="px-5 py-4 text-slate-500">{customer.summaryUpdated}</td>
                  <td className="px-5 py-4"><span className={`inline-flex h-6 w-11 rounded-full ${customer.enabled ? 'bg-primary' : 'bg-slate-300'} relative after:absolute after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white ${customer.enabled ? 'after:left-6' : 'after:left-1'}`}></span></td>
                  <td className="px-5 py-4"><button onClick={() => openCustomer(customer)} className="text-primary text-sm font-medium hover:underline">查看详情</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {page === 'detail' && (
        <div className="space-y-4">
          <button onClick={() => setPage('manage')} className="text-sm text-slate-500 hover:text-primary flex items-center gap-1"><ArrowLeft size={14} /> 返回记忆管理</button>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{selectedCustomer.name}</h2>
              <p className="text-sm text-slate-500 mt-1">{selectedCustomer.id} · {selectedCustomer.phone}</p>
              <div className="mt-3">{Object.entries(selectedCustomer.fields).map(([key, value]) => <Pill key={key}>{key}：{value}</Pill>)}</div>
            </div>
            <button onClick={toggleSelectedCustomerMemory} className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">{selectedCustomer.enabled ? '关闭记忆' : '开启记忆'}</button>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100 px-4">
              <button onClick={() => setActiveTab('fields')} className={`px-4 py-3 text-sm font-medium ${activeTab === 'fields' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}>字段记忆</button>
              <button onClick={() => setActiveTab('summaries')} className={`px-4 py-3 text-sm font-medium ${activeTab === 'summaries' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}>通话小结</button>
            </div>
            {activeTab === 'fields' ? (
              <table className="w-full text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="text-left px-5 py-3">字段</th><th className="text-left px-5 py-3">当前值</th><th className="text-left px-5 py-3">来源</th><th className="text-left px-5 py-3">置信度</th><th className="text-left px-5 py-3">有效期</th><th className="text-left px-5 py-3">操作</th></tr></thead><tbody className="divide-y divide-slate-100">{fieldRecords.map(field => <tr key={field.code}><td className="px-5 py-4"><div className="font-semibold">{field.name}</div><div className="text-xs text-slate-400 font-mono">{field.code}</div></td><td className="px-5 py-4">{field.display}</td><td className="px-5 py-4">{field.sourceType}</td><td className="px-5 py-4">{field.confidence}</td><td className="px-5 py-4">{field.ttl}</td><td className="px-5 py-4"><button onClick={() => setSelectedField(field)} className="text-primary hover:underline">查看</button></td></tr>)}</tbody></table>
            ) : (
              <table className="w-full text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="text-left px-5 py-3">通话ID</th><th className="text-left px-5 py-3">时间</th><th className="text-left px-5 py-3">小结</th><th className="text-left px-5 py-3">进入提示词</th><th className="text-left px-5 py-3">有效期</th></tr></thead><tbody className="divide-y divide-slate-100">{summaries.map(item => <tr key={item.callId}><td className="px-5 py-4 font-mono text-xs">{item.callId}</td><td className="px-5 py-4">{item.time}</td><td className="px-5 py-4 max-w-xl">{item.summary}</td><td className="px-5 py-4">{item.inPrompt}</td><td className="px-5 py-4">{item.ttl}</td></tr>)}</tbody></table>
            )}
          </div>
        </div>
      )}

      {page === 'config' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div><h2 className="text-xl font-bold text-slate-900">记忆配置</h2><p className="text-sm text-slate-500 mt-1">配置记忆开关、自定义记忆字段、抽取提示词和通话小结提示词。</p></div>
            <div className="flex items-center gap-2">
              {configNotice && <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">{configNotice}</span>}
              <button onClick={() => setConfigNotice('草稿已保存')} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">保存草稿</button>
              <button onClick={() => setConfigNotice('配置已发布')} className="px-3 py-2 bg-primary text-white rounded-lg text-sm">发布配置</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {['是否开启记忆：开启', '默认进入提示词：是', '小结保留轮数：5', '小结有效期：14天', '字段更新策略：新值覆盖旧值', '字段缺失处理：标记未获取'].map(item => <div key={item} className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700"><Settings size={16} className="text-primary mb-2" />{item}</div>)}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2"><Database size={18} />自定义记忆字段</h3>
                <p className="text-xs text-slate-500 mt-1">定义语音 Agent 需要长期记住的客户字段，以及是否进入下一轮 Prompt。</p>
              </div>
              <button onClick={() => setIsFieldModalOpen(true)} className="px-3 py-2 bg-primary text-white rounded-lg text-sm">新增字段</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1120px]">
                <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="text-left px-4 py-3">字段编码</th><th className="text-left px-4 py-3">字段名称</th><th className="text-left px-4 py-3">字段类型</th><th className="text-left px-4 py-3">是否启用</th><th className="text-left px-4 py-3">强制抽取</th><th className="text-left px-4 py-3">进入 Prompt</th><th className="text-left px-4 py-3">脱敏规则</th><th className="text-left px-4 py-3">有效期</th><th className="text-left px-4 py-3">抽取说明</th><th className="text-left px-4 py-3">操作</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {fieldRecords.map(field => (
                    <tr key={field.code}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{field.code}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{field.name}</td>
                      <td className="px-4 py-3">{field.name.includes('地址') ? '地址' : field.name.includes('状态') || field.name.includes('渠道') ? '枚举' : '文本'}</td>
                      <td className="px-4 py-3"><span className="inline-flex h-5 w-9 rounded-full bg-primary relative after:absolute after:top-1 after:left-5 after:h-3 after:w-3 after:rounded-full after:bg-white"></span></td>
                      <td className="px-4 py-3"><span className="inline-flex h-5 w-9 rounded-full bg-primary relative after:absolute after:top-1 after:left-5 after:h-3 after:w-3 after:rounded-full after:bg-white"></span></td>
                      <td className="px-4 py-3">{field.inPrompt}</td>
                      <td className="px-4 py-3">{field.name.includes('地址') ? '局部脱敏' : '不脱敏'}</td>
                      <td className="px-4 py-3">{field.ttl}</td>
                      <td className="px-4 py-3 max-w-xs text-slate-500">{field.fragment}</td>
                      <td className="px-4 py-3"><button onClick={() => setIsFieldModalOpen(true)} className="text-primary hover:underline mr-3">编辑</button><button onClick={() => setConfigNotice(`${field.name} 已停用`)} className="text-slate-400 hover:text-red-500">停用</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 text-blue-50 rounded-2xl p-5 text-sm leading-7 whitespace-pre-wrap"><FileText size={18} className="mb-3" />字段抽取提示词\n你需要从本轮通话文本、工具返回结果和已有客户上下文中抽取配置字段。只抽取明确出现的信息，不允许猜测。字段缺失时返回 null，敏感字段按字段配置脱敏。</div>
            <div className="bg-slate-900 text-blue-50 rounded-2xl p-5 text-sm leading-7 whitespace-pre-wrap"><FileText size={18} className="mb-3" />通话小结提示词\n你需要为本轮语音通话生成一条可供下一轮语音 Agent 使用的小结。小结只保留下一轮继续服务客户时需要的信息，不复述完整对话。</div>
          </div>
        </div>
      )}

      {isFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between"><h3 className="text-xl font-bold text-slate-900">自定义记忆字段</h3><button onClick={() => setIsFieldModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button></div>
            <div className="p-5 grid grid-cols-2 gap-4 text-sm">
              <label className="space-y-1"><span className="text-slate-600">字段编码</span><input className="w-full border border-slate-200 rounded-lg px-3 py-2" defaultValue="order_no" /></label>
              <label className="space-y-1"><span className="text-slate-600">字段名称</span><input className="w-full border border-slate-200 rounded-lg px-3 py-2" defaultValue="订单编号" /></label>
              <label className="space-y-1"><span className="text-slate-600">字段类型</span><select className="w-full border border-slate-200 rounded-lg px-3 py-2"><option>文本</option><option>枚举</option><option>地址</option><option>日期</option><option>数字</option></select></label>
              <label className="space-y-1"><span className="text-slate-600">有效期</span><select className="w-full border border-slate-200 rounded-lg px-3 py-2"><option>30天</option><option>14天</option><option>7天</option><option>永久</option></select></label>
              <label className="space-y-1"><span className="text-slate-600">脱敏规则</span><select className="w-full border border-slate-200 rounded-lg px-3 py-2"><option>不脱敏</option><option>局部脱敏</option><option>全脱敏</option></select></label>
              <div className="space-y-2"><label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> 是否启用</label><label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> 强制抽取</label><label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> 进入 Prompt</label></div>
              <label className="col-span-2 space-y-1"><span className="text-slate-600">抽取说明</span><textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 min-h-[90px]" defaultValue="抽取客户当前咨询或工具返回的订单编号。" /></label>
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-2"><button onClick={() => setIsFieldModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">取消</button><button onClick={() => setIsFieldModalOpen(false)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">保存字段</button></div>
          </div>
        </div>
      )}

      {selectedField && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30">
          <div className="w-[520px] max-w-[96vw] bg-white h-full shadow-2xl overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between"><div><h3 className="text-xl font-bold text-slate-900">字段抽取详情</h3><p className="text-sm text-slate-500 mt-1">{selectedField.name}</p></div><button onClick={() => setSelectedField(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button></div>
            <div className="p-5 grid grid-cols-[120px_1fr] gap-3 text-sm">{Object.entries(selectedField).map(([key, value]) => <React.Fragment key={key}><div className="text-slate-500">{key}</div><div className="text-slate-800 break-words">{value}</div></React.Fragment>)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
