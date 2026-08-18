import React, { useState, useRef } from 'react';
import { X, Upload, MapPin, Search, Plus, Trash2, Save, Play, FileSpreadsheet } from 'lucide-react';

interface GeoLocationRecord {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  phone?: string;
  tags?: string;
}

interface GeoLocationConfig {
  name: string;
  description: string;
  startSpeech: string;
  successSpeech: string;
  failureSpeech: string;
  records: GeoLocationRecord[];
  columnMapping: {
    name: string;
    city: string;
    district: string;
    address: string;
    phone: string;
    tags: string;
  };
}

const DEFAULT_CONFIG: GeoLocationConfig = {
  name: '地理位置查询',
  description: '查询门店、网点等地理位置信息',
  startSpeech: '正在为您查询附近的门店，请稍候...',
  successSpeech: '为您找到以下门店信息：',
  failureSpeech: '抱歉，未找到符合条件的门店。',
  records: [],
  columnMapping: {
    name: '门店名称',
    city: '城市',
    district: '区域',
    address: '地址',
    phone: '电话',
    tags: '标签',
  },
};

// Mock 麦当劳门店数据
const MOCK_MCDONALDS_DATA: GeoLocationRecord[] = [
  { id: '1', name: '麦当劳朝阳大悦城店', city: '北京', district: '朝阳区', address: '朝阳北路101号朝阳大悦城B1层', phone: '010-12345678', tags: '24小时,有儿童乐园' },
  { id: '2', name: '麦当劳王府井店', city: '北京', district: '东城区', address: '王府井大街255号', phone: '010-87654321', tags: '24小时' },
  { id: '3', name: '麦当劳中关村店', city: '北京', district: '海淀区', address: '中关村大街15号中关村广场', phone: '010-23456789', tags: '有drive-thru' },
  { id: '4', name: '麦当劳陆家嘴店', city: '上海', district: '浦东新区', address: '陆家嘴环路1000号', phone: '021-12345678', tags: '24小时,江景' },
  { id: '5', name: '麦当劳南京路店', city: '上海', district: '黄浦区', address: '南京东路800号', phone: '021-87654321', tags: '' },
  { id: '6', name: '麦当劳天河城店', city: '广州', district: '天河区', address: '天河路208号天河城B1层', phone: '020-12345678', tags: '24小时' },
  { id: '7', name: '麦当劳深圳万象城店', city: '深圳', district: '罗湖区', address: '宝安南路1881号万象城', phone: '0755-12345678', tags: '有儿童乐园' },
];

interface GeoLocationToolConfigProps {
  onClose: () => void;
}

const GeoLocationToolConfig: React.FC<GeoLocationToolConfigProps> = ({ onClose }) => {
  const [config, setConfig] = useState<GeoLocationConfig>({
    ...DEFAULT_CONFIG,
    records: MOCK_MCDONALDS_DATA,
  });
  const [activeTab, setActiveTab] = useState<'DATA' | 'CONFIG' | 'TEST'>('DATA');
  const [searchQuery, setSearchQuery] = useState('');
  const [testResult, setTestResult] = useState<GeoLocationRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        parseCSV(text);
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return;

    const headers = lines[0].split(',').map(h => h.trim());
    const records: GeoLocationRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      records.push({
        id: String(i),
        name: values[0] || '',
        city: values[1] || '',
        district: values[2] || '',
        address: values[3] || '',
        phone: values[4] || '',
        tags: values[5] || '',
      });
    }

    setConfig(prev => ({ ...prev, records }));
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setTestResult([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = config.records.filter(record =>
      record.name.toLowerCase().includes(query) ||
      record.city.toLowerCase().includes(query) ||
      record.district.toLowerCase().includes(query) ||
      record.address.toLowerCase().includes(query) ||
      record.tags.toLowerCase().includes(query)
    );
    setTestResult(results);
  };

  const filteredRecords = searchQuery
    ? config.records.filter(record =>
        record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.district.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : config.records;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-base font-bold text-slate-800 flex items-center">
            <MapPin size={18} className="mr-2 text-primary" />
            地理位置查询工具配置
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {[
            { id: 'DATA', label: '数据管理', icon: FileSpreadsheet },
            { id: 'CONFIG', label: '工具配置', icon: MapPin },
            { id: 'TEST', label: '查询测试', icon: Play },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-medium transition-all relative mr-8 flex items-center ${
                activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={14} className="mr-1.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* 数据管理 */}
          {activeTab === 'DATA' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-700">地理位置数据</h4>
                  <p className="text-xs text-slate-400 mt-1">已导入 {config.records.length} 条记录</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded focus:border-primary outline-none w-48"
                    placeholder="搜索门店..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-primary text-white rounded text-xs font-medium hover:bg-sky-600 flex items-center gap-1"
                  >
                    <Upload size={12} />
                    上传 CSV
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {config.records.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <Upload size={32} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">暂无数据</p>
                  <p className="text-xs text-slate-400 mt-1">点击"上传 CSV"导入地理位置数据</p>
                </div>
              ) : (
                <div className="bg-white rounded border border-gray-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500">门店名称</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500">城市</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500">区域</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500">地址</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500">电话</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500">标签</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-sm text-slate-800">{record.name}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-600">{record.city}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-600">{record.district}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-600">{record.address}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-600">{record.phone || '-'}</td>
                          <td className="px-4 py-2.5">
                            {record.tags ? (
                              <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{record.tags}</span>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="p-3 bg-blue-50 rounded text-[10px] text-blue-600">
                <span className="font-bold">CSV 格式要求：</span>门店名称,城市,区域,地址,电话,标签（每行一条记录）
              </div>
            </div>
          )}

          {/* 工具配置 */}
          {activeTab === 'CONFIG' && (
            <div className="space-y-6 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">工具名称</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">工具描述</label>
                <textarea
                  className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none resize-none"
                  value={config.description}
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">查询开始话术</label>
                <textarea
                  className="w-full h-16 px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none resize-none"
                  placeholder="正在为您查询附近的门店，请稍候..."
                  value={config.startSpeech}
                  onChange={(e) => setConfig(prev => ({ ...prev, startSpeech: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">查询成功话术</label>
                <textarea
                  className="w-full h-16 px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none resize-none"
                  placeholder="为您找到以下门店信息："
                  value={config.successSpeech}
                  onChange={(e) => setConfig(prev => ({ ...prev, successSpeech: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">查询失败话术</label>
                <textarea
                  className="w-full h-16 px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none resize-none"
                  placeholder="抱歉，未找到符合条件的门店。"
                  value={config.failureSpeech}
                  onChange={(e) => setConfig(prev => ({ ...prev, failureSpeech: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* 查询测试 */}
          {activeTab === 'TEST' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                  placeholder="输入查询语句，如：北京朝阳区的麦当劳、24小时营业的门店..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-sky-600 flex items-center gap-1"
                >
                  <Search size={14} />
                  测试查询
                </button>
              </div>

              {testResult.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">找到 {testResult.length} 条结果：</p>
                  {testResult.map((record) => (
                    <div key={record.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-bold text-slate-800">{record.name}</h5>
                        {record.tags && (
                          <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{record.tags}</span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-slate-500">📍 {record.city} {record.district} {record.address}</p>
                        {record.phone && <p className="text-xs text-slate-500">📞 {record.phone}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && testResult.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Search size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">未找到匹配结果</p>
                </div>
              )}

              {!searchQuery && (
                <div className="text-center py-8 text-slate-400">
                  <Play size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">输入查询语句并点击测试</p>
                  <p className="text-xs mt-1">支持关键词匹配：城市、区域、门店名称、标签等</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-slate-600 text-sm hover:bg-white transition-colors">
            取消
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 shadow-sm transition-colors">
            <Save size={14} className="inline mr-1" />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeoLocationToolConfig;