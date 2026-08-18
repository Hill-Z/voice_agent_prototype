
import React, { useState } from 'react';
import { Search, Plus, X, Inbox } from 'lucide-react';
import { NumberPoolItem } from '../../types';
import { Switch, Label } from '../ui/FormComponents';

export default function NumberPools() {
  const [pools, setPools] = useState<NumberPoolItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPool, setNewPool] = useState<Partial<NumberPoolItem>>({
    strategy: 'random',
    smartFilter: false
  });

  const handleCreate = () => {
    const pool: NumberPoolItem = {
      id: Date.now().toString(),
      name: newPool.name || '未命名号码池',
      strategy: newPool.strategy as any || 'random',
      numbersCount: 0,
      smartFilter: newPool.smartFilter || false,
      note: newPool.note || ''
    };
    setPools([...pools, pool]);
    setIsModalOpen(false);
    setNewPool({ strategy: 'random', smartFilter: false });
  };

  return (
    <div className="p-6 h-full flex flex-col relative">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <input 
            className="px-4 py-2 text-sm border border-gray-200 rounded w-64 focus:border-primary outline-none"
            placeholder="名称"
          />
          <input 
            className="px-4 py-2 text-sm border border-gray-200 rounded w-64 focus:border-primary outline-none"
            placeholder="分配策略"
          />
          <button className="px-6 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 transition-colors flex items-center shadow-sm">
             <Search size={14} className="mr-1" /> 搜索
          </button>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 transition-colors flex items-center shadow-lg shadow-sky-100"
        >
           <Plus size={16} className="mr-1.5" /> 新建号码池
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex-1 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">名称</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">分配策略</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">号码</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">剔除规则名称</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">添加规则名称</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">备注</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pools.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center text-slate-400">
                   <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                         <Inbox size={32} className="opacity-20" />
                      </div>
                      <p className="text-sm">暂无数据</p>
                   </div>
                </td>
              </tr>
            ) : (
              pools.map(pool => (
                <tr key={pool.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{pool.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{pool.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {pool.strategy === 'random' && '随机分配'}
                    {pool.strategy === 'round_robin' && '轮询分配'}
                    {pool.strategy === 'location' && '归属地优先'}
                    {pool.strategy === 'custom' && '自定义组合'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{pool.numbersCount} 个</td>
                  <td className="px-6 py-4 text-sm text-slate-400">-</td>
                  <td className="px-6 py-4 text-sm text-slate-400">-</td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{pool.note}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary text-xs font-bold hover:underline">编辑</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-lg shadow-xl w-[600px] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="text-sm font-bold text-slate-800">新建号码池</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                 </button>
              </div>
              
              <div className="p-8 space-y-6">
                 <div className="flex items-center">
                    <label className="w-20 text-sm text-slate-600 text-right mr-4">名称：</label>
                    <input 
                       className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:border-primary outline-none"
                       value={newPool.name || ''}
                       onChange={(e) => setNewPool({...newPool, name: e.target.value})}
                    />
                 </div>

                 <div className="flex items-start">
                    <label className="w-20 text-sm text-slate-600 text-right mr-4 mt-2">备注：</label>
                    <textarea 
                       className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:border-primary outline-none h-20 resize-none"
                       value={newPool.note || ''}
                       onChange={(e) => setNewPool({...newPool, note: e.target.value})}
                    />
                 </div>

                 <div className="flex items-start">
                    <label className="w-20 text-sm text-slate-600 text-right mr-4 mt-1">分配策略：</label>
                    <div className="flex flex-col space-y-3">
                       {[
                         {id: 'random', label: '随机分配'},
                         {id: 'round_robin', label: '轮询分配'},
                         {id: 'location', label: '归属地优先'},
                         {id: 'custom', label: '自定义组合'}
                       ].map(opt => (
                         <label key={opt.id} className="flex items-center cursor-pointer">
                            <input 
                              type="radio" 
                              name="strategy"
                              className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                              checked={newPool.strategy === opt.id}
                              onChange={() => setNewPool({...newPool, strategy: opt.id as any})}
                            />
                            <span className="ml-2 text-sm text-slate-700">{opt.label}</span>
                         </label>
                       ))}
                    </div>
                 </div>

                 <div className="flex items-center">
                    <label className="w-20 text-sm text-slate-600 text-right mr-4">中继号：</label>
                    <input 
                       className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:border-primary outline-none"
                       placeholder=""
                    />
                 </div>

                 <div className="flex items-center">
                    <label className="w-20 text-sm text-slate-600 text-right mr-4">权限：</label>
                    <input 
                       className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:border-primary outline-none"
                       placeholder=""
                    />
                 </div>

                 <div className="flex items-center">
                    <label className="w-20 text-sm text-slate-600 text-right mr-4">智能号码筛选：</label>
                    <Switch 
                       label=""
                       checked={newPool.smartFilter || false}
                       onChange={(v) => setNewPool({...newPool, smartFilter: v})}
                    />
                    <span className="text-slate-400 ml-1 cursor-help">?</span>
                 </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-center space-x-4 bg-slate-50/50">
                 <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded text-slate-600 text-sm font-medium hover:bg-white transition-colors">
                    取消
                 </button>
                 <button onClick={handleCreate} className="px-6 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 transition-colors shadow-sm">
                    保存
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
