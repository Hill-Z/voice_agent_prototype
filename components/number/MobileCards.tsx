
import React from 'react';
import { Smartphone, Signal } from 'lucide-react';

export default function MobileCards() {
  return (
    <div className="p-6 h-full flex flex-col items-center justify-center text-slate-400">
       <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
          <Smartphone size={32} className="opacity-30" />
       </div>
       <h3 className="text-lg font-medium text-slate-600 mb-2">手机卡号管理</h3>
       <p className="text-sm max-w-md text-center leading-relaxed">
          此处管理连接到网关设备的 SIM 卡信息。支持监控信号强度、在线状态及端口分配。
       </p>
    </div>
  );
}
