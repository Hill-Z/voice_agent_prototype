import React, { useState } from 'react';
import CallRecordList from './CallRecordList';
import CallRecordDetail from './CallRecordDetail';

export default function CallRecordManager() {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  const handleViewDetail = (callId: string) => {
    setSelectedCallId(callId);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedCallId(null);
  };

  return (
    <div className="h-full">
      {viewMode === 'list' ? (
        <CallRecordList onViewDetail={handleViewDetail} />
      ) : (
        <div className="h-full flex flex-col">
          {/* 面包屑导航 */}
          <div className="border-b border-slate-200 bg-white p-4 flex items-center">
            <button 
              onClick={handleBackToList}
              className="flex items-center text-primary hover:underline text-sm mb-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M19 12H5"/>
                <path d="m12 19-7-7 7-7"/>
              </svg>
              通话记录列表
            </button>
            <span className="mx-2 text-slate-400">/</span>
            <span className="text-sm text-slate-600">通话详情</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <CallRecordDetail callId={selectedCallId} />
          </div>
        </div>
      )}
    </div>
  );
}
