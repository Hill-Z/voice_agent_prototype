
import React, { useState } from 'react';
import { 
  Server, Phone, Route, Activity, Plus, MoreHorizontal, 
  ShieldCheck, AlertCircle, Signal
} from 'lucide-react';

// --- Types ---
interface Trunk {
  id: string;
  name: string;
  provider: string;
  ip: string;
  port: number;
  concurrency: number;
  status: 'active' | 'inactive' | 'error';
  latency: number;
}

interface PhoneNumber {
  id: string;
  number: string;
  location: string;
  tags: string[];
  boundTrunkId: string;
  capabilities: string[];
}

// --- Mock Data ---
const MOCK_TRUNKS: Trunk[] = [
  { id: '1', name: '阿里云-上海-A', provider: 'Aliyun', ip: '47.100.xx.xx', port: 5060, concurrency: 500, status: 'active', latency: 24 },
  { id: '2', name: 'Twilio-US-East', provider: 'Twilio', ip: 'sip.twilio.com', port: 5060, concurrency: 200, status: 'active', latency: 156 },
  { id: '3', name: '华为云-备用', provider: 'Huawei', ip: '119.3.xx.xx', port: 5061, concurrency: 100, status: 'inactive', latency: 0 },
];

const MOCK_NUMBERS: PhoneNumber[] = [
  { id: '1', number: '+86 21 5555 8888', location: '上海', tags: ['客服热线', 'VIP'], boundTrunkId: '1', capabilities: ['voice'] },
  { id: '2', number: '+86 10 6666 7777', location: '北京', tags: ['外呼营销'], boundTrunkId: '1', capabilities: ['voice', 'sms'] },
  { id: '3', number: '+1 415 555 0123', location: 'San Francisco', tags: ['海外支持'], boundTrunkId: '2', capabilities: ['voice'] },
];

export default function GatewayCenter() {
  const [activeTab, setActiveTab] = useState<'TRUNKS' | 'NUMBERS' | 'ROUTING'>('TRUNKS');

  return (
    <div className="flex h-full bg-slate-50 flex-col">
       {/* Header */}
       <div className="px-8 py-6 bg-white border-b border-gray-200">
          <div className="flex justify-between items-center mb-6">
             <div>
               <h1 className="text-2xl font-bold text-slate-900 tracking-tight">通信网关</h1>
               <p className="text-sm text-slate-500 mt-1">统一管理 SIP 中继线路、号码资源与呼叫路由策略</p>
             </div>
             <div className="flex items-center space-x-3">
                <div className="flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 text-xs font-bold">
                   <Activity size={12} className="mr-1.5" /> 系统状态正常
                </div>
             </div>
          </div>
          
          <div className="flex space-x-8">
            {[
              { id: 'TRUNKS', label: '线路管理 (Trunks)', icon: Server },
              { id: 'NUMBERS', label: '号码池 (Pool)', icon: Phone },
              { id: 'ROUTING', label: '路由策略 (Routing)', icon: Route },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-sm font-medium transition-all relative flex items-center ${
                  activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={16} className="mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
       </div>

       {/* Content */}
       <div className="flex-1 overflow-y-auto p-8">
          
          {activeTab === 'TRUNKS' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800">SIP 中继列表</h3>
                 <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-sky-600 flex items-center shadow-sm">
                    <Plus size={16} className="mr-2" /> 新增线路
                 </button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">线路名称</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">IP/Domain</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">并发能力</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">延迟 (ms)</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">状态</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_TRUNKS.map(trunk => (
                    <tr key={trunk.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{trunk.name}</div>
                        <div className="text-xs text-slate-500">{trunk.provider}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-600">
                        {trunk.ip}:{trunk.port}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {trunk.concurrency} CPS
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center text-xs">
                           <Signal size={12} className={`mr-1 ${trunk.latency < 50 ? 'text-green-500' : 'text-amber-500'}`} />
                           {trunk.latency > 0 ? trunk.latency : '-'}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        {trunk.status === 'active' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                            <ShieldCheck size={12} className="mr-1" /> 已注册
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                            <AlertCircle size={12} className="mr-1" /> 未激活
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'NUMBERS' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800">号码资源池</h3>
                 <div className="flex space-x-3">
                   <button className="border border-gray-300 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
                      批量导入
                   </button>
                   <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-sky-600 flex items-center shadow-sm">
                      <Plus size={16} className="mr-2" /> 申请号码
                   </button>
                 </div>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">号码</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">归属地</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">标签</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">能力</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_NUMBERS.map(num => (
                    <tr key={num.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono text-slate-700 font-medium">
                        {num.number}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {num.location}
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex gap-1">
                           {num.tags.map(t => (
                             <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">{t}</span>
                           ))}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex gap-1">
                            {num.capabilities.map(c => (
                              <span key={c} className="uppercase text-[10px] font-bold border border-slate-200 px-1 rounded text-slate-500">{c}</span>
                            ))}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'ROUTING' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start">
                   <AlertCircle className="text-amber-600 mt-0.5 mr-3 shrink-0" size={18} />
                   <div className="text-sm text-amber-800">
                      <p className="font-bold mb-1">路由策略说明</p>
                      <p>系统将根据优先级从上到下匹配路由规则。如果主线路故障，将自动切换至备份线路。</p>
                   </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                   {/* Simplified Routing Rules Visualization */}
                   {[
                     { name: '默认外呼策略', rule: '所有外呼 -> 优先使用 [阿里云-上海-A]', priority: 1 },
                     { name: '北京地区专线', rule: '被叫前缀 010 -> 强制使用 [本地中继]', priority: 2 },
                     { name: '海外呼叫路由', rule: '被叫前缀 +1 -> 优先使用 [Twilio-US]', priority: 3 }
                   ].map((route, i) => (
                     <div key={i} className="px-6 py-4 border-b border-gray-100 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center">
                           <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center mr-4 text-xs">
                             {route.priority}
                           </div>
                           <div>
                              <div className="font-bold text-slate-800 text-sm">{route.name}</div>
                              <div className="font-mono text-xs text-slate-500 mt-1">{route.rule}</div>
                           </div>
                        </div>
                        <div className="flex items-center space-x-4">
                           <div className="w-16 h-1 bg-gray-200 rounded overflow-hidden">
                              <div className="h-full bg-green-500 w-2/3"></div>
                           </div>
                           <button className="text-primary text-xs font-bold hover:underline">配置</button>
                        </div>
                     </div>
                   ))}
                   <div className="p-4 bg-slate-50 text-center">
                      <button className="text-sm text-primary font-medium hover:text-sky-700 flex items-center justify-center w-full">
                        <Plus size={16} className="mr-2" /> 添加路由规则
                      </button>
                   </div>
                </div>
             </div>
          )}
       </div>
    </div>
  );
}
