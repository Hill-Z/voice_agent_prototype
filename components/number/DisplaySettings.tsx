
import React, { useState } from 'react';
import { DisplaySettingsConfig } from '../../types';

export default function DisplaySettings() {
  const [config, setConfig] = useState<DisplaySettingsConfig>({
    defaultOutboundType: 'trunk',
    defaultOutboundValue: '08552200926',
    inboundMappingType: 'trunk',
    transferDisplayType: 'trunk',
    mobileOutboundType: 'same_as_customer'
  });

  const RadioGroup: React.FC<{
    label: string;
    name: string;
    options: { label: string; value: string; extraInput?: boolean }[];
    currentValue: string;
    onChange: (val: string) => void;
    inputValue?: string;
    onInputChange?: (val: string) => void;
  }> = ({ label, name, options, currentValue, onChange, inputValue, onInputChange }) => (
    <div className="flex items-center py-6 border-b border-gray-50 last:border-0">
      <div className="w-64 text-sm font-bold text-slate-700">{label}：</div>
      <div className="flex items-center space-x-6">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center cursor-pointer group">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={currentValue === opt.value}
              onChange={() => onChange(opt.value)}
              className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
            />
            <span className="ml-2 text-sm text-slate-600 group-hover:text-slate-800">{opt.label}</span>
            {opt.extraInput && currentValue === opt.value && onInputChange && (
              <input 
                type="text" 
                className="ml-3 px-2 py-1 text-sm border border-gray-200 rounded outline-none focus:border-primary w-40"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
              />
            )}
          </label>
        ))}
        <button className="ml-4 px-4 py-1.5 bg-primary text-white rounded text-xs font-bold hover:bg-sky-600 transition-colors">
          确定
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-5xl">
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-2">
        
        <RadioGroup
          label="默认外呼显号"
          name="defaultOutbound"
          currentValue={config.defaultOutboundType}
          onChange={(v) => setConfig({...config, defaultOutboundType: v as any})}
          inputValue={config.defaultOutboundValue}
          onInputChange={(v) => setConfig({...config, defaultOutboundValue: v})}
          options={[
            { label: '中继号', value: 'trunk', extraInput: true },
            { label: '号码池', value: 'pool', extraInput: true }
          ]}
        />

        <RadioGroup
          label="客户呼入外呼座席手机号码"
          name="inboundMapping"
          currentValue={config.inboundMappingType}
          onChange={(v) => setConfig({...config, inboundMappingType: v as any})}
          options={[
            { label: '原主叫号码', value: 'original' },
            { label: '呼入中继号', value: 'trunk' },
            { label: '指定中继号', value: 'specific' },
            { label: '号码池', value: 'pool' }
          ]}
        />

        <RadioGroup
          label="座席转外线显号"
          name="transferDisplay"
          currentValue={config.transferDisplayType}
          onChange={(v) => setConfig({...config, transferDisplayType: v as any})}
          options={[
            { label: '原主叫号码', value: 'original' },
            { label: '呼入中继号', value: 'trunk' },
            { label: '指定中继号', value: 'specific' },
            { label: '号码池', value: 'pool' }
          ]}
        />

        <RadioGroup
          label="外呼座席手机时的号码"
          name="mobileOutbound"
          currentValue={config.mobileOutboundType}
          onChange={(v) => setConfig({...config, mobileOutboundType: v as any})}
          options={[
            { label: '与呼叫客户相同的号码', value: 'same_as_customer' },
            { label: '专属指定中继号', value: 'specific_trunk' },
            { label: '专属指定号码池', value: 'specific_pool' }
          ]}
        />

      </div>
      
      <div className="mt-6 flex items-center text-xs text-slate-400">
         <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 mr-2 font-bold">?</span>
         提示：配置后将在所有呼叫场景生效，请确保中继线路支持相应的透传能力。
      </div>
    </div>
  );
}
