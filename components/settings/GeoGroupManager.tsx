
import React, { useState } from 'react';
import { MapPin, Plus, Search, Edit3, Trash2, X } from 'lucide-react';
import { GeoGroup } from '../../types';
import { Label, TagInput } from '../ui/FormComponents';

const MOCK_GEO_GROUPS: GeoGroup[] = [
  { id: '1', name: '华东VIP区域', regions: ['上海', '杭州', '南京', '苏州'], updatedAt: 1772333185000, note: '高净值客户区域' },
  { id: '2', name: '广东大区', regions: ['广州', '深圳', '佛山', '东莞'], updatedAt: 1772333185000, note: '' },
];

export default function GeoGroupManager() {
  const [groups, setGroups] = useState<GeoGroup[]>(MOCK_GEO_GROUPS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GeoGroup | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<GeoGroup>>({
    name: '',
    regions: [],
    note: ''
  });

  const handleOpenModal = (group?: GeoGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormData({ ...group });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        regions: [],
        note: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return alert("请输入组合名称");

    const newGroup: GeoGroup = {
      id: editingGroup ? editingGroup.id : Date.now().toString(),
      name: formData.name || '',
      regions: formData.regions || [],
      note: formData.note || '',
      updatedAt: Date.now()
    };

    if (editingGroup) {
      setGroups(prev => prev.map(g => g.id === editingGroup.id ? newGroup : g));
    } else {
      setGroups(prev => [newGroup, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确认删除该地理组合吗？')) {
      setGroups(prev => prev.filter(g => g.id !== id));
    }
  };

  return (
    <div className="p-8 max-w-full mx-auto w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <MapPin size={24} className="mr-3 text-emerald-600" />
            地理组合
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            定义地理区域集合，用于路由规则中按归属地分流。
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-sky-600 transition-all flex items-center shadow-lg shadow-sky-100"
        >
          <Plus size={18} className="mr-2" /> 新建地理组合
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
         {/* Toolbar */}
         <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
               <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary outline-none w-64 bg-white"
                    placeholder="请输入地理组合名称"
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
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">名称</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">包含区域</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">更新时间</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">备注</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {groups.map(group => (
                     <tr key={group.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="font-bold text-slate-800 text-sm">{group.name}</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-wrap gap-1 max-w-md">
                              {group.regions.map((region, i) => (
                                <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] border border-emerald-100">
                                   {region}
                                </span>
                              ))}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                           {new Date(group.updatedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                           {group.note || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end space-x-3">
                              <button onClick={() => handleOpenModal(group)} className="text-primary hover:text-sky-700 text-xs font-bold">编辑</button>
                              <button onClick={() => handleDelete(group.id)} className="text-slate-400 hover:text-red-500 text-xs transition-colors">删除</button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         
         <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end items-center space-x-2 text-xs text-slate-500">
            <span>共 {groups.length} 条</span>
            <div className="flex border border-gray-200 rounded bg-white">
               <button className="px-2 py-1 border-r border-gray-200 hover:bg-slate-50">{'<'}</button>
               <button className="px-2 py-1 bg-primary text-white">1</button>
               <button className="px-2 py-1 hover:bg-slate-50">{'>'}</button>
            </div>
            <select className="border border-gray-200 rounded py-1 px-2 outline-none bg-white">
               <option>20 条/页</option>
            </select>
         </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-[500px] overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-base font-bold text-slate-800">
                     {editingGroup ? '编辑地理组合' : '新建地理组合'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                     <X size={20} />
                  </button>
               </div>
               
               <div className="p-6 space-y-5">
                  <div>
                     <Label label="地理组合名称" required />
                     <input 
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:border-primary outline-none text-sm"
                        placeholder="例如：华北区域"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                     />
                  </div>

                  <div>
                     <Label label="区域列表" tooltip="输入城市或省份名称后回车" />
                     <TagInput 
                        label=""
                        placeholder="输入省/市名称后回车"
                        tags={formData.regions || []}
                        onChange={(tags) => setFormData({...formData, regions: tags})}
                     />
                  </div>

                  <div>
                     <Label label="备注" />
                     <textarea 
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:border-primary outline-none text-sm h-20 resize-none"
                        value={formData.note}
                        onChange={(e) => setFormData({...formData, note: e.target.value})}
                     />
                  </div>
               </div>

               <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded text-slate-600 text-sm hover:bg-white">
                     取消
                  </button>
                  <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 shadow-sm">
                     确定
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
