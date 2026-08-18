
import React, { useState } from 'react';
import RouteList from './RouteList';
import { BotConfiguration } from '../../types';

interface IVRManagerProps {
  bots: BotConfiguration[];
}

export default function IVRManager({ bots }: IVRManagerProps) {
  const [activeTab, setActiveTab] = useState<'ROUTE' | 'IVR' | 'VARS'>('ROUTE');

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-8 pt-2">
         <div className="flex space-x-8">
            {[
              { id: 'ROUTE', label: '路由' },
              { id: 'IVR', label: 'IVR' },
              { id: 'VARS', label: 'IVR变量' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 pt-4 text-sm font-medium transition-all relative ${
                  activeTab === tab.id 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
         </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
         {activeTab === 'ROUTE' && <RouteList bots={bots} />}
         {activeTab === 'IVR' && (
            <div className="flex items-center justify-center h-full text-slate-400">
               IVR 流程图编辑器开发中...
            </div>
         )}
         {activeTab === 'VARS' && (
            <div className="flex items-center justify-center h-full text-slate-400">
               IVR 全局变量管理开发中...
            </div>
         )}
      </div>
    </div>
  );
}
