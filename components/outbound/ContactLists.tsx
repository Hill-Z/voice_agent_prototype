// 联系单列表与联系人明细页，支持查看动态自定义字段。
import React, { useMemo, useState } from 'react';
import { ArrowLeft, Download, FileSpreadsheet, Search, Trash2, Upload } from 'lucide-react';
import { ContactList } from '../../types';
import ContactRecordTable from './ContactRecordTable';
import { OUTBOUND_CONTACT_LISTS } from './outboundContactData';

export default function ContactLists() {
  const [lists, setLists] = useState<ContactList[]>(OUTBOUND_CONTACT_LISTS);
  const [selectedList, setSelectedList] = useState<ContactList | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const filteredLists = useMemo(() => lists.filter((list) => list.name.toLowerCase().includes(searchTerm.toLowerCase())), [lists, searchTerm]);

  const handleDelete = (id: string) => {
    if (confirm('确定删除该联系单吗？')) setLists((current) => current.filter((list) => list.id !== id));
  };

  if (selectedList) {
    const customFields = (selectedList.fieldDefinitions || []).filter((field) => !field.system);
    return (
      <div className="flex h-full flex-col bg-slate-50">
        <div className="flex h-12 items-center border-b border-slate-200 bg-white px-6">
          <button onClick={() => setSelectedList(null)} className="flex items-center text-sm text-slate-500 hover:text-primary"><ArrowLeft size={15} className="mr-1" /> 返回联系单</button>
          <span className="mx-3 text-slate-300">|</span><span className="text-sm font-bold text-slate-700">{selectedList.name}</span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col p-6">
          <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4">
            <div><h2 className="font-bold text-slate-800">联系人数据</h2><p className="mt-1 text-xs text-slate-500">固定字段 2 项，自定义字段 {customFields.length} 项；任务可将这些字段映射为机器人输入变量。</p></div>
            <button className="rounded border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><Download size={15} className="mr-2 inline" />导出</button>
          </div>
          <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 shadow-sm"><ContactRecordTable contactList={selectedList} /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-primary" placeholder="搜索联系单名称" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></div>
        <div className="flex space-x-3"><button className="flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Download size={16} className="mr-2" /> 下载模板</button><button className="flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-sky-600"><Upload size={16} className="mr-2" /> 上传联系单</button></div>
      </div>
      <div className="flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="border-b border-slate-100 bg-slate-50"><tr><th className="px-6 py-4 text-xs font-bold text-slate-500">ID</th><th className="px-6 py-4 text-xs font-bold text-slate-500">联系单名称</th><th className="px-6 py-4 text-xs font-bold text-slate-500">字段</th><th className="px-6 py-4 text-xs font-bold text-slate-500">总数量</th><th className="px-6 py-4 text-xs font-bold text-slate-500">有效数量</th><th className="px-6 py-4 text-xs font-bold text-slate-500">状态</th><th className="px-6 py-4 text-xs font-bold text-slate-500">上传时间</th><th className="px-6 py-4 text-right text-xs font-bold text-slate-500">操作</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLists.map((list) => <tr key={list.id} className="hover:bg-slate-50"><td className="px-6 py-4 text-sm text-slate-500">{list.id}</td><td className="px-6 py-4"><div className="flex items-center"><FileSpreadsheet size={16} className="mr-2 text-green-600" /><button onClick={() => setSelectedList(list)} className="text-sm font-medium text-slate-800 hover:text-primary">{list.name}</button></div></td><td className="px-6 py-4 text-sm text-slate-600">{list.fieldDefinitions?.length || 2} 项</td><td className="px-6 py-4 text-sm text-slate-600">{list.totalCount}</td><td className="px-6 py-4 text-sm text-slate-600">{list.validCount}</td><td className="px-6 py-4"><span className="rounded border border-green-100 bg-green-50 px-2 py-1 text-xs font-bold text-green-700">上传成功</span></td><td className="px-6 py-4 text-sm text-slate-500">{new Date(list.createdAt).toLocaleString()}</td><td className="px-6 py-4 text-right"><button onClick={() => setSelectedList(list)} className="mr-4 text-xs text-blue-600 hover:underline">查看</button><button onClick={() => handleDelete(list.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button></td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
