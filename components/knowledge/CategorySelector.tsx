import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Search, X } from 'lucide-react';

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
  onAddCategory?: (category: string) => void;
  placeholder?: string;
  showConfidence?: boolean;
  confidence?: number;
  autoCategory?: string;
  disabled?: boolean;
}

export default function CategorySelector({
  value,
  onChange,
  categories,
  onAddCategory,
  placeholder = '选择分类',
  showConfidence = false,
  confidence,
  autoCategory,
  disabled = false,
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (category: string) => {
    onChange(category);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() && onAddCategory) {
      onAddCategory(newCategoryName.trim());
      onChange(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddModal(false);
      setIsOpen(false);
    }
  };

  // 显示自动分类标签
  const showAutoTag = autoCategory && autoCategory !== value;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 选择框 */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-3 py-1.5 bg-white border rounded text-sm cursor-pointer transition-colors ${
          disabled
            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
            : 'border-slate-200 hover:border-primary'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`truncate ${value ? 'text-slate-700' : 'text-slate-400'}`}>
            {value || placeholder}
          </span>
          {showConfidence && confidence !== undefined && confidence > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              confidence > 0.8
                ? 'bg-green-100 text-green-700'
                : confidence > 0.6
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-slate-100 text-slate-500'
            }`}>
              {Math.round(confidence * 100)}%
            </span>
          )}
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* 自动分类提示 */}
      {showAutoTag && (
        <div className="mt-1 text-[10px] text-slate-400 flex items-center gap-1">
          <span>自动识别:</span>
          <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{autoCategory}</span>
        </div>
      )}

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
            {/* 搜索框 */}
            <div className="p-2 border-b border-slate-100">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded">
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索分类..."
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* 新增分类按钮 */}
            {onAddCategory && (
              <div className="p-2 border-b border-slate-100">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full flex items-center justify-center gap-1 px-3 py-2 text-xs text-primary hover:bg-blue-50 rounded transition-colors"
                >
                  <Plus size={14} />
                  新建分类
                </button>
              </div>
            )}

            {/* 分类列表 */}
            <div className="max-h-48 overflow-y-auto">
              {filteredCategories.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  {searchQuery ? '未找到匹配的分类' : '暂无分类'}
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleSelect(category)}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                      value === category
                        ? 'bg-blue-50 text-primary font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {category}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* 新增分类弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-80 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">新建分类</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCategoryName('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">分类名称</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="例如: 售后服务"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1 py-2 border border-gray-200 rounded text-xs text-slate-600 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className="flex-1 py-2 bg-primary text-white rounded text-xs hover:bg-primary/90 disabled:opacity-50"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
