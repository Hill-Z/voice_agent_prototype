
import React, { useState } from 'react';
import { 
  Search, Link2, CheckCircle2, Settings, ExternalLink, 
  MessageSquare, Users, ShoppingCart, HelpCircle, Plug, Plus
} from 'lucide-react';
import { Switch, Input, Label } from '../ui/FormComponents';

// --- Types ---
interface IntegrationApp {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  description: string;
  status: 'connected' | 'disconnected';
  config?: any;
}

// --- Mock Data ---
const AVAILABLE_APPS: IntegrationApp[] = [
  {
    id: 'zendesk',
    name: 'Zendesk Support',
    category: '客服工单',
    icon: <div className="w-10 h-10 bg-emerald-900 text-white rounded flex items-center justify-center font-bold text-lg">Z</div>,
    description: '自动创建工单、更新客户信息、同步通话记录到 Zendesk。',
    status: 'connected',
  },
  {
    id: 'salesforce',
    name: 'Salesforce CRM',
    category: 'CRM',
    icon: <div className="w-10 h-10 bg-blue-500 text-white rounded flex items-center justify-center font-bold text-lg">S</div>,
    description: '双向同步销售线索(Leads)与联系人，记录通话活动。',
    status: 'disconnected',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    icon: <div className="w-10 h-10 bg-orange-500 text-white rounded flex items-center justify-center font-bold text-lg">H</div>,
    description: '强大的入站营销与销售自动化集成。',
    status: 'disconnected',
  },
  {
    id: 'slack',
    name: 'Slack',
    category: '团队协作',
    icon: <div className="w-10 h-10 bg-purple-600 text-white rounded flex items-center justify-center font-bold text-lg">Sl</div>,
    description: '将重要通话摘要或告警实时发送到 Slack 频道。',
    status: 'disconnected',
  },
  {
    id: 'udesk',
    name: 'Udesk',
    category: '客服工单',
    icon: <div className="w-10 h-10 bg-blue-600 text-white rounded flex items-center justify-center font-bold text-lg">U</div>,
    description: '国内领先的智能客服系统深度集成。',
    status: 'disconnected',
  },
  {
    id: 'webhook',
    name: '通用 Webhook',
    category: '开发者',
    icon: <div className="w-10 h-10 bg-slate-700 text-white rounded flex items-center justify-center font-bold text-lg"><Plug size={20}/></div>,
    description: '通过 HTTP 回调将事件推送到您的自定义后端。',
    status: 'connected',
  }
];

export default function IntegrationCenter() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'CONNECTED'>('ALL');
  const [selectedApp, setSelectedApp] = useState<IntegrationApp | null>(null);

  const filteredApps = activeTab === 'CONNECTED' 
    ? AVAILABLE_APPS.filter(app => app.status === 'connected') 
    : AVAILABLE_APPS;

  return (
    <div className="flex h-full bg-slate-50 relative overflow-hidden">
      {/* Main List Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="px-8 py-6 bg-white border-b border-gray-200">
          <div className="flex justify-between items-center mb-6">
             <div>
               <h1 className="text-2xl font-bold text-slate-900 tracking-tight">集成中心</h1>
               <p className="text-sm text-slate-500 mt-1">连接您现有的业务系统，实现数据自动化流转</p>
             </div>
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input 
                 className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none w-64"
                 placeholder="搜索应用..."
               />
             </div>
          </div>
          
          <div className="flex space-x-6">
            <button 
              onClick={() => setActiveTab('ALL')}
              className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'ALL' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              应用市场
            </button>
            <button 
              onClick={() => setActiveTab('CONNECTED')}
              className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'CONNECTED' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              已连接 ({AVAILABLE_APPS.filter(a => a.status === 'connected').length})
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-8">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredApps.map(app => (
                <div 
                  key={app.id} 
                  onClick={() => setSelectedApp(app)}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-1">{app.icon}</div>
                    {app.status === 'connected' ? (
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                         <CheckCircle2 size={10} className="mr-1"/> 已连接
                       </span>
                    ) : (
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-400 border border-slate-100 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                         去配置
                       </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">{app.name}</h3>
                  <div className="text-xs text-slate-500 mb-3 font-medium bg-slate-50 inline-block px-1.5 py-0.5 rounded">{app.category}</div>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 h-8">
                    {app.description}
                  </p>
                </div>
              ))}
              
              {/* Add Custom App Card */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-colors cursor-pointer min-h-[180px]">
                 <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-3 group-hover:bg-blue-50">
                    <Plus size={20} />
                 </div>
                 <span className="text-sm font-medium">申请接入新应用</span>
              </div>
           </div>
        </div>
      </div>

      {/* Configuration Slider/Drawer */}
      {selectedApp && (
        <div className="w-[480px] bg-white border-l border-gray-200 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-300 absolute right-0 top-0 bottom-0">
           <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center">
                <div className="mr-3 scale-75 origin-left">{selectedApp.icon}</div>
                <div>
                   <h2 className="text-base font-bold text-slate-800">{selectedApp.name} 配置</h2>
                   <div className="flex items-center text-xs text-slate-500">
                     <span className={`w-2 h-2 rounded-full mr-1.5 ${selectedApp.status === 'connected' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                     {selectedApp.status === 'connected' ? '运行中' : '未连接'}
                   </div>
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600">
                <Settings size={18} />
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Auth Section */}
              <section>
                 <div className="flex items-center mb-4">
                    <div className="w-6 h-6 rounded-full bg-blue-50 text-primary flex items-center justify-center text-xs font-bold mr-2">1</div>
                    <h3 className="text-sm font-bold text-slate-800">账号授权</h3>
                 </div>
                 
                 {selectedApp.id === 'webhook' ? (
                   <div className="space-y-4">
                      <div className="bg-slate-50 p-3 rounded border border-slate-100 text-xs text-slate-600 break-all font-mono">
                         https://api.voicedesk.ai/hooks/v1/29384-23423
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                         <span>Secret Key: ************</span>
                         <button className="text-primary hover:underline">重置密钥</button>
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                      <Input label="Subdomain" placeholder="your-company" suffix=".zendesk.com" />
                      <Input label="API Token / OAuth" type="password" value="****************" />
                      <button className="w-full py-2 bg-slate-800 text-white rounded text-sm font-medium hover:bg-slate-700">
                         {selectedApp.status === 'connected' ? '重新授权' : '连接账号'}
                      </button>
                   </div>
                 )}
              </section>

              {/* Data Sync Section */}
              <section>
                 <div className="flex items-center mb-4">
                    <div className="w-6 h-6 rounded-full bg-blue-50 text-primary flex items-center justify-center text-xs font-bold mr-2">2</div>
                    <h3 className="text-sm font-bold text-slate-800">数据映射 (Mapping)</h3>
                 </div>
                 <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-slate-50 border-b border-gray-100 flex justify-between text-xs font-medium text-slate-500">
                       <span>机器人变量</span>
                       <span>{selectedApp.name} 字段</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                       {[
                         { bot: 'user_phone', crm: 'contact.phone_number' },
                         { bot: 'call_summary', crm: 'ticket.comment.body' },
                         { bot: 'intent_tag', crm: 'ticket.tags' }
                       ].map((map, i) => (
                         <div key={i} className="px-4 py-3 flex items-center justify-between text-sm">
                            <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-xs">{map.bot}</span>
                            <div className="flex items-center text-slate-300 px-2"><ExternalLink size={12}/></div>
                            <span className="font-mono text-primary">{map.crm}</span>
                         </div>
                       ))}
                    </div>
                    <div className="p-2 bg-slate-50 border-t border-gray-100 text-center">
                       <button className="text-xs text-primary font-medium hover:underline">+ 添加字段映射</button>
                    </div>
                 </div>
              </section>

              {/* Trigger Events */}
              <section>
                 <div className="flex items-center mb-4">
                    <div className="w-6 h-6 rounded-full bg-blue-50 text-primary flex items-center justify-center text-xs font-bold mr-2">3</div>
                    <h3 className="text-sm font-bold text-slate-800">事件订阅</h3>
                 </div>
                 <div className="space-y-3">
                    <Switch label="当通话结束时，自动创建工单" checked={true} onChange={()=>{}} />
                    <Switch label="当识别到投诉意图时，标记工单为高优先级" checked={true} onChange={()=>{}} />
                    <Switch label="同步通话录音文件链接" checked={false} onChange={()=>{}} />
                 </div>
              </section>
           </div>
           
           <div className="p-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50">
              <button onClick={() => setSelectedApp(null)} className="px-4 py-2 border border-gray-300 rounded text-slate-600 text-sm font-medium hover:bg-white">
                关闭
              </button>
              <button onClick={() => setSelectedApp(null)} className="px-4 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 shadow-sm">
                保存配置
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
