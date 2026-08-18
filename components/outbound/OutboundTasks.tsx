
import React, { useState } from 'react';
import { Search, Plus, Edit3, Trash2, X, Play, Pause, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { OutboundTask, OutboundTemplate, ContactList } from '../../types';
import { Input, Label, Select, Switch } from '../ui/FormComponents';
import OutboundTaskDetail from './OutboundTaskDetail';

// Mock Data for demonstration
const MOCK_TASKS: OutboundTask[] = [
  {
    id: '84011',
    name: '语音机器人英文Demo视频-外呼任务',
    status: 'running',
    templateId: '967',
    totalContacts: 1,
    executedCount: 0,
    connectedCount: 0,
    unansweredCount: 0,
    seatAnsweredCount: 0,
    retryCount: 0,
    startType: 'manual',
    priority: 1,
    stopOnEmpty: false,
    contactListIds: ['1'],
    creator: 'Admin',
    createTime: '2026-01-29 10:55:27',
    currentConcurrency: 5,
    startTime: '2026-01-29 11:00:00'
  },
  {
    id: '83957',
    name: '泰康01-外呼任务',
    status: 'paused',
    templateId: '968',
    totalContacts: 2,
    executedCount: 2,
    connectedCount: 2,
    unansweredCount: 0,
    seatAnsweredCount: 0,
    retryCount: 2,
    startType: 'scheduled',
    priority: 1,
    stopOnEmpty: true,
    contactListIds: ['2'],
    creator: '张三',
    createTime: '2026-01-28 09:30:00',
    currentConcurrency: 0,
    startTime: '2026-01-28 10:00:00'
  }
];

const MOCK_TEMPLATES: OutboundTemplate[] = [
  { id: '967', name: '【官网勿动】-金融贷款受理-崔艳', remark: '', ivrMode: false, outboundMode: 'ai_bot', taskConcurrency: 5, botConcurrency: 5, callerIdType: 'number', callerIdValue: '02160592249', executionTimeId: '1888', blacklistId: 'default', maxRingDuration: 60, retryStrategy: 'retry_priority' },
  { id: '968', name: '【官网勿动】-金融拓客营销-孙琳', remark: '', ivrMode: false, outboundMode: 'ai_bot', taskConcurrency: 10, botConcurrency: 10, callerIdType: 'pool', callerIdValue: 'pool_shanghai', executionTimeId: '1888', blacklistId: 'default', maxRingDuration: 45, retryStrategy: 'first_priority' }
];

const MOCK_CONTACT_LISTS: ContactList[] = [
  { id: '1', name: '高崇联系单', totalCount: 1, validCount: 1, status: 'running', createdAt: 1716182400000, priority: 1, executedCount: 0, connectedCount: 0, seatAnsweredCount: 0, retryCount: 0, successRate: '0%' },
  { id: '2', name: '北京车展留资名单', totalCount: 500, validCount: 485, status: 'ready', createdAt: 1716096000000, priority: 1 },
];

export default function OutboundTasks() {
  const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');
  const [tasks, setTasks] = useState<OutboundTask[]>(MOCK_TASKS);
  const [selectedTask, setSelectedTask] = useState<OutboundTask | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<OutboundTask | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<OutboundTask>>({
    name: '',
    templateId: '',
    startType: 'manual',
    priority: 1,
    stopOnEmpty: false,
    contactListIds: []
  });

  const handleOpenModal = (task?: OutboundTask) => {
    if (task) {
      setEditingTask(task);
      setFormData({ ...task });
    } else {
      setEditingTask(null);
      setFormData({
        name: '',
        templateId: '',
        startType: 'manual',
        priority: 1,
        stopOnEmpty: false,
        contactListIds: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return alert("请输入任务名称");
    if (!formData.templateId) return alert("请选择外呼模版");

    const newTask: OutboundTask = {
      ...formData as OutboundTask,
      id: editingTask ? editingTask.id : Date.now().toString(),
      status: editingTask ? editingTask.status : 'draft',
      totalContacts: 0, 
      executedCount: 0,
      connectedCount: 0,
      unansweredCount: 0,
      seatAnsweredCount: 0,
      retryCount: 0,
      creator: 'Admin',
      createTime: new Date().toLocaleString(),
      currentConcurrency: 0
    };

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? newTask : t));
      if (selectedTask?.id === editingTask.id) setSelectedTask(newTask); // Update detail view if editing current
    } else {
      setTasks(prev => [newTask, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确认删除该任务吗？')) {
      setTasks(prev => prev.filter(t => t.id !== id));
      if (selectedTask?.id === id) {
         setSelectedTask(null);
         setView('LIST');
      }
    }
  };

  const updateTaskStatus = (id: string, status: OutboundTask['status']) => {
     setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
     if (selectedTask?.id === id) {
        setSelectedTask(prev => prev ? { ...prev, status } : null);
     }
  };

  const addContactList = () => {
    // Simple mock to add the first list if not present
    if (formData.contactListIds && formData.contactListIds.length < MOCK_CONTACT_LISTS.length) {
       const nextId = MOCK_CONTACT_LISTS[formData.contactListIds.length].id;
       setFormData({ ...formData, contactListIds: [...(formData.contactListIds || []), nextId] });
    }
  };

  const removeContactList = (id: string) => {
    setFormData({ ...formData, contactListIds: formData.contactListIds?.filter(lid => lid !== id) });
  };

  const getContactListById = (id: string) => MOCK_CONTACT_LISTS.find(l => l.id === id);

  const handleViewTask = (task: OutboundTask) => {
     setSelectedTask(task);
     setView('DETAIL');
  };

  if (view === 'DETAIL' && selectedTask) {
     const template = MOCK_TEMPLATES.find(t => t.id === selectedTask.templateId);
     return (
        <OutboundTaskDetail 
           task={selectedTask}
           template={template}
           contactLists={MOCK_CONTACT_LISTS}
           onBack={() => { setView('LIST'); setSelectedTask(null); }}
           onUpdateStatus={(status) => updateTaskStatus(selectedTask.id, status)}
           onEdit={() => handleOpenModal(selectedTask)}
        />
     );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Alert Bar */}
      <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg mb-6 flex items-start justify-between text-sm">
         <div className="flex items-center">
            <AlertCircle size={16} className="mr-2 mt-0.5" />
            当前租户支持的外呼时间为：8:00~22:00。超出此时间，系统自动停止拨号。（如需24小时外呼，请联系运营开通）
         </div>
         <button className="text-amber-500 hover:text-amber-800"><X size={16}/></button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
         <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600">任务状态:</span>
            <select className="border border-slate-200 rounded px-2 py-1.5 text-sm outline-none bg-white">
               <option>全部状态</option>
               <option>运行中</option>
               <option>已暂停</option>
               <option>已完成</option>
            </select>
         </div>
         <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600">选择时间:</span>
            <div className="flex items-center border border-slate-200 rounded bg-white px-2 py-1.5">
               <input type="date" className="text-sm outline-none text-slate-600" />
               <span className="mx-2 text-slate-400">-</span>
               <input type="date" className="text-sm outline-none text-slate-600" />
            </div>
         </div>
         <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600">外呼任务名称:</span>
            <input className="border border-slate-200 rounded px-2 py-1.5 text-sm outline-none w-40" placeholder="请输入名称" />
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm hover:text-primary">确定</button>
         </div>
         <div className="flex-1 text-right">
            <button 
               onClick={() => handleOpenModal()}
               className="px-4 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 shadow-sm"
            >
               + 新建外呼任务
            </button>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex-1 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">ID</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">名称</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">状态</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">客户数</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">已执行</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">客户接听</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">未接听</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">尝试次数</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map(task => (
              <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4 text-sm text-slate-500">{task.id}</td>
                <td className="px-4 py-4 text-sm font-bold text-slate-800 max-w-[200px] truncate" title={task.name}>{task.name}</td>
                <td className="px-4 py-4">
                   <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${task.status === 'running' ? 'bg-blue-50 text-blue-600 border border-blue-100' : (task.status === 'stopped' ? 'bg-gray-100 text-gray-500 border border-gray-200' : 'bg-amber-50 text-amber-600 border border-amber-100')}`}>
                      {task.status === 'running' ? '运行中' : (task.status === 'stopped' ? '已停止' : '已暂停')}
                   </span>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">{task.totalContacts}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{task.executedCount}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{task.connectedCount}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{task.unansweredCount}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{task.retryCount}</td>
                <td className="px-4 py-4 text-right">
                   <div className="flex justify-end space-x-2 text-xs font-medium">
                      <button onClick={() => handleViewTask(task)} className="text-blue-600 hover:underline">查看</button>
                      <button onClick={() => handleOpenModal(task)} className="text-blue-600 hover:underline">编辑</button>
                      <button onClick={() => handleDelete(task.id)} className="text-slate-400 hover:text-red-500">删除</button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-base font-bold text-slate-800">
                     {editingTask ? '编辑外呼任务' : '新建外呼任务'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                     <X size={20} />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {/* Task Settings */}
                  <section>
                     <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">任务设置</h4>
                     <div className="space-y-5">
                        <Select 
                           label="外呼模版"
                           required
                           options={[
                              {label: '请选择外呼模版', value: ''},
                              ...MOCK_TEMPLATES.map(t => ({ label: t.name, value: t.id }))
                           ]}
                           value={formData.templateId}
                           onChange={(e) => setFormData({...formData, templateId: e.target.value})}
                        />
                        <Input 
                           label="任务名称"
                           required
                           value={formData.name}
                           onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                        <Label label="备注" />
                        <textarea 
                           className="w-full px-3 py-2 border border-slate-300 rounded focus:border-primary outline-none text-sm h-16 resize-none mb-4"
                           placeholder="请输入备注"
                           value={formData.remark}
                           onChange={(e) => setFormData({...formData, remark: e.target.value})}
                        />
                        
                        <div className="space-y-2">
                           <Label label="启动方式" required />
                           <div className="flex items-center space-x-6">
                              <label className="flex items-center cursor-pointer">
                                 <input type="radio" className="mr-2" checked={formData.startType === 'manual'} onChange={() => setFormData({...formData, startType: 'manual'})} />
                                 <span className="text-sm text-slate-700">手动启动</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                 <input type="radio" className="mr-2" checked={formData.startType === 'scheduled'} onChange={() => setFormData({...formData, startType: 'scheduled'})} />
                                 <span className="text-sm text-slate-700">定时启动</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                 <input type="radio" className="mr-2" checked={formData.startType === 'periodic'} onChange={() => setFormData({...formData, startType: 'periodic'})} />
                                 <span className="text-sm text-slate-700">周期启动</span>
                              </label>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <Input label="任务结束时间" type="date" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
                           <Input label="任务优先级" type="number" value={formData.priority} onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})} />
                        </div>

                        <div className="flex items-center space-x-2">
                           <input type="checkbox" className="rounded border-slate-300" checked={formData.stopOnEmpty} onChange={(e) => setFormData({...formData, stopOnEmpty: e.target.checked})} />
                           <span className="text-sm text-slate-600">无联系人自动停止</span>
                        </div>
                     </div>
                  </section>

                  {/* Contact List */}
                  <section>
                     <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">联系单</h4>
                     <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
                        <table className="w-full text-left">
                           <thead className="bg-slate-50 border-b border-slate-100">
                              <tr>
                                 <th className="px-4 py-2 text-xs font-bold text-slate-500">联系单</th>
                                 <th className="px-4 py-2 text-xs font-bold text-slate-500">优先级</th>
                                 <th className="px-4 py-2 text-xs font-bold text-slate-500 text-right">操作</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {formData.contactListIds?.map(lid => {
                                 const list = getContactListById(lid);
                                 if (!list) return null;
                                 return (
                                    <tr key={lid}>
                                       <td className="px-4 py-2 text-sm text-slate-700">{list.name}</td>
                                       <td className="px-4 py-2 text-sm text-slate-600">1</td>
                                       <td className="px-4 py-2 text-right">
                                          <button onClick={() => removeContactList(lid)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                       </td>
                                    </tr>
                                 );
                              })}
                              {(!formData.contactListIds || formData.contactListIds.length === 0) && (
                                 <tr>
                                    <td colSpan={3} className="px-4 py-6 text-center text-xs text-slate-400">暂无联系单</td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                     <button 
                        onClick={addContactList}
                        className="w-full py-2 border border-dashed border-slate-300 rounded text-slate-500 text-sm hover:border-primary hover:text-primary transition-all"
                     >
                        + 添加联系单
                     </button>
                  </section>
               </div>

               <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded text-slate-600 text-sm hover:bg-white">
                     取消
                  </button>
                  <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 shadow-sm">
                     保存
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
