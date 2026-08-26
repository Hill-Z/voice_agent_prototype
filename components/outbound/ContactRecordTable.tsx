// 联系人明细表，按联系单字段动态展示列，并提供列设置、检索和分页。
import React, { useMemo, useState } from 'react';
import { Columns3, Search } from 'lucide-react';
import { ContactList } from '../../types';
import { getContactFieldValue } from './outboundContactData';

interface ContactRecordTableProps {
  contactList: ContactList;
  compact?: boolean;
}

const STATUS_NAMES = {
  pending: '待外呼',
  calling: '外呼中',
  completed: '已完成',
  invalid: '无效',
};

export default function ContactRecordTable({ contactList, compact = false }: ContactRecordTableProps) {
  const customFields = (contactList.fieldDefinitions || []).filter((field) => !field.system);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(customFields.slice(0, 4).map((field) => field.key));
  const [showColumns, setShowColumns] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = compact ? 5 : 10;

  const filteredRecords = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return contactList.records || [];
    return (contactList.records || []).filter((record) => {
      const text = [record.customerName, record.phoneNumber, ...Object.values(record.values).map(String)].join(' ').toLowerCase();
      return text.includes(normalized);
    });
  }, [contactList.records, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const pageRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);
  const visibleFields = customFields.filter((field) => visibleKeys.includes(field.key));

  const toggleColumn = (key: string) => {
    setVisibleKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div className="relative max-w-md flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={keyword}
            onChange={(event) => { setKeyword(event.target.value); setPage(1); }}
            placeholder="搜索姓名、手机号或自定义字段"
            className="w-full rounded border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="relative">
          <button onClick={() => setShowColumns((value) => !value)} className="flex items-center rounded border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            <Columns3 size={15} className="mr-2" /> 列设置
          </button>
          {showColumns && (
            <div className="absolute right-0 top-11 z-20 w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
              <div className="mb-2 text-xs font-bold text-slate-700">选择显示的自定义字段</div>
              <div className="space-y-2">
                {customFields.map((field) => (
                  <label key={field.key} className="flex cursor-pointer items-center text-sm text-slate-600">
                    <input type="checkbox" checked={visibleKeys.includes(field.key)} onChange={() => toggleColumn(field.key)} className="mr-2" />
                    {field.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-full whitespace-nowrap text-left">
          <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="sticky left-0 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">客户姓名</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500">手机号码</th>
              {visibleFields.map((field) => <th key={field.key} className="px-4 py-3 text-xs font-bold text-slate-500">{field.name}</th>)}
              <th className="px-4 py-3 text-xs font-bold text-slate-500">执行状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRecords.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50">
                <td className="sticky left-0 bg-white px-4 py-3 text-sm font-medium text-slate-800">{record.customerName}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{record.phoneNumber}</td>
                {visibleFields.map((field) => <td key={field.key} className="px-4 py-3 text-sm text-slate-600">{getContactFieldValue(record, field.key)}</td>)}
                <td className="px-4 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{STATUS_NAMES[record.status]}</span></td>
              </tr>
            ))}
            {pageRecords.length === 0 && <tr><td colSpan={visibleFields.length + 3} className="py-12 text-center text-sm text-slate-400">未找到联系人</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        <span>共 {filteredRecords.length} 条，联系单实际共 {contactList.totalCount} 条</span>
        <div className="flex items-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40">上一页</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40">下一页</button>
        </div>
      </div>
    </div>
  );
}
