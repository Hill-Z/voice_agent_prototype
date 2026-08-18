
import React, { useState } from 'react';
import { 
  Bot, 
  LayoutDashboard, 
  Settings, 
  BarChart3, 
  Phone, 
  FileText,
  ChevronDown,
  ChevronRight,
  Bell,
  Workflow,
  Database,
  Mic,
  ShoppingBag,
  History,
  Clock,
  ShieldAlert,
  BookOpen,
  Disc,
  Link2,
  Server,
  MessageCircleQuestion,
  Lightbulb,
  BookA,
  Headset,
  Box,
  Music,
  MapPin,
  Route,
  PhoneForwarded,
  Contact,
  ClipboardList,
  MessageSquare,
  FolderOpen,
  Megaphone,
  CalendarClock,
  UserSquare,
  Code,
  Wrench,
  Brain
} from 'lucide-react';

interface SidebarProps {
  activeSubItem: string; 
  onNavigate: (item: string) => void;
}

interface MenuItem {
  type?: string;
  label: string;
  id?: string;
  icon?: any;
  subItems?: { label: string; id: string; icon?: any }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSubItem, onNavigate }) => {
  const [expandedMenu, setExpandedMenu] = useState<string | null>('外呼任务');

  const menuItems: MenuItem[] = [
    { type: 'header', label: '核心业务' },
    { icon: Headset, label: '智呼坐席管理', id: '智呼坐席管理' },
    { icon: Bot, label: '机器人配置', id: '机器人配置' },
    { icon: Wrench, label: '工具配置', id: '工具配置' },
    {
      icon: Brain,
      label: '客户记忆',
      id: '客户记忆',
      subItems: [
        { label: '记忆管理', id: '记忆管理', icon: Database },
        { label: '记忆配置', id: '记忆配置', icon: Settings }
      ]
    },
    { icon: UserSquare, label: '客户画像', id: '客户画像' },
    { icon: Megaphone, label: '营销活动', id: '营销活动' },
    {
      icon: CalendarClock,
      label: '自动跟进',
      id: '自动跟进',
      subItems: [
        { label: '跟进任务', id: '跟进任务', icon: ClipboardList },
        { label: '规则编排', id: '规则编排', icon: Workflow },
        { label: '跟进记录', id: '跟进记录', icon: History },
      ],
    },
    { 
      icon: PhoneForwarded, 
      label: '外呼任务', 
      id: '外呼任务',
      subItems: [
        { label: '外呼任务', id: '外呼任务列表', icon: ClipboardList },
        { label: '外呼模版', id: '外呼模版', icon: FileText },
        { label: '外呼联系单', id: '外呼联系单', icon: Contact }
      ]
    },
    { icon: History, label: '通话记录', id: '通话记录' },
    {
      icon: BarChart3,
      label: '监控报表',
      id: '监控报表',
      subItems: [
        { label: '综合报表', id: '监控报表', icon: BarChart3 },
        { label: '漏斗配置', id: '漏斗配置', icon: Route },
        { label: '事件配置', id: '事件配置', icon: Disc },
      ],
    },
    { icon: MessageSquare, label: '短信管理', id: '短信管理' },
    { icon: Workflow, label: '流程配置', id: '流程配置' },
    { icon: Code, label: '代码块', id: '函数管理' },
    { icon: Database, label: '信息提取配置', id: '信息提取配置' },
    
    { type: 'header', label: '资源市场' },
    { icon: Box, label: '机器人模版', id: '机器人模版' },
    { icon: Music, label: '音色市场', id: '音色市场' },

    { type: 'header', label: '知识与语料' },
    { icon: BookA, label: '词库管理', id: '词库管理' },
    { icon: MessageCircleQuestion, label: '问答对管理', id: '问答对管理' },
    { icon: Lightbulb, label: '知识发现', id: '知识发现' },
    
    { type: 'header', label: '基础设施' },
    { icon: Link2, label: '集成中心', id: '集成中心' },
    { icon: Server, label: '通信网关', id: '通信网关' },
    { 
      icon: Settings, 
      label: '系统设置', 
      id: '系统设置',
      subItems: [
        { label: '号码管理', id: '号码管理' },
        { label: 'IVR管理', id: 'IVR管理' },
        { label: '地理组合', id: '地理组合' },
        { label: '工作时间', id: '工作时间' },
        { label: '文件管理', id: '文件管理', icon: FolderOpen },
        { label: '模型训练', id: '模型训练' },
        { label: '参数设置', id: '参数设置' },
      ]
    },
  ];

  const toggleExpand = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  return (
    <aside className="w-[var(--layout-sidebar-width)] bg-[var(--color-sidebar-bg)] text-[var(--color-sidebar-text)] flex flex-col h-full border-r border-[var(--color-sidebar-border)]">
      <div className="h-[var(--layout-header-height)] flex items-center px-6 border-b border-[var(--color-sidebar-border)] font-bold text-[var(--color-sidebar-text-strong)] tracking-[0.08em] flex-shrink-0">
        AI VOICEDESK
      </div>
      <nav className="flex-1 overflow-y-auto py-4" aria-label="主导航">
        {menuItems.map((item, idx) => {
          if (item.type === 'header') {
            return (
              <div key={idx} className="px-6 h-7 flex items-center mt-2 text-[11px] font-bold text-[var(--component-nav-text-muted)] uppercase tracking-[0.08em]">
                {item.label}
              </div>
            );
          }

          const isActive = activeSubItem === item.id || (item.subItems && item.subItems.some(sub => sub.id === activeSubItem));
          const isExpanded = expandedMenu === item.label;

          return (
            <div key={idx} className="mb-1">
              <button
                type="button"
                onClick={() => item.subItems ? toggleExpand(item.label) : onNavigate(item.id!)}
                className={`relative w-full min-h-[var(--component-sidebar-group-height)] flex items-center px-6 rounded-[var(--component-sidebar-item-radius)] text-left transition-colors duration-[var(--motion-duration-base)] mx-2 max-w-[calc(100%-16px)] hover:bg-[var(--color-sidebar-hover-bg)] focus-visible:ring-0 ${isActive ? 'text-[var(--component-nav-active-text)] bg-[var(--component-nav-active-bg)]' : ''}`}
                aria-expanded={item.subItems ? isExpanded : undefined}
                aria-current={!item.subItems && isActive ? 'page' : undefined}
              >
                {isActive && <span className="absolute left-0 top-2 bottom-2 w-[var(--component-sidebar-indicator-width)] rounded-r-full bg-[var(--color-sidebar-indicator)]" />}
                {item.icon && <item.icon size={18} className={`mr-3 ${isActive ? 'text-[var(--color-semantic-primary)]' : 'text-[var(--color-sidebar-icon)]'}`} />}
                <span className={`text-sm font-semibold flex-1 ${isActive ? 'text-[var(--component-nav-active-text)]' : 'text-[var(--component-nav-text)]'}`}>{item.label}</span>
                {item.subItems && (
                  isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                )}
              </button>
              
              {/* Sub Menu */}
              {item.subItems && isExpanded && (
                <div className="pb-2 pt-1">
                  {item.subItems.map((sub, sIdx) => (
                    <button
                      type="button"
                      key={sIdx} 
                      onClick={() => onNavigate(sub.id)}
                      className={`w-full min-h-[var(--component-sidebar-item-height)] pl-[var(--component-sidebar-indent-level2)] pr-6 text-xs text-left rounded-[var(--component-sidebar-item-radius)] transition-colors duration-[var(--motion-duration-base)] flex items-center mx-2 max-w-[calc(100%-16px)] hover:bg-[var(--color-sidebar-hover-bg)] hover:text-[var(--color-sidebar-text-strong)] ${sub.id === activeSubItem ? 'text-[var(--color-semantic-primary)] font-semibold bg-[var(--color-sidebar-active-bg)]' : 'text-[var(--color-sidebar-text)]'}`}
                      aria-current={sub.id === activeSubItem ? 'page' : undefined}
                    >
                      {sub.icon && <sub.icon size={12} className="mr-2 opacity-70" />}
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export const Header: React.FC<{ title?: string }> = ({ title = "机器人配置" }) => {
  return (
    <header className="h-[var(--layout-header-height)] bg-[var(--component-header-bg)] border-b border-[var(--component-header-border)] backdrop-blur-[var(--component-topbar-blur)] flex items-center justify-between px-[var(--component-header-padding-x)] z-10 flex-shrink-0">
      <div className="flex items-center space-x-2 text-sm text-[var(--color-semantic-text-tertiary)]">
        <span className="cursor-pointer hover:text-[var(--color-semantic-primary)]">控制台</span>
        <span className="text-[var(--color-semantic-text-placeholder)]">/</span>
        <span className="text-[var(--color-semantic-text-primary)] font-semibold text-[var(--component-header-title-size)]">{title}</span>
      </div>
      <div className="flex items-center space-x-6">
        <button type="button" className="relative cursor-pointer h-9 w-9 rounded-[var(--radius-control)] flex items-center justify-center hover:bg-[var(--state-hover-bg)]" aria-label="通知">
          <Bell size={20} className="text-[var(--color-semantic-text-tertiary)]" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-[var(--color-semantic-danger)] rounded-full"></span>
        </button>
        <button type="button" className="flex items-center cursor-pointer rounded-[var(--radius-control)] px-2 py-1.5 hover:bg-[var(--state-hover-bg)]" aria-label="当前用户">
          <div className="h-8 w-8 bg-[var(--color-semantic-primary)] rounded-full flex items-center justify-center text-[var(--color-semantic-text-inverse)] font-bold text-xs mr-2">
            AD
          </div>
          <span className="text-sm text-[var(--color-semantic-text-secondary)] font-medium">Admin User</span>
        </button>
      </div>
    </header>
  );
};
