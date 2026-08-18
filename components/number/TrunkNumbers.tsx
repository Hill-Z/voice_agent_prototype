
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { TrunkNumberItem } from '../../types';

const MOCK_TRUNKS: TrunkNumberItem[] = [
  { id: '9362', number: '08552200926', type: '测试号码', location: '贵州黔东南苗族侗族自治州', status: 'active' },
  { id: '9679', number: '02131445977', type: 'udesk号码', location: '上海上海', status: 'active' },
  { id: '9740', number: '03192557939', poolName: '(天鹅到家专用)', type: '测试号码', location: '河北邢台', status: 'active' },
  { id: '9747', number: '02160592249', type: 'udesk号码', location: '上海上海', status: 'active' },
];

export default function TrunkNumbers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [poolSearch, setPoolSearch] = useState('');

  const filteredData = MOCK_TRUNKS.filter(item => 
    item.number.includes(searchTerm) || 
    (item.poolName && item.poolName.includes(poolSearch))
  );

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex gap-4 mb-6">
        <input 
          className="px-4 py-2 text-sm border border-gray-200 rounded w-64 focus:border-primary outline-none"
          placeholder="中继号/名称/归属地"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <input 
          className="px-4 py-2 text-sm border border-gray-200 rounded w-64 focus:border-primary outline-none"
          placeholder="所属号码池"
          value={poolSearch}
          onChange={(e) => setPoolSearch(e.target.value)}
        />
        <button className="px-6 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 transition-colors flex items-center">
           <Search size={14} className="mr-1" /> 搜索
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex-1 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">中继号</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">所属号码池</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">名称</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">类型</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">归属地</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">状态</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">备注</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredData.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-500">{item.id}</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-800">{item.number}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{item.poolName || ''}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{item.name || ''}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{item.type}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{item.location}</td>
                <td className="px-6 py-4 text-sm">
                   <span className="text-slate-600">{item.status === 'active' ? '使用中' : '已停用'}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{item.note || ''}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-primary text-xs font-bold hover:underline">编辑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-4 border-t border-gray-100 flex justify-end items-center space-x-2 text-xs text-slate-500">
           <span>共 {filteredData.length} 条</span>
           <div className="flex border border-gray-200 rounded">
              <button className="px-2 py-1 border-r border-gray-200 hover:bg-slate-50">{'<'}</button>
              <button className="px-2 py-1 bg-primary text-white">1</button>
              <button className="px-2 py-1 hover:bg-slate-50">{'>'}</button>
           </div>
           <select className="border border-gray-200 rounded py-1 px-2 outline-none">
              <option>20 条/页</option>
           </select>
        </div>
      </div>
    </div>
  );
}
