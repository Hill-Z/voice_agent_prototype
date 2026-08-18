
import React, { useState } from 'react';
import DisplaySettings from './DisplaySettings';
import TrunkNumbers from './TrunkNumbers';
import NumberPools from './NumberPools';
import Numbers400 from './Numbers400';
import MobileCards from './MobileCards';

export default function NumberManagement() {
  const [activeTab, setActiveTab] = useState<'DISPLAY' | 'TRUNK' | 'POOL' | '400' | 'MOBILE'>('DISPLAY');

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-8 pt-2">
         <div className="flex space-x-8">
            {[
              { id: 'DISPLAY', label: '显号设置' },
              { id: 'TRUNK', label: '中继号码' },
              { id: 'POOL', label: '号码池' },
              { id: '400', label: '400号码' },
              { id: 'MOBILE', label: '手机卡号' },
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
         {activeTab === 'DISPLAY' && <DisplaySettings />}
         {activeTab === 'TRUNK' && <TrunkNumbers />}
         {activeTab === 'POOL' && <NumberPools />}
         {activeTab === '400' && <Numbers400 />}
         {activeTab === 'MOBILE' && <MobileCards />}
      </div>
    </div>
  );
}
