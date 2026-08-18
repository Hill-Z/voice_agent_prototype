
import React, { useState } from 'react';
import { Search, Upload, FileSpreadsheet, Download, Trash2 } from 'lucide-react';
import { ContactList } from '../../types';

const MOCK_LISTS: ContactList[] = [
  { id: '1', name: '上海地区高意向客户_20240520', totalCount: 1200, validCount: 1180, status: 'ready', createdAt: 1716182400000 },
  { id: '2', name: '北京车展留资名单', totalCount: 500, validCount: 485, status: 'ready', createdAt: 1716096000000 },
  { id: '3', name: '官网咨询未接通回访', totalCount: 120, validCount: 120, status: 'ready', createdAt: 1716009600000 },
];

export default function ContactLists() {
  const [lists, setLists] = useState<ContactList[]>(MOCK_LISTS);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = (id: string) => {
    if(confirm('确定删除该联系单吗？')) {
      setLists(prev => prev.filter(l => l.id !== id));
    }
  };

  const filteredLists = lists.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
           <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary outline-none w-64 bg-white"
                placeholder="搜索联系单名称"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        <div className="flex space-x-3">
           <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center">
              <Download size={16} className="mr-2" /> 下载模版
           </button>
           <button 
             className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-sky-600 transition-all flex items-center shadow-sm"
           >
             <Upload size={16} className="mr-2" /> 上传联系单
           </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex-1 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">联系单名称</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">总数量</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">有效数量</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">状态</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">上传时间</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLists.map(list => (
              <tr key={list.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-500">{list.id}</td>
                <td className="px-6 py-4">
                   <div className="flex items-center">
                      <FileSpreadsheet size={16} className="text-green-600 mr-2" />
                      <span className="font-medium text-slate-800 text-sm">{list.name}</span>
                   </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{list.totalCount}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{list.validCount}</td>
                <td className="px-6 py-4">
                   <span className="px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                      上传成功
                   </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                   {new Date(list.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                   <button onClick={() => handleDelete(list.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
