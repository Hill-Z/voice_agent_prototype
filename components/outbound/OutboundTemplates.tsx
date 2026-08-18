
import React, { useState } from 'react';
import { Search, Plus, Edit3, Trash2, X, Copy } from 'lucide-react';
import { OutboundTemplate, BotConfiguration } from '../../types';
import { Switch, Input, Label, Select } from '../ui/FormComponents';

interface OutboundTemplatesProps {
  bots: BotConfiguration[];
}

const MOCK_TEMPLATES: OutboundTemplate[] = [
  {
    id: '967',
    name: '【官网勿动】-金融贷款受理-崔艳',
    remark: '',
    ivrMode: false,
    outboundMode: 'ai_bot',
    taskConcurrency: 5,
    botConcurrency: 5,
    callerIdType: 'number',
    callerIdValue: '02131445977',
    executionTimeId: '1888',
    blacklistId: 'default',
    maxRingDuration: 60,
    retryStrategy: 'retry_priority'
  },
  {
    id: '968',
    name: '【官网勿动】-金融拓客营销-孙琳',
    remark: '',
    ivrMode: false,
    outboundMode: 'ai_bot',
    taskConcurrency: 10,
    botConcurrency: 10,
    callerIdType: 'pool',
    callerIdValue: 'pool_shanghai',
    executionTimeId: '1888',
    blacklistId: 'default',
    maxRingDuration: 45,
    retryStrategy: 'first_priority'
  }
];

export default function OutboundTemplates({ bots }: OutboundTemplatesProps) {
  const [templates, setTemplates] = useState<OutboundTemplate[]>(MOCK_TEMPLATES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OutboundTemplate | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<OutboundTemplate>>({
    name: '',
    remark: '',
    ivrMode: false,
    outboundMode: 'ai_bot',
    callerIdType: 'number',
    callerIdValue: '',
    executionTimeId: '',
    blacklistId: 'default',
    taskConcurrency: 5,
    botConcurrency: 5,
    maxRingDuration: 60,
    retryStrategy: 'retry_priority'
  });

  const handleOpenModal = (template?: OutboundTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({ ...template });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        remark: '',
        ivrMode: false,
        outboundMode: 'ai_bot',
        callerIdType: 'number',
        callerIdValue: '02131445977', // Default mock
        executionTimeId: '1888', // Default mock
        blacklistId: 'default',
        taskConcurrency: 5,
        botConcurrency: 5,
        maxRingDuration: 60,
        retryStrategy: 'retry_priority'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return alert("请输入模版名称");

    const newItem: OutboundTemplate = {
      ...formData as OutboundTemplate,
      id: editingTemplate ? editingTemplate.id : Date.now().toString(),
    };

    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? newItem : t));
    } else {
      setTemplates(prev => [newItem, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确认删除该模版吗？')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleCopy = (template: OutboundTemplate) => {
    const newTemplate = { ...template, id: Date.now().toString(), name: `${template.name} (副本)` };
    setTemplates(prev => [newTemplate, ...prev]);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Filters */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
           <label className="text-sm text-slate-600">模版名称:</label>
           <input 
             className="px-3 py-1.5 text-sm border border-slate-200 rounded focus:border-primary outline-none w-64 bg-white"
             placeholder="请输入模版名称"
           />
           <button className="px-4 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-600 hover:text-primary">确定</button>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-6 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 transition-all flex items-center shadow-sm"
        >
          <Plus size={16} className="mr-1.5" /> 新建外呼模版
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex-1 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-20">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">名称</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">备注</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">外呼模式</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {templates.map(template => (
              <tr key={template.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-500">{template.id}</td>
                <td className="px-6 py-4">
                   <div className="font-bold text-slate-800 text-sm">{template.name}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{template.remark || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                   {template.outboundMode === 'ai_bot' ? '智呼机器人' : '预测式外呼'}
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex justify-end space-x-3 text-sm">
                      <button onClick={() => handleOpenModal(template)} className="text-primary hover:text-sky-700">编辑</button>
                      <button onClick={() => handleCopy(template)} className="text-primary hover:text-sky-700">复制</button>
                      <button onClick={() => handleDelete(template.id)} className="text-slate-400 hover:text-red-500">删除</button>
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
                     {editingTemplate ? '编辑外呼模版' : '新建外呼模版'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                     <X size={20} />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {/* General Settings */}
                  <section>
                     <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">通用设置</h4>
                     <div className="grid grid-cols-1 gap-4">
                        <Input 
                           label="模版名称" 
                           required 
                           placeholder="请输入模版名称"
                           value={formData.name}
                           onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                        <Label label="备注" />
                        <textarea 
                           className="w-full px-3 py-2 border border-slate-300 rounded focus:border-primary outline-none text-sm h-20 resize-none"
                           placeholder="请输入备注"
                           value={formData.remark}
                           onChange={(e) => setFormData({...formData, remark: e.target.value})}
                        />
                     </div>
                  </section>

                  {/* Dialing Settings */}
                  <section>
                     <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">拨号设置</h4>
                     <div className="space-y-5">
                        <div className="flex items-center space-x-4">
                           <Label label="IVR模式" />
                           <Switch 
                              label="" 
                              checked={formData.ivrMode || false} 
                              onChange={(v) => setFormData({...formData, ivrMode: v})} 
                           />
                        </div>

                        <Select 
                           label="外呼模式"
                           required
                           options={[{label: '智呼机器人', value: 'ai_bot'}, {label: '预测式外呼', value: 'predictive'}]}
                           value={formData.outboundMode}
                           onChange={(e) => setFormData({...formData, outboundMode: e.target.value as any})}
                        />

                        <Select 
                           label="机器人话术"
                           required
                           options={[
                              {label: '请选择机器人话术', value: ''},
                              ...bots.map(b => ({ label: b.name, value: b.id }))
                           ]}
                           value={formData.botConfigId}
                           onChange={(e) => setFormData({...formData, botConfigId: e.target.value})}
                        />

                        <div className="space-y-2">
                           <Label label="主叫号码" required />
                           <div className="flex items-center space-x-6 mb-2">
                              <label className="flex items-center cursor-pointer">
                                 <input type="radio" className="mr-2" checked={formData.callerIdType === 'number'} onChange={() => setFormData({...formData, callerIdType: 'number'})} />
                                 <span className="text-sm text-slate-700">号码</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                 <input type="radio" className="mr-2" checked={formData.callerIdType === 'pool'} onChange={() => setFormData({...formData, callerIdType: 'pool'})} />
                                 <span className="text-sm text-slate-700">号码池</span>
                              </label>
                           </div>
                           <Select 
                              options={formData.callerIdType === 'number' ? [{label: '02131445977', value: '02131445977'}] : [{label: '上海营销号码池', value: 'pool_shanghai'}]}
                              value={formData.callerIdValue}
                              onChange={(e) => setFormData({...formData, callerIdValue: e.target.value})}
                           />
                        </div>

                        <Select 
                           label="任务执行时间"
                           required
                           tooltip="关联工作时间配置"
                           options={[{label: '官网呼入体验工作时间设置', value: '1888'}]}
                           value={formData.executionTimeId}
                           onChange={(e) => setFormData({...formData, executionTimeId: e.target.value})}
                        />

                        <Select 
                           label="限制呼叫名单"
                           required
                           options={[{label: '默认黑名单', value: 'default'}]}
                           value={formData.blacklistId}
                           onChange={(e) => setFormData({...formData, blacklistId: e.target.value})}
                        />
                        
                        <div className="grid grid-cols-2 gap-6">
                           <Input 
                              label="任务并发数" 
                              type="number"
                              value={formData.taskConcurrency}
                              onChange={(e) => setFormData({...formData, taskConcurrency: parseInt(e.target.value)})}
                           />
                           <Input 
                              label="机器人并发数" 
                              type="number"
                              suffix="分时并发"
                              value={formData.botConcurrency}
                              onChange={(e) => setFormData({...formData, botConcurrency: parseInt(e.target.value)})}
                           />
                        </div>
                     </div>
                  </section>

                  {/* Call Options */}
                  <section>
                     <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">呼叫选项</h4>
                     <div className="space-y-5">
                        <Input 
                           label="最大振铃时长 (秒)"
                           placeholder="振铃时长大于设定时长自动挂机, 最大可设置60s"
                           value={formData.maxRingDuration}
                           onChange={(e) => setFormData({...formData, maxRingDuration: parseInt(e.target.value)})}
                        />
                        <Input 
                           label="呼叫有效性 (秒)"
                           placeholder="通话时长大于设定时长视为呼叫有效"
                           value={formData.callValidDuration}
                           onChange={(e) => setFormData({...formData, callValidDuration: parseInt(e.target.value)})}
                        />
                        <div className="space-y-2">
                           <Label label="重试选项" tooltip="当并发资源不足时，优先处理新呼叫还是重试呼叫" />
                           <div className="flex items-center space-x-6">
                              <label className="flex items-center cursor-pointer">
                                 <input type="radio" className="mr-2" checked={formData.retryStrategy === 'first_priority'} onChange={() => setFormData({...formData, retryStrategy: 'first_priority'})} />
                                 <span className="text-sm text-slate-700">首呼优先</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                 <input type="radio" className="mr-2" checked={formData.retryStrategy === 'retry_priority'} onChange={() => setFormData({...formData, retryStrategy: 'retry_priority'})} />
                                 <span className="text-sm text-slate-700">重呼优先</span>
                              </label>
                           </div>
                        </div>
                     </div>
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
