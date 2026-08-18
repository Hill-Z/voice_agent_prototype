
import React, { useState } from 'react';
import { 
  ArrowLeft, Play, Pause, Square, AlertTriangle, Edit3, RefreshCw, 
  Search, Download, Plus, MoreHorizontal, Phone, Clock, User
} from 'lucide-react';
import { OutboundTask, OutboundTemplate, ContactList, CallRecord } from '../../types';

interface OutboundTaskDetailProps {
  task: OutboundTask;
  template?: OutboundTemplate;
  contactLists: ContactList[];
  onBack: () => void;
  onUpdateStatus: (status: OutboundTask['status']) => void;
  onEdit: () => void;
}

// Mock Call Records
const MOCK_CALL_RECORDS: CallRecord[] = [
  { id: 'c1', taskId: '84011', phoneNumber: '13800138000', customerName: '张先生', startTime: Date.now() - 3600000, duration: 45, status: 'answered', intentResult: 'A级(有意向)', botName: '金融贷款机器人', rounds: 3 },
  { id: 'c2', taskId: '84011', phoneNumber: '13912345678', customerName: '李女士', startTime: Date.now() - 3500000, duration: 0, status: 'no_answer', intentResult: '无应答', botName: '金融贷款机器人', rounds: 0 },
  { id: 'c3', taskId: '84011', phoneNumber: '15098765432', customerName: '王总', startTime: Date.now() - 3400000, duration: 120, status: 'answered', intentResult: 'B级(待跟进)', botName: '金融贷款机器人', rounds: 8 },
];

export default function OutboundTaskDetail({ task, template, contactLists, onBack, onUpdateStatus, onEdit }: OutboundTaskDetailProps) {
  const [activeTab, setActiveTab] = useState<'CONTACTS' | 'RECORDS'>('CONTACTS');
  const [records, setRecords] = useState<CallRecord[]>(MOCK_CALL_RECORDS);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running': return <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-xs">运行中</span>;
      case 'paused': return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-xs">已暂停</span>;
      case 'stopped': return <span className="px-2 py-0.5 bg-gray-100 text-gray-500 border border-gray-200 rounded text-xs">已停止</span>;
      case 'completed': return <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-100 rounded text-xs">已完成</span>;
      default: return <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded text-xs">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header / Breadcrumb */}
      <div className="h-12 flex items-center px-6 border-b border-gray-200 bg-white">
        <button onClick={onBack} className="text-xs text-slate-500 hover:text-primary flex items-center mr-2">
           <ArrowLeft size={12} className="mr-1" /> 返回外呼任务
        </button>
        <span className="text-slate-300 mx-2">|</span>
        <span className="text-sm font-bold text-slate-700">查看外呼任务</span>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {/* Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
           <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                 <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Phone size={20} />
                 </div>
                 <div>
                    <h1 className="text-lg font-bold text-slate-800 flex items-center">
                       名称：{task.name}
                    </h1>
                 </div>
              </div>
              <div className="flex items-center space-x-3">
                 {/* Control Buttons */}
                 <button 
                   onClick={() => onUpdateStatus('running')}
                   disabled={task.status === 'running'}
                   className={`p-2 rounded-full transition-colors ${task.status === 'running' ? 'bg-green-100 text-green-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600 shadow-sm'}`}
                   title="启动任务"
                 >
                    <Play size={18} className="fill-current" />
                 </button>
                 <button 
                   onClick={() => onUpdateStatus('paused')}
                   disabled={task.status === 'paused' || task.status === 'stopped'}
                   className={`p-2 rounded-full transition-colors ${task.status === 'paused' ? 'bg-blue-100 text-blue-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'}`}
                   title="暂停任务"
                 >
                    <Pause size={18} className="fill-current" />
                 </button>
                 <button 
                   onClick={() => onUpdateStatus('stopped')}
                   disabled={task.status === 'stopped'}
                   className={`p-2 rounded-full transition-colors ${task.status === 'stopped' ? 'bg-red-100 text-red-400 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600 shadow-sm'}`}
                   title="停止任务"
                 >
                    <Square size={18} className="fill-current" />
                 </button>
                 
                 <div className="h-6 w-px bg-gray-200 mx-2"></div>

                 <button className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-bold hover:bg-blue-600 transition-colors shadow-sm">
                    告警设置
                 </button>
                 <button onClick={onEdit} className="px-3 py-1.5 border border-gray-200 text-slate-600 rounded text-xs font-bold hover:bg-slate-50 transition-colors">
                    编辑
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-3 gap-y-4 text-xs text-slate-600">
              <div className="flex">
                 <span className="text-slate-400 w-24">外呼模版：</span>
                 <span className="font-medium">{template?.name || '-'}</span>
              </div>
              <div className="flex">
                 <span className="text-slate-400 w-24">机器人话术：</span>
                 <span className="font-medium text-blue-600">{template?.botConfigId ? '已配置 (ID:'+template.botConfigId+')' : '-'}</span>
              </div>
              <div className="flex">
                 <span className="text-slate-400 w-24">任务优先级：</span>
                 <span className="font-medium">{task.priority}</span>
              </div>

              <div className="flex">
                 <span className="text-slate-400 w-24">状态：</span>
                 {getStatusBadge(task.status)}
              </div>
              <div className="flex">
                 <span className="text-slate-400 w-24">外呼模式：</span>
                 <span className="font-medium">{template?.outboundMode === 'ai_bot' ? '智呼机器人' : '预测式外呼'}</span>
              </div>
              <div className="flex">
                 <span className="text-slate-400 w-24">主叫号码：</span>
                 <span className="font-medium font-mono">{template?.callerIdValue || '-'}</span>
              </div>

              <div className="flex">
                 <span className="text-slate-400 w-24">创建人：</span>
                 <span className="font-medium">{task.creator || 'Admin'}</span>
              </div>
              <div className="flex">
                 <span className="text-slate-400 w-24">呼叫并发：</span>
                 <span className="font-medium">{template?.taskConcurrency || 0}</span>
              </div>
              <div className="flex">
                 <span className="text-slate-400 w-24">目前并发量：</span>
                 <span className="font-medium">{task.currentConcurrency || 0}</span>
              </div>

              <div className="flex">
                 <span className="text-slate-400 w-24">任务开始时间：</span>
                 <span className="font-medium font-mono">{task.startTime || '-'}</span>
              </div>
              <div className="flex">
                 <span className="text-slate-400 w-24">创建时间：</span>
                 <span className="font-medium font-mono">{task.createTime || new Date().toLocaleString()}</span>
              </div>
              <div className="flex">
                 <span className="text-slate-400 w-24">任务执行时间：</span>
                 <span className="font-medium">官网呼入体验工作时间设置</span>
              </div>
           </div>
        </div>

        {/* Tabs & Toolbar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[400px]">
           <div className="flex justify-between items-center px-4 pt-2 border-b border-gray-200">
              <div className="flex space-x-6">
                 <button 
                   onClick={() => setActiveTab('CONTACTS')}
                   className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'CONTACTS' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                    联系单列表
                 </button>
                 <button 
                   onClick={() => setActiveTab('RECORDS')}
                   className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'RECORDS' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                    智呼通话记录
                 </button>
              </div>
              
              {activeTab === 'CONTACTS' && (
                 <button className="mb-2 px-3 py-1.5 border border-slate-200 text-slate-600 rounded text-xs font-medium hover:bg-slate-50 flex items-center">
                    <RefreshCw size={12} className="mr-1.5" /> 刷新
                 </button>
              )}
           </div>

           {/* Tab Content: CONTACTS */}
           {activeTab === 'CONTACTS' && (
              <div className="flex-1 flex flex-col">
                 <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center space-x-2">
                       <span className="text-sm text-slate-600">联系单名称：</span>
                       <input className="border border-slate-200 rounded px-2 py-1.5 text-sm outline-none w-48 bg-white" placeholder="请输入名称" />
                       <button className="px-4 py-1.5 bg-primary text-white rounded text-xs font-bold hover:bg-sky-600">确定</button>
                    </div>
                    <div className="flex items-center space-x-3">
                       <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded text-xs font-medium hover:bg-slate-50 flex items-center">
                          <Download size={12} className="mr-1.5" /> 导出
                       </button>
                       <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 flex items-center shadow-sm">
                          <Plus size={12} className="mr-1.5" /> 创建联系单
                       </button>
                    </div>
                 </div>
                 
                 <div className="flex-1 overflow-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">ID</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">名称</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">状态</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">优先级</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">客户数</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">已执行客户数</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">客户接听</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">座席接听</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">尝试次数</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">外呼成功率</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {/* We only show the lists associated with this task. For mock, just showing all passed lists if ids match */}
                          {contactLists.filter(list => task.contactListIds.includes(list.id)).map(list => (
                             <tr key={list.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3 text-sm text-slate-500">{list.id}</td>
                                <td className="px-6 py-3 text-sm font-bold text-slate-700">{list.name}</td>
                                <td className="px-6 py-3">
                                   <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">运行中</span>
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-600">{list.priority || 1}</td>
                                <td className="px-6 py-3 text-sm text-slate-600">{list.totalCount}</td>
                                <td className="px-6 py-3 text-sm text-slate-600">{list.executedCount || 0}</td>
                                <td className="px-6 py-3 text-sm text-slate-600">{list.connectedCount || 0}</td>
                                <td className="px-6 py-3 text-sm text-slate-600">{list.seatAnsweredCount || 0}</td>
                                <td className="px-6 py-3 text-sm text-slate-600">{list.retryCount || 0}</td>
                                <td className="px-6 py-3 text-sm text-slate-600">{list.successRate || '0%'}</td>
                                <td className="px-6 py-3 text-right">
                                   <div className="flex justify-end space-x-2 text-xs">
                                      <button className="text-blue-600 hover:underline">查看</button>
                                      <button className="text-blue-600 hover:underline">编辑</button>
                                      <button className="text-blue-600 hover:underline">暂停</button>
                                      <button className="text-blue-600 hover:underline">停止</button>
                                   </div>
                                </td>
                             </tr>
                          ))}
                          {task.contactListIds.length === 0 && (
                             <tr>
                                <td colSpan={11} className="py-10 text-center text-slate-400 text-xs">暂无联系单</td>
                             </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}

           {/* Tab Content: RECORDS */}
           {activeTab === 'RECORDS' && (
              <div className="flex-1 flex flex-col">
                 <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center space-x-4">
                       <input className="border border-slate-200 rounded px-2 py-1.5 text-sm outline-none w-40 bg-white" placeholder="主叫/被叫号码" />
                       <input className="border border-slate-200 rounded px-2 py-1.5 text-sm outline-none w-40 bg-white" placeholder="意向结果" />
                       <button className="px-4 py-1.5 bg-primary text-white rounded text-xs font-bold hover:bg-sky-600">查询</button>
                    </div>
                 </div>
                 
                 <div className="flex-1 overflow-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">通话ID</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">被叫号码</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">客户姓名</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">开始时间</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">通话时长</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">状态</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">意向结果</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">对话轮次</th>
                             <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {records.map(record => (
                             <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-3 text-sm text-slate-500 font-mono">{record.id}</td>
                                <td className="px-6 py-3 text-sm text-slate-700 font-medium">{record.phoneNumber}</td>
                                <td className="px-6 py-3 text-sm text-slate-600">{record.customerName || '-'}</td>
                                <td className="px-6 py-3 text-sm text-slate-600">{new Date(record.startTime).toLocaleString()}</td>
                                <td className="px-6 py-3 text-sm text-slate-600">{record.duration}s</td>
                                <td className="px-6 py-3 text-sm">
                                   <span className={`px-1.5 py-0.5 rounded text-xs ${record.status === 'answered' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                      {record.status === 'answered' ? '已接通' : '未接通'}
                                   </span>
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-600">
                                   {record.intentResult && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs border border-blue-100">{record.intentResult}</span>}
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-600">{record.rounds}</td>
                                <td className="px-6 py-3 text-right">
                                   <button className="text-primary hover:underline text-xs">查看详情</button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
