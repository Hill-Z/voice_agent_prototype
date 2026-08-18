
import React, { useState } from 'react';
import { Clock, Plus, Search, X, PlusCircle, Trash2 } from 'lucide-react';
import { BusinessHour, BusinessHourShift } from '../../types';
import { Label, Select } from '../ui/FormComponents';

const MOCK_BUSINESS_HOURS: BusinessHour[] = [
  { 
    id: '1888', 
    name: '官网呼入体验工作时间设置', 
    timezone: '(UTC+08:00) 北京, 重庆, 香港特别行政区, 乌鲁木齐', 
    shifts: [
      { day: 1, start: '09:00', end: '18:00', enabled: true },
      { day: 2, start: '09:00', end: '18:00', enabled: true },
      { day: 3, start: '09:00', end: '18:00', enabled: true },
      { day: 4, start: '09:00', end: '18:00', enabled: true },
      { day: 5, start: '09:00', end: '18:00', enabled: true },
    ],
    note: '' 
  },
];

const WEEKDAYS = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

export default function BusinessHoursManager() {
  const [schedules, setSchedules] = useState<BusinessHour[]>(MOCK_BUSINESS_HOURS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<BusinessHour | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<BusinessHour>>({
    name: '',
    timezone: '(UTC+08:00) 北京, 重庆, 香港特别行政区, 乌鲁木齐',
    shifts: WEEKDAYS.map((_, i) => ({ day: i + 1, start: '00:00', end: '23:59', enabled: true })),
    note: ''
  });

  const handleOpenModal = (schedule?: BusinessHour) => {
    if (schedule) {
      setEditingSchedule(schedule);
      // Ensure we have all 7 days in form data for editing, even if stored sparsely (though our mock stores all)
      const fullShifts = WEEKDAYS.map((_, i) => {
        const existing = schedule.shifts.find(s => s.day === i + 1);
        return existing || { day: i + 1, start: '00:00', end: '23:59', enabled: false };
      });
      setFormData({ ...schedule, shifts: fullShifts });
    } else {
      setEditingSchedule(null);
      setFormData({
        name: '',
        timezone: '(UTC+08:00) 北京, 重庆, 香港特别行政区, 乌鲁木齐',
        shifts: WEEKDAYS.map((_, i) => ({ day: i + 1, start: '00:00', end: '23:59', enabled: true })),
        note: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return alert("请输入名称");

    const newItem: BusinessHour = {
      id: editingSchedule ? editingSchedule.id : Date.now().toString(),
      name: formData.name || '',
      timezone: formData.timezone || '',
      shifts: formData.shifts || [],
      note: formData.note || ''
    };

    if (editingSchedule) {
      setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? newItem : s));
    } else {
      setSchedules(prev => [newItem, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确认删除该工作时间设置吗？')) {
      setSchedules(prev => prev.filter(s => s.id !== id));
    }
  };

  const updateShift = (dayIndex: number, field: keyof BusinessHourShift, value: any) => {
    const newShifts = [...(formData.shifts || [])];
    newShifts[dayIndex] = { ...newShifts[dayIndex], [field]: value };
    setFormData({ ...formData, shifts: newShifts });
  };

  return (
    <div className="p-8 max-w-full mx-auto w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Clock size={24} className="mr-3 text-blue-600" />
            工作时间
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            定义工作日与时间段，用于路由规则中按时间分流（如区分工作时间与下班时间）。
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-sky-600 transition-all flex items-center shadow-lg shadow-sky-100"
        >
          <Plus size={18} className="mr-2" /> 新建工作时间
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
         {/* Toolbar */}
         <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
               <label className="text-sm font-medium text-slate-600">工作时间名称:</label>
               <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary outline-none w-64 bg-white"
                    placeholder="请输入工作时间名称"
                  />
               </div>
               <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:text-primary">确定</button>
            </div>
         </div>

         {/* Table */}
         <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-20">ID</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">名称</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">备注</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {schedules.map(schedule => (
                     <tr key={schedule.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-500">{schedule.id}</td>
                        <td className="px-6 py-4">
                           <div className="font-bold text-slate-800 text-sm">{schedule.name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                           {schedule.note || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end space-x-3">
                              <button onClick={() => handleOpenModal(schedule)} className="text-primary hover:text-sky-700 text-xs font-bold">编辑</button>
                              <button onClick={() => handleDelete(schedule.id)} className="text-slate-400 hover:text-red-500 text-xs transition-colors">删除</button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         
         <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end items-center space-x-2 text-xs text-slate-500">
            <div className="flex border border-gray-200 rounded bg-white">
               <button className="px-2 py-1 border-r border-gray-200 hover:bg-slate-50">{'<'}</button>
               <button className="px-2 py-1 bg-primary text-white">1</button>
               <button className="px-2 py-1 hover:bg-slate-50">{'>'}</button>
            </div>
         </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-base font-bold text-slate-800">
                     {editingSchedule ? '编辑工作时间' : '新建工作时间'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                     <X size={20} />
                  </button>
               </div>
               
               <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                  {/* Basic Info */}
                  <div className="space-y-4">
                     <h4 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">基本信息</h4>
                     <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-2 text-right text-sm text-slate-600"><span className="text-red-500">*</span>名称:</label>
                        <div className="col-span-10">
                           <input 
                              className="w-full px-3 py-2 border border-slate-300 rounded focus:border-primary outline-none text-sm"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                           />
                        </div>
                     </div>
                     <div className="grid grid-cols-12 gap-4 items-start">
                        <label className="col-span-2 text-right text-sm text-slate-600 mt-2">备注:</label>
                        <div className="col-span-10">
                           <textarea 
                              className="w-full px-3 py-2 border border-slate-300 rounded focus:border-primary outline-none text-sm h-20 resize-none"
                              value={formData.note}
                              onChange={(e) => setFormData({...formData, note: e.target.value})}
                              placeholder="请输入备注"
                           />
                        </div>
                     </div>
                  </div>

                  {/* Timezone */}
                  <div className="space-y-4">
                     <h4 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">时区设置</h4>
                     <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-2 text-right text-sm text-slate-600">时区:</label>
                        <div className="col-span-10">
                           <Select 
                              className="w-full"
                              options={[{label: '(UTC+08:00) 北京, 重庆, 香港特别行政区, 乌鲁木齐', value: '(UTC+08:00) 北京, 重庆, 香港特别行政区, 乌鲁木齐'}]}
                              value={formData.timezone}
                              onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                           />
                        </div>
                     </div>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-4">
                     <h4 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">工作时间设置</h4>
                     {formData.shifts?.map((shift, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-4 items-center">
                           <label className="col-span-2 text-right text-sm text-slate-600">{WEEKDAYS[idx]}:</label>
                           <div className="col-span-10 flex items-center space-x-3">
                              <input 
                                 type="time" 
                                 className="px-3 py-2 border border-slate-300 rounded text-sm w-32 focus:border-primary outline-none"
                                 value={shift.start}
                                 onChange={(e) => updateShift(idx, 'start', e.target.value)}
                              />
                              <span className="text-slate-400">~</span>
                              <input 
                                 type="time" 
                                 className="px-3 py-2 border border-slate-300 rounded text-sm w-32 focus:border-primary outline-none"
                                 value={shift.end}
                                 onChange={(e) => updateShift(idx, 'end', e.target.value)}
                              />
                              <button className="text-slate-400 hover:text-primary">
                                 <PlusCircle size={18} />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
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
