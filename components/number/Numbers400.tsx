
import React from 'react';
import { Search, Inbox } from 'lucide-react';

export default function Numbers400() {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex gap-4 mb-6">
        <input 
          className="px-4 py-2 text-sm border border-gray-200 rounded w-64 focus:border-primary outline-none"
          placeholder="400号码"
        />
        <input 
          className="px-4 py-2 text-sm border border-gray-200 rounded w-64 focus:border-primary outline-none"
          placeholder="运营商"
        />
        <button className="px-6 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 transition-colors flex items-center shadow-sm">
           <Search size={14} className="mr-1" /> 搜索
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex-1 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">400号码</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">类型</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">运营商</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">已绑定中继</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
             {/* Mock Empty State */}
             <tr>
                <td colSpan={4} className="py-20 text-center text-slate-400">
                   <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                         <Inbox size={32} className="opacity-20" />
                      </div>
                      <p className="text-sm">暂无数据</p>
                   </div>
                </td>
             </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
