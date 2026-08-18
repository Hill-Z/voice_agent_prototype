import React, { useState } from 'react';
import { ChevronDown, Download, Filter, Save } from 'lucide-react';

interface CallRecord {
  id: string;
  callId: string;
  timestamp: string;
  phoneNumber: string;
  location: string;
  routeName: string;
  status: 'read' | 'unread';
}

interface CallRecordListProps {
  onViewDetail: (callId: string) => void;
}

const MOCK_CALL_RECORDS: CallRecord[] = [
  {
    id: '1',
    callId: '4cb67f3a-6d81-4033-bb5f-a3cf8292a2e5',
    timestamp: '2026-03-20 14:29:23',
    phoneNumber: '15527562690',
    location: '湖北/武汉',
    routeName: '',
    status: 'read'
  },
  {
    id: '2',
    callId: '08a7ebe7-6e5d-43ce-8f49-ebf87f3e34f7',
    timestamp: '2026-03-20 14:09:40',
    phoneNumber: '15527562690',
    location: '湖北/武汉',
    routeName: '',
    status: 'unread'
  },
  {
    id: '3',
    callId: '0493b480-122a-44ea-9664-d68ac819476e',
    timestamp: '2026-03-20 11:20:20',
    phoneNumber: '17625941334',
    location: '江苏/南京',
    routeName: '王晓辉 Demo（江苏路由不要动）',
    status: 'read'
  },
  {
    id: '4',
    callId: 'd2b8b0cb-bfdd-4d38-9eb0-db115efae331',
    timestamp: '2026-03-20 11:20:03',
    phoneNumber: '17625941334',
    location: '江苏/南京',
    routeName: '王晓辉 Demo（江苏路由不要动）',
    status: 'read'
  },
  {
    id: '5',
    callId: 'c24cdc8c-1d8f-45f6-8635-03d3ab6949ae',
    timestamp: '2026-03-20 11:15:43',
    phoneNumber: '17625941334',
    location: '江苏/南京',
    routeName: '王晓辉 Demo（江苏路由不要动）',
    status: 'read'
  },
  {
    id: '6',
    callId: '80b85e14-7c02-497c-a82e-bfd27f11a3b2',
    timestamp: '2026-03-20 11:12:57',
    phoneNumber: '17625941334',
    location: '江苏/南京',
    routeName: '王晓辉 Demo（江苏路由不要动）',
    status: 'unread'
  },
  {
    id: '7',
    callId: 'a5eca2ef-d6dc-4e5e-b984-1c51c6d4b296',
    timestamp: '2026-03-20 11:12:33',
    phoneNumber: '17625941334',
    location: '江苏/南京',
    routeName: '王晓辉 Demo（江苏路由不要动）',
    status: 'unread'
  },
  {
    id: '8',
    callId: '6ef90c43-8b89-44c3-98f7-733e31e21961',
    timestamp: '2026-03-20 10:29:06',
    phoneNumber: '15527562690',
    location: '湖北/武汉',
    routeName: '',
    status: 'read'
  }
];

export default function CallRecordList({ onViewDetail }: CallRecordListProps) {
  const [records, setRecords] = useState<CallRecord[]>(MOCK_CALL_RECORDS);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

  const handleSelectRecord = (id: string) => {
    setSelectedRecords(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRecords.length === records.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(records.map(record => record.id));
    }
  };

  const handleExportAll = () => {
    // 导出全部功能
    console.log('导出全部通话记录');
  };

  const handleSave = () => {
    // 保存功能
    console.log('保存筛选结果');
  };

  const handleFilter = () => {
    // 筛选功能
    console.log('打开筛选面板');
  };

  return (
    <div className="h-full flex flex-col">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-primary outline-none">
              <option>全部通话记录</option>
              <option>已读</option>
              <option>未读</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleFilter}
            className="flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            <Filter size={14} className="mr-1" /> 筛选
          </button>
          <button 
            onClick={handleSave}
            className="px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-sky-600"
          >
            保存
          </button>
          <button 
            onClick={handleExportAll}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center"
          >
            <Download size={14} className="mr-1" /> 导出全部
          </button>
        </div>
      </div>

      {/* 通话记录表格 */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex-1 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase w-8">
                <input 
                  type="checkbox" 
                  checked={selectedRecords.length === records.length && records.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                />
              </th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase w-16">审阅</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Call ID</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">通话时间</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">客户号码</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">归属地</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">路由名称</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase w-12 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map(record => (
              <tr 
                key={record.id} 
                className="hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => onViewDetail(record.callId)}
              >
                <td className="px-4 py-3">
                  <input 
                    type="checkbox" 
                    checked={selectedRecords.includes(record.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectRecord(record.id);
                    }}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${record.status === 'read' ? 'text-green-600' : 'text-blue-600'}`}>
                    {record.status === 'read' ? '已读' : '未读'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                  {record.callId}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {record.timestamp}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                  {record.phoneNumber}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {record.location}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {record.routeName || '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button 
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      // 更多操作
                      console.log('更多操作:', record.id);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1"/>
                      <circle cx="19" cy="12" r="1"/>
                      <circle cx="5" cy="12" r="1"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
