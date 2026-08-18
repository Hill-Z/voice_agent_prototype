import React, { useState } from 'react';
import { Plus, FolderOpen, AlertCircle, MoreHorizontal, Pencil, Trash2, ChevronRight } from 'lucide-react';

interface CategoryListViewProps {
  title: string;
  description?: string;
  categories: string[];
  onCategoryClick: (category: string) => void;
  onAddCategory: (name: string) => void;
  onEditCategory?: (oldName: string, newName: string) => void;
  onDeleteCategory?: (name: string) => void;
  getCategoryStats: (category: string) => {
    count: number;
    lastUpdated?: number;
    activeCount?: number;
    inactiveCount?: number;
  };
  children?: React.ReactNode;
}

const CategoryListView: React.FC<CategoryListViewProps> = ({
  title,
  description,
  categories,
  onCategoryClick,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  getCategoryStats,
  children,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleAddSubmit = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
      setIsAdding(false);
    }
  };

  const handleDelete = (category: string) => {
    const stats = getCategoryStats(category);
    if (stats.count > 0) {
      setDeleteConfirm(category);
      setOpenMenu(null);
      return;
    }
    onDeleteCategory?.(category);
    setOpenMenu(null);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      onDeleteCategory?.(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const startEdit = (category: string) => {
    setEditingCategory(category);
    setEditName(category);
    setOpenMenu(null);
  };

  const saveEdit = () => {
    if (editingCategory && editName.trim() && editName !== editingCategory) {
      onEditCategory?.(editingCategory, editName.trim());
    }
    setEditingCategory(null);
    setEditName('');
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
  };

  return (
    <div className="p-6 max-w-full mx-auto w-full">
      {/* RAG Config or other children */}
      {children && <div className="mb-6">{children}</div>}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          )}
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-sky-600 shadow-sm transition-colors"
          >
            <Plus size={16} />
            新建分类
          </button>
        )}
      </div>

      {/* Add Category Card */}
      {isAdding && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-3">
            <FolderOpen size={20} className="text-blue-600" />
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSubmit();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewCategoryName('');
                }
              }}
              placeholder="输入分类名称"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:border-primary outline-none"
              autoFocus
            />
            <button
              onClick={handleAddSubmit}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-sky-600"
            >
              确认
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewCategoryName('');
              }}
              className="px-4 py-2 border border-gray-300 text-slate-600 rounded text-sm font-medium hover:bg-white"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Category List Table */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-slate-100 rounded-full mb-4">
            <FolderOpen size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 mb-2">暂无分类</h3>
          <p className="text-sm text-slate-500 mb-4">点击"新建分类"创建第一个分类</p>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-sky-600"
          >
            <Plus size={16} />
            新建分类
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">分类名称</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">数据量</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">启用/停用</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">最后更新</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((category) => {
                const stats = getCategoryStats(category);
                const isEditing = editingCategory === category;

                return (
                  <tr
                    key={category}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="px-2 py-1 text-sm border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            autoFocus
                          />
                          <button
                            onClick={saveEdit}
                            className="text-green-600 hover:text-green-700"
                          >
                            保存
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <FolderOpen size={16} className="text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">{category}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-slate-600">{stats.count}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {stats.count > 0 ? (
                        <div className="flex items-center justify-center gap-2 text-xs">
                          <span className="text-green-600">{stats.activeCount || 0}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-orange-500">{stats.inactiveCount || 0}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {stats.lastUpdated ? (
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(stats.lastUpdated).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onCategoryClick(category)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary hover:bg-blue-50 rounded transition-colors"
                        >
                          管理
                          <ChevronRight size={14} />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenu(openMenu === category ? null : category)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {openMenu === category && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenu(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                {onEditCategory && (
                                  <button
                                    onClick={() => startEdit(category)}
                                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-primary flex items-center gap-2"
                                  >
                                    <Pencil size={12} />
                                    重命名
                                  </button>
                                )}
                                {onDeleteCategory && (
                                  <button
                                    onClick={() => handleDelete(category)}
                                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-50"
                                  >
                                    <Trash2 size={12} />
                                    删除
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-full">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">无法删除分类</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              分类 "{deleteConfirm}" 下还有 {getCategoryStats(deleteConfirm).count} 条数据，
              请先删除或移动这些数据后再删除分类。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-sky-600"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryListView;
