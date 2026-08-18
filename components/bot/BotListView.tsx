
// 机器人方案列表，展示配置基本信息和版本状态，并把编辑、版本查看等操作交给上层页面处理。
import React, { useMemo, useState } from 'react';
import { Settings2, Trash2, Plus, History, Search, SlidersHorizontal } from 'lucide-react';
import { BotConfiguration } from '../../types';

interface BotListViewProps {
  bots: BotConfiguration[];
  onEdit: (bot: BotConfiguration) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onViewVersions?: (bot: BotConfiguration) => void;
}

const versionBadgeClass = (type?: BotConfiguration['currentVersionType']) => {
  if (type === 'draft') return 'bg-[var(--color-semantic-warning-soft)] text-[var(--color-semantic-warning)] border-[var(--color-amber-100)]';
  if (type === 'published') return 'bg-[var(--color-semantic-success-soft)] text-[var(--color-semantic-success)] border-[var(--color-green-100)]';
  return 'bg-[var(--color-semantic-bg-subtle)] text-[var(--color-semantic-text-tertiary)] border-[var(--color-semantic-border-subtle)]';
};

// 展示当前配置状态：草稿、已发布或空状态。
const currentVersionText = (bot: BotConfiguration) => {
  if (bot.currentVersionType === 'draft') return '草稿';
  if (bot.currentVersionType === 'published') return bot.onlineVersion || bot.currentVersion || '-';
  return bot.currentVersion || '—';
};

const currentVersionLabel = (bot: BotConfiguration) => {
  if (bot.currentVersionType === 'draft') return '未发布';
  if (bot.currentVersionType === 'published') return '已发布';
  return '无当前版本';
};

const BotListView: React.FC<BotListViewProps> = ({ bots, onEdit, onDelete, onCreate, onViewVersions }) => {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  const visibleBots = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return bots.filter((bot) => {
      const matchesKeyword = !normalizedKeyword || [bot.name, bot.description, bot.llmType, bot.currentVersion, bot.onlineVersion]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedKeyword));
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'enabled' ? bot.status : !bot.status);
      return matchesKeyword && matchesStatus;
    });
  }, [bots, keyword, statusFilter]);

  return (
    <div className="px-[var(--layout-content-padding-x)] py-[var(--layout-content-padding-y)] max-w-[var(--layout-panel-max-width)] mx-auto w-full space-y-5">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-[var(--typography-size-headline)] font-bold text-[var(--color-semantic-text-primary)] tracking-tight">机器人方案管理</h1>
          <p className="text-sm text-[var(--color-semantic-text-tertiary)] mt-1">创建、维护和发布语音 Agent 配置方案。</p>
        </div>
        <button
          onClick={onCreate}
          className="h-[var(--component-button-height-md)] bg-[var(--color-semantic-primary)] text-[var(--color-semantic-text-inverse)] px-4 rounded-[var(--component-button-radius)] font-semibold text-sm hover:bg-[var(--color-semantic-primary-hover)] transition-colors flex items-center shadow-[var(--shadow-xs)]"
        >
          <Plus size={16} className="mr-2" /> 新建配置方案
        </button>
      </div>

      <div className="bg-[var(--color-semantic-bg-surface)] rounded-[var(--component-card-radius)] border border-[var(--color-semantic-border-default)] shadow-[var(--shadow-xs)] overflow-hidden">
        <div className="min-h-[var(--component-filter-toolbar-height)] px-4 py-3 border-b border-[var(--color-semantic-border-subtle)] flex flex-wrap items-center justify-between gap-3 bg-[var(--component-filter-toolbar-bg)]">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-[var(--component-search-width-lg)] max-w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-semantic-text-placeholder)]" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="w-full h-[var(--component-search-height)] pl-9 pr-3 rounded-[var(--component-search-radius)] border border-[var(--color-semantic-border-default)] bg-[var(--color-semantic-bg-surface)] text-sm outline-none hover:border-[var(--color-semantic-border-strong)] focus:border-[var(--color-semantic-border-focus)]"
                placeholder="搜索名称 / 描述 / 模型 / 版本"
              />
            </div>
            <div className="flex items-center gap-1 rounded-[var(--radius-control)] bg-[var(--color-semantic-bg-subtle)] p-1">
              {[
                { id: 'all', label: '全部' },
                { id: 'enabled', label: '已启用' },
                { id: 'disabled', label: '待启用' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setStatusFilter(item.id as typeof statusFilter)}
                  className={`h-8 px-3 rounded-[var(--radius-md)] text-xs font-semibold transition-colors ${statusFilter === item.id ? 'bg-[var(--color-semantic-bg-surface)] text-[var(--color-semantic-primary)] shadow-[var(--shadow-xs)]' : 'text-[var(--color-semantic-text-tertiary)] hover:text-[var(--color-semantic-text-primary)]'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-semantic-text-tertiary)]">
            <SlidersHorizontal size={14} /> 共 {visibleBots.length} 个方案
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left">
            <thead className="bg-[var(--component-table-header-bg)] border-b border-[var(--component-table-border)]">
              <tr>
                <th className="px-[var(--component-table-cell-padding-x)] py-3 text-xs font-bold text-[var(--color-semantic-text-tertiary)] uppercase tracking-[0.08em] w-[220px]">名称</th>
                <th className="px-[var(--component-table-cell-padding-x)] py-3 text-xs font-bold text-[var(--color-semantic-text-tertiary)] uppercase tracking-[0.08em]">描述</th>
                <th className="px-[var(--component-table-cell-padding-x)] py-3 text-xs font-bold text-[var(--color-semantic-text-tertiary)] uppercase tracking-[0.08em]">当前版本</th>
                <th className="px-[var(--component-table-cell-padding-x)] py-3 text-xs font-bold text-[var(--color-semantic-text-tertiary)] uppercase tracking-[0.08em]">已发布版本</th>
                <th className="px-[var(--component-table-cell-padding-x)] py-3 text-xs font-bold text-[var(--color-semantic-text-tertiary)] uppercase tracking-[0.08em]">状态</th>
                <th className="px-[var(--component-table-cell-padding-x)] py-3 text-xs font-bold text-[var(--color-semantic-text-tertiary)] uppercase tracking-[0.08em]">引擎</th>
                <th className="px-[var(--component-table-cell-padding-x)] py-3 text-xs font-bold text-[var(--color-semantic-text-tertiary)] uppercase tracking-[0.08em]">更新时间</th>
                <th className="px-[var(--component-table-cell-padding-x)] py-3 text-xs font-bold text-[var(--color-semantic-text-tertiary)] uppercase tracking-[0.08em] text-right sticky right-0 bg-[var(--component-table-header-bg)]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--component-table-border)]">
              {visibleBots.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-[var(--component-empty-padding-y)] text-center text-[var(--color-semantic-text-tertiary)]">
                    <div className="flex flex-col items-center max-w-sm mx-auto">
                      <div className="w-12 h-12 bg-[var(--color-semantic-bg-subtle)] rounded-full flex items-center justify-center mb-3">
                        <Settings2 size={24} className="opacity-30" />
                      </div>
                      <p className="text-sm font-semibold text-[var(--color-semantic-text-secondary)]">暂无匹配方案</p>
                      <p className="text-xs mt-1">请清空搜索条件，或新建一个配置方案。</p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleBots.map(bot => (
                  <tr key={bot.id} className="h-[var(--component-table-row-height)] hover:bg-[var(--color-semantic-bg-row-hover)] transition-colors group">
                    <td className="px-[var(--component-table-cell-padding-x)] py-[var(--component-table-cell-padding-y)]">
                      <div className="font-bold text-[var(--color-semantic-text-primary)] truncate max-w-[200px]" title={bot.name || '未命名'}>{bot.name || '未命名'}</div>
                      <div className="text-xs text-[var(--color-semantic-text-tertiary)] font-mono mt-1">ID {bot.id}</div>
                    </td>
                    <td className="px-[var(--component-table-cell-padding-x)] py-[var(--component-table-cell-padding-y)]">
                      <div className="text-sm text-[var(--color-semantic-text-secondary)] truncate max-w-xs" title={bot.description}>{bot.description || '-'}</div>
                    </td>
                    <td className="px-[var(--component-table-cell-padding-x)] py-[var(--component-table-cell-padding-y)]">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-[var(--color-semantic-text-primary)]">{currentVersionText(bot)}</span>
                        <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded-[var(--component-badge-radius)] border text-xs font-medium ${versionBadgeClass(bot.currentVersionType)}`}>{currentVersionLabel(bot)}</span>
                      </div>
                    </td>
                    <td className="px-[var(--component-table-cell-padding-x)] py-[var(--component-table-cell-padding-y)]">
                      {bot.onlineVersion ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold text-[var(--color-semantic-text-primary)]">{bot.onlineVersion}</span>
                          <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-[var(--component-badge-radius)] border text-xs font-medium bg-[var(--color-semantic-success-soft)] text-[var(--color-semantic-success)] border-[var(--color-green-100)]">生效中</span>
                        </div>
                      ) : <span className="text-sm text-[var(--color-semantic-text-placeholder)]">未发布</span>}
                    </td>
                    <td className="px-[var(--component-table-cell-padding-x)] py-[var(--component-table-cell-padding-y)]">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-[var(--component-badge-radius)] text-xs font-medium border ${bot.status ? 'bg-[var(--color-semantic-success-soft)] text-[var(--color-semantic-success)] border-[var(--color-green-100)]' : 'bg-[var(--color-semantic-bg-subtle)] text-[var(--color-semantic-text-tertiary)] border-[var(--color-semantic-border-subtle)]'}`}>{bot.status ? '已启用' : '待启用'}</span>
                    </td>
                    <td className="px-[var(--component-table-cell-padding-x)] py-[var(--component-table-cell-padding-y)] text-sm text-[var(--color-semantic-text-secondary)] font-mono">{bot.llmType}</td>
                    <td className="px-[var(--component-table-cell-padding-x)] py-[var(--component-table-cell-padding-y)] text-sm text-[var(--color-semantic-text-tertiary)]">{new Date(bot.lastUpdated).toLocaleDateString()}</td>
                    <td className="px-[var(--component-table-cell-padding-x)] py-[var(--component-table-cell-padding-y)] text-right sticky right-0 bg-[var(--color-semantic-bg-surface)] group-hover:bg-[var(--color-semantic-bg-row-hover)]">
                      <div className="flex justify-end space-x-1">
                        <button title="编辑" aria-label={`编辑 ${bot.name || '机器人'}`} onClick={() => onEdit(bot)} className="p-2 text-[var(--color-semantic-text-tertiary)] hover:text-[var(--color-semantic-primary)] hover:bg-[var(--color-semantic-primary-soft)] rounded-[var(--radius-md)] transition-colors"><Settings2 size={17} /></button>
                        <button title="版本" aria-label={`查看 ${bot.name || '机器人'} 版本`} onClick={() => onViewVersions?.(bot)} className="p-2 text-[var(--color-semantic-text-tertiary)] hover:text-[var(--color-semantic-primary)] hover:bg-[var(--color-semantic-primary-soft)] rounded-[var(--radius-md)] transition-colors"><History size={17} /></button>
                        <button title="删除" aria-label={`删除 ${bot.name || '机器人'}`} onClick={() => onDelete(bot.id)} className="p-2 text-[var(--color-semantic-text-tertiary)] hover:text-[var(--color-semantic-danger)] hover:bg-[var(--color-semantic-danger-soft)] rounded-[var(--radius-md)] transition-colors"><Trash2 size={17} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BotListView;
