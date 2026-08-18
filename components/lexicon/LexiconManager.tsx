
import React, { useState } from 'react';
import { 
  Plus, Search, Edit3, Trash2, BookA, Signal, Upload, 
  Check, X, FileText, Filter, ArrowLeft
} from 'lucide-react';
import { LexiconItem } from '../../types';
import { TagInput, Label, Switch, Select } from '../ui/FormComponents';
import CategoryListView from '../knowledge/CategoryListView';

// --- Mock Data ---
const MOCK_LEXICON: LexiconItem[] = [
  {
    id: '1',
    term: 'RPA',
    synonyms: ['机器人流程自动化', '自动办公机器人'],
    category: '产品名称',
    description: 'Robotic Process Automation，用于模拟人类操作电脑软件。',
    weight: 'HIGH',
    isActive: true,
    lastUpdated: 1715420000000
  },
  {
    id: '2',
    term: 'SaaS',
    synonyms: ['软件即服务', '云服务'],
    category: '技术术语',
    description: 'Software as a Service。',
    weight: 'MEDIUM',
    isActive: true,
    lastUpdated: 1715410000000
  },
  {
    id: '3',
    term: '元宇宙',
    synonyms: ['Metaverse', '虚拟世界'],
    category: '行业概念',
    description: '',
    weight: 'LOW',
    isActive: false,
    lastUpdated: 1715300000000
  },
  {
    id: '4',
    term: '抗生素',
    synonyms: ['消炎药', '阿莫西林'],
    category: '医疗词汇',
    description: '在医疗咨询场景下需要精准识别。',
    weight: 'HIGH',
    isActive: true,
    lastUpdated: 1715200000000
  }
];

export default function LexiconManager() {
  const [lexicon, setLexicon] = useState<LexiconItem[]>(MOCK_LEXICON);
  const [view, setView] = useState<'CATEGORY_LIST' | 'LIST'>('CATEGORY_LIST');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['产品名称', '技术术语', '行业概念', '医疗词汇', '公司名', '自定义']);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LexiconItem | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<LexiconItem>>({
    term: '',
    synonyms: [],
    category: '自定义',
    weight: 'MEDIUM',
    isActive: true,
    description: ''
  });

  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // --- Handlers ---
  const handleOpenModal = (item?: LexiconItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      setFormData({
        id: Date.now().toString(),
        term: '',
        synonyms: [],
        category: selectedCategory || '自定义',
        weight: 'MEDIUM',
        isActive: true,
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.term) return alert("术语名称不能为空");

    const newItem = {
      ...formData,
      id: editingItem ? editingItem.id : Date.now().toString(),
      lastUpdated: Date.now()
    } as LexiconItem;

    if (editingItem) {
      setLexicon(prev => prev.map(item => item.id === editingItem.id ? newItem : item));
    } else {
      setLexicon(prev => [newItem, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确认删除该词条吗？')) {
      setLexicon(prev => prev.filter(item => item.id !== id));
    }
  };

  const toggleStatus = (id: string, status: boolean) => {
    setLexicon(prev => prev.map(item => item.id === id ? { ...item, isActive: status } : item));
  };

  // --- Render Helpers ---
  const getWeightBadge = (weight: string) => {
    switch (weight) {
      case 'HIGH': return (
        <span className="flex items-center text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold border border-green-100">
          <Signal size={10} className="mr-1" /> 高权重
        </span>
      );
      case 'MEDIUM': return (
        <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100">
          <Signal size={10} className="mr-1 opacity-60" /> 中权重
        </span>
      );
      default: return (
        <span className="flex items-center text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">
          <Signal size={10} className="mr-1 opacity-30" /> 低权重
        </span>
      );
    }
  };

  const filteredData = lexicon.filter(item => {
    const matchesSearch = item.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.synonyms.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const availableCategories = Array.from(new Set(lexicon.map(i => i.category)));

  // --- CATEGORY LIST VIEW ---
  if (view === 'CATEGORY_LIST') {
    const getCategoryStats = (category: string) => {
      const items = lexicon.filter(item => item.category === category);
      const highCount = items.filter(item => item.weight === 'HIGH').length;
      const mediumCount = items.filter(item => item.weight === 'MEDIUM').length;
      const lowCount = items.filter(item => item.weight === 'LOW').length;
      const lastUpdated = items.length > 0
        ? Math.max(...items.map(item => item.lastUpdated || 0))
        : undefined;

      return {
        count: items.length,
        lastUpdated,
        activeCount: highCount,
        inactiveCount: mediumCount + lowCount,
      };
    };

    const handleCategoryClick = (category: string) => {
      setSelectedCategory(category);
      setFilterCategory(category);
      setView('LIST');
    };

    const handleAddCategory = (name: string) => {
      if (!categories.includes(name)) {
        setCategories([...categories, name]);
      }
    };

    const handleEditCategory = (oldName: string, newName: string) => {
      if (oldName === newName) return;
      if (categories.includes(newName)) {
        alert('分类名称已存在');
        return;
      }

      setCategories(categories.map(c => c === oldName ? newName : c));
      setLexicon(lexicon.map(item =>
        item.category === oldName ? { ...item, category: newName } : item
      ));
    };

    const handleDeleteCategory = (name: string) => {
      setCategories(categories.filter(c => c !== name));
    };

    return (
      <div className="h-full overflow-auto">
        <CategoryListView
          title="词库分类"
          description="选择分类查看和管理词条"
          categories={categories}
          onCategoryClick={handleCategoryClick}
          onAddCategory={handleAddCategory}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
          getCategoryStats={getCategoryStats}
        />
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setView('CATEGORY_LIST');
              setSelectedCategory(null);
              setFilterCategory('ALL');
            }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
                <BookA size={24} className="mr-3 text-indigo-600" />
                {selectedCategory}
              </h1>
              <span className="text-sm text-slate-400">词库管理</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              维护专业术语热词表，增强 ASR 识别准确率并辅助大模型理解业务上下文。
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
           <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center shadow-sm">
             <Upload size={16} className="mr-2" /> 批量导入
           </button>
           <button 
             onClick={() => handleOpenModal()}
             className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-sky-600 transition-all flex items-center shadow-md shadow-sky-100"
           >
             <Plus size={18} className="mr-2" /> 新建词条
           </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
         {/* Toolbar */}
         <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center space-x-4">
               <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:border-primary outline-none w-64 bg-white"
                    placeholder="搜索术语或同义词..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               
               <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Filter size={16} className="text-slate-400" />
                  <span>分类:</span>
                  <select 
                    className="bg-transparent font-medium outline-none text-slate-800 cursor-pointer"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                     <option value="ALL">全部</option>
                     {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
            </div>
            
            <div className="text-xs text-slate-400">
               共 {filteredData.length} 条记录
            </div>
         </div>

         {/* List */}
         <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50 border-b border-gray-100 sticky top-0 z-10">
                  <tr>
                     <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">标准术语 (Term)</th>
                     <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">同义词 / 扩展词 (Synonyms)</th>
                     <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">分类</th>
                     <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">识别权重</th>
                     <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">状态</th>
                     <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {filteredData.map(item => (
                     <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                           <div className="font-bold text-slate-800 text-sm">{item.term}</div>
                           {item.description && (
                              <div className="text-[10px] text-slate-400 mt-1 max-w-xs truncate" title={item.description}>
                                 {item.description}
                              </div>
                           )}
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-wrap gap-1.5">
                              {item.synonyms.length > 0 ? item.synonyms.map((s, i) => (
                                 <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">
                                    {s}
                                 </span>
                              )) : <span className="text-slate-300 text-xs">-</span>}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 shadow-sm">
                              {item.category}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           {getWeightBadge(item.weight)}
                        </td>
                        <td className="px-6 py-4">
                           <div className="scale-75 origin-left">
                              <Switch 
                                 label="" 
                                 checked={item.isActive} 
                                 onChange={(v) => toggleStatus(item.id, v)} 
                              />
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleOpenModal(item)}
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-sky-50 rounded transition-all"
                              >
                                 <Edit3 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
                  {filteredData.length === 0 && (
                     <tr>
                        <td colSpan={6} className="py-20 text-center text-slate-400">
                           <BookA size={40} className="mx-auto mb-4 opacity-20" />
                           <p>暂无符合条件的词条</p>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-[500px] overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-base font-bold text-slate-800 flex items-center">
                     {editingItem ? '编辑词条' : '新建词条'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                     <X size={20} />
                  </button>
               </div>
               
               <div className="p-6 space-y-5">
                  <div>
                     <Label label="标准术语 (Standard Term)" required />
                     <input 
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:border-primary outline-none text-sm"
                        placeholder="例如：元宇宙"
                        value={formData.term}
                        onChange={(e) => setFormData({...formData, term: e.target.value})}
                     />
                  </div>

                  <div>
                     <Label label="同义词 / 扩展词 (Synonyms)" tooltip="添加该术语的其他叫法，增加ASR泛化能力。" />
                     <TagInput 
                        label=""
                        placeholder="输入后回车"
                        tags={formData.synonyms || []}
                        onChange={(tags) => setFormData({...formData, synonyms: tags})}
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <Label label="业务分类" />
                        <div className="relative">
                           <input 
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:border-primary outline-none text-sm"
                              placeholder="例如：产品名"
                              list="categories_list"
                              value={formData.category}
                              onChange={(e) => setFormData({...formData, category: e.target.value})}
                           />
                           <datalist id="categories_list">
                              <option value="产品名称" />
                              <option value="技术术语" />
                              <option value="行业黑话" />
                              <option value="公司名" />
                           </datalist>
                        </div>
                     </div>
                     <div>
                        <Label label="识别权重 (Boost)" tooltip="权重越高，ASR引擎越倾向于识别此词。" />
                        <Select 
                           options={[
                              { label: '高权重 (High)', value: 'HIGH' },
                              { label: '中权重 (Medium)', value: 'MEDIUM' },
                              { label: '低权重 (Low)', value: 'LOW' }
                           ]}
                           value={formData.weight}
                           onChange={(e) => setFormData({...formData, weight: e.target.value as any})}
                        />
                     </div>
                  </div>

                  <div>
                     <Label label="描述 / 释义 (LLM Context)" tooltip="可选。为大模型提供该术语的解释，帮助其更好理解上下文。" />
                     <textarea 
                        className="w-full h-20 px-3 py-2 text-sm border border-gray-300 rounded resize-none focus:border-primary outline-none"
                        placeholder="简要描述该术语的含义..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                     />
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded border border-blue-100">
                     <FileText size={14} className="text-blue-600" />
                     <span className="text-xs text-blue-700">提示：高频更新的词库建议通过 API 自动同步。</span>
                  </div>
               </div>

               <div className="px-6 py-4 border-t border-gray-100 bg-slate-50 flex justify-end space-x-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-slate-600 text-sm font-medium hover:bg-white">
                     取消
                  </button>
                  <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 shadow-sm">
                     保存
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
