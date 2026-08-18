
import React, { useState } from 'react';
import InterfaceConfig from './components/extraction/InterfaceConfig';
import TriggerConfig from './components/extraction/TriggerConfig';
import { ExtractionConfig, BotVariable } from './types';

interface InformationExtractionProps {
  configs: ExtractionConfig[];
  onUpdateConfigs: (configs: ExtractionConfig[]) => void;
  availableVariables?: BotVariable[];
}

export default function InformationExtraction({ configs, onUpdateConfigs, availableVariables = [] }: InformationExtractionProps) {
  const [activeTab, setActiveTab] = useState<'INTERFACE' | 'TRIGGER'>('INTERFACE');

  return (
    <div className="flex flex-col h-full">
      {/* Sub-Navigation for Extraction Module */}
      <div className="px-8 pt-6 border-b border-gray-200 bg-white">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('INTERFACE')}
            className={`pb-3 text-sm font-medium transition-all relative ${
              activeTab === 'INTERFACE' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            接口配置
          </button>
          <button
            onClick={() => setActiveTab('TRIGGER')}
            className={`pb-3 text-sm font-medium transition-all relative ${
              activeTab === 'TRIGGER' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            触发器设置
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        {activeTab === 'INTERFACE' && (
          <InterfaceConfig 
            configs={configs}
            onUpdateConfigs={onUpdateConfigs}
            availableVariables={availableVariables}
          />
        )}
        {activeTab === 'TRIGGER' && <TriggerConfig />}
      </div>
    </div>
  );
}
