import React, { useState } from 'react';
import { Folder, MoreVertical, Edit3, Trash2, Check, X } from 'lucide-react';

interface CategoryCardProps {
  name: string;
  count: number;
  lastUpdated?: number;
  activeCount?: number;
  inactiveCount?: number;
  onClick: () => void;
  onEdit?: (newName: string) => void;
  onDelete?: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  name,
  count,
  lastUpdated,
  activeCount,
  inactiveCount,
  onClick,
  onEdit,
  onDelete,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);

  const handleEditSubmit = () => {
    if (editValue.trim() && editValue !== name && onEdit) {
      onEdit(editValue.trim());
    }
    setIsEditing(false);
    setEditValue(name);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditValue(name);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '未知';
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={() => !isEditing && onClick()}
    >
      {/* Header with Icon */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between">
          <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
            <Folder size={28} className="text-blue-600" />
          </div>
          
          {/* Actions Menu */}
          {(onEdit || onDelete) && !isEditing && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical size={16} />
              </button>
              
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Edit3 size={14} />
                        重命名
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        删除
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Category Name */}
        {isEditing ? (
          <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSubmit();
                if (e.key === 'Escape') handleEditCancel();
              }}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:border-primary outline-none"
              autoFocus
            />
            <button
              onClick={handleEditSubmit}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
            >
              <Check size={16} />
            </button>
            <button
              onClick={handleEditCancel}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <h3 className="mt-3 text-lg font-bold text-slate-800 truncate">{name}</h3>
        )}
      </div>

      {/* Stats */}
      <div className="px-5 py-3 bg-slate-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-slate-800">{count}</span>
            <span className="text-xs text-slate-500">条数据</span>
          </div>
          
          {(activeCount !== undefined || inactiveCount !== undefined) && (
            <div className="flex items-center gap-2 text-xs">
              {activeCount !== undefined && (
                <span className="px-2 py-1 bg-green-50 text-green-600 rounded-full">
                  {activeCount} 启用
                </span>
              )}
              {inactiveCount !== undefined && inactiveCount > 0 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                  {inactiveCount} 禁用
                </span>
              )}
            </div>
          )}
        </div>
        
        {lastUpdated && (
          <div className="mt-2 text-xs text-slate-400">
            更新于 {formatDate(lastUpdated)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryCard;
