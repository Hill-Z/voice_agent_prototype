
import React, { useState } from 'react';
import RecordingList from './RecordingList';
import BgmList from './BgmList';

export default function FileManager() {
  const [activeTab, setActiveTab] = useState<'RECORDING' | 'BGM'>('RECORDING');

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-8 pt-2">
         <div className="flex space-x-8">
            {[
              { id: 'RECORDING', label: '录音管理' },
              { id: 'BGM', label: '背景音管理' },
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
      <div className="flex-1 overflow-hidden p-8">
         {activeTab === 'RECORDING' && <RecordingList />}
         {activeTab === 'BGM' && <BgmList />}
      </div>
    </div>
  );
}
