import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { Wrench, Code, Variable, Workflow, Maximize2, X } from 'lucide-react';
import type { AgentTool, FlowFunction } from '../../types';

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variables?: { name: string; description?: string }[];
  availableTools?: AgentTool[];
  availableFunctions?: FlowFunction[];
  availableFlows?: Array<{ id: string; name: string; description?: string }>;
  height?: string;
  enableFullscreen?: boolean;
  fullscreenTitle?: string;
  autoFocus?: boolean;
}

interface ItemData {
  type: 'variable' | 'tool' | 'codeblock' | 'flow';
  id: string;
  name: string;
  displayText: string;
  desc: string;
}

const CHIP_CLASS: Record<string, string> = {
  variable: 'inline-flex items-center gap-1 px-1.5 py-0 rounded text-[11px] font-mono border bg-emerald-100 text-emerald-700 border-emerald-200',
  tool: 'inline-flex items-center gap-1 px-1.5 py-0 rounded text-[11px] font-mono border bg-primary/10 text-primary border-primary/20',
  codeblock: 'inline-flex items-center gap-1 px-1.5 py-0 rounded text-[11px] font-mono border bg-blue-500/10 text-blue-600 border-blue-200',
  flow: 'inline-flex items-center gap-1 px-1.5 py-0 rounded text-[11px] font-mono border bg-purple-100 text-purple-700 border-purple-200',
};

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function PromptEditor({
  value,
  onChange,
  placeholder = '设定此节点的具体人设和行为规范...',
  variables = [],
  availableTools = [],
  availableFunctions = [],
  availableFlows = [],
  height = 'h-40',
  enableFullscreen = false,
  fullscreenTitle = '编辑提示词',
  autoFocus = false,
}: PromptEditorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const editorRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const valueFromExternalRef = useRef(value);
  const skipNextInputRef = useRef(false);
  const hasInitializedEditorRef = useRef(false);
  const fullscreenTitleId = useId();

  const allItems: ItemData[] = [
    ...variables.map(v => ({ type: 'variable' as const, id: v.name, name: v.name, displayText: `{{${v.name}}}`, desc: v.description || '' })),
    ...availableTools.map(t => ({ type: 'tool' as const, id: t.id, name: t.name, displayText: `/${t.name}`, desc: t.description || '' })),
    ...availableFunctions.map(f => ({ type: 'codeblock' as const, id: f.id, name: f.name, displayText: `/${f.name}`, desc: f.description || '' })),
    ...availableFlows.map(f => ({ type: 'flow' as const, id: f.id, name: f.name, displayText: `/flow:${f.name}`, desc: f.description || '' }))
  ];

  const filteredItems = searchQuery
    ? allItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allItems;

  const buildHtml = useCallback((text: string): string => {
    if (!text) return '';
    const parts: { type: 'text' | 'chip'; itemType?: string; itemName?: string; content: string }[] = [];
    let remaining = text;

    const patterns = [
      { type: 'variable' as const, regex: /\{\{(\w+)\}\}/ },
      { type: 'tool' as const, regex: /\/([a-zA-Z_]\w*)/ },
      { type: 'codeblock' as const, regex: /\/([a-zA-Z_]\w*)/ },
      { type: 'flow' as const, regex: /\/flow:([a-zA-Z_]\w*)/ },
    ];

    while (remaining.length > 0) {
      let earliestIdx = Infinity;
      let earliestMatch: { type: string; match: RegExpExecArray; end: number } | null = null;

      for (const p of patterns) {
        p.regex.lastIndex = 0;
        const m = p.regex.exec(remaining);
        if (m && m.index < earliestIdx) {
          if (p.type === 'tool' && !availableTools.find(t => t.name === m[1])) continue;
          if (p.type === 'codeblock') {
            if (!availableFunctions.find(f => f.name === m[1])) continue;
            if (availableTools.find(t => t.name === m[1])) continue;
          }
          if (p.type === 'flow' && !availableFlows.find(f => f.name === m[1])) continue;
          earliestIdx = m.index;
          earliestMatch = { type: p.type, match: m, end: m.index + m[0].length };
        }
      }

      if (earliestMatch) {
        if (earliestIdx > 0) {
          parts.push({ type: 'text', content: remaining.substring(0, earliestIdx) });
        }
        parts.push({
          type: 'chip',
          itemType: earliestMatch.type,
          itemName: earliestMatch.match[1],
          content: earliestMatch.match[0],
        });
        remaining = remaining.substring(earliestMatch.end);
      } else {
        parts.push({ type: 'text', content: remaining });
        break;
      }
    }

    return parts.map(p => {
      if (p.type === 'text') return escapeHtml(p.content).replace(/\n/g, '<br>');
      const iconMap: Record<string, string> = {
        variable: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>`,
        tool: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
        codeblock: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
        flow: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
      };
      return `<span contenteditable="false" class="${CHIP_CLASS[p.itemType!]}" data-ref="${escapeHtml(p.content)}">${iconMap[p.itemType!]}${escapeHtml(p.itemName!)}<span class="ml-px cursor-pointer opacity-60 hover:opacity-100 hover:text-red-500" data-remove="true"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></span>`;
    }).join('');
  }, [availableTools, availableFunctions, availableFlows]);

  const saveCursorPos = useCallback((): Range | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    return sel.getRangeAt(0).cloneRange();
  }, []);

  const restoreCursorPos = useCallback((savedRange: Range) => {
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(savedRange);
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    if (!hasInitializedEditorRef.current) {
      hasInitializedEditorRef.current = true;
      valueFromExternalRef.current = value;
      el.innerHTML = buildHtml(value);
      return;
    }

    if (value === valueFromExternalRef.current) return;
    valueFromExternalRef.current = value;

    const savedRange = saveCursorPos();
    el.innerHTML = buildHtml(value);
    if (savedRange) {
      try { restoreCursorPos(savedRange); } catch {}
    }
  }, [value, buildHtml, placeholder, saveCursorPos, restoreCursorPos]);

  useEffect(() => {
    if (!autoFocus) return;
    const animationFrame = window.requestAnimationFrame(() => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [autoFocus]);

  useEffect(() => {
    if (!isFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isFullscreen]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    if (!showDropdown) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        editorRef.current &&
        !editorRef.current.contains(target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const extractPlainText = (el: HTMLElement): string => {
    let text = '';
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
    let node: Node | null;
    while ((node = walk.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const elem = node as HTMLElement;
        if (elem.tagName === 'BR') text += '\n';
        else if (elem.dataset.ref) text += elem.dataset.ref;
      }
    }
    return text;
  };

  const getCursorPixelPosition = (): { top: number; left: number } | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0).cloneRange();
    range.collapse(false);
    const rect = range.getBoundingClientRect();
    // 返回相对于视口的位置，因为下拉菜单使用 fixed 定位
    return {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    };
  };

  const handleInput = () => {
    if (skipNextInputRef.current) {
      skipNextInputRef.current = false;
      return;
    }

    const el = editorRef.current;
    if (!el) return;
    const plainText = extractPlainText(el);

    valueFromExternalRef.current = plainText;
    onChange(plainText);

    if (showDropdown) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const beforeCursor = extractPlainTextUpTo(el, range.startContainer, range.startOffset);
        const lastSlashIdx = beforeCursor.lastIndexOf('/');
        if (lastSlashIdx !== -1) {
          const query = beforeCursor.substring(lastSlashIdx + 1);
          if (query.includes(' ') || query.includes('\n')) {
            setShowDropdown(false);
          } else {
            setSearchQuery(query);
            setSelectedIndex(0);
            const pos = getCursorPixelPosition();
            if (pos) setDropdownPos(pos);
          }
        } else {
          setShowDropdown(false);
        }
      }
    }
  };

  function extractPlainTextUpTo(root: Node, container: Node, offset: number): string {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node) => {
        if (node === container) return NodeFilter.FILTER_ACCEPT;
        if (root.contains(node)) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_REJECT;
      }
    });
    let result = '';
    let node: Node | null;
    let reached = false;
    while ((node = walker.nextNode())) {
      if (node === container) {
        reached = true;
        if (node.nodeType === Node.TEXT_NODE) {
          result += (node.textContent || '').substring(0, offset);
        } else {
          const childNodes = (node as Element).childNodes;
          let count = 0;
          for (const cn of childNodes) {
            if (cn.nodeType === Node.ELEMENT_NODE && (cn as HTMLElement).dataset.ref) {
              result += (cn as HTMLElement).dataset.ref || '';
              count++;
            } else if (cn.nodeType === Node.TEXT_NODE) {
              result += cn.textContent || '';
              count++;
            }
            if (count >= offset) break;
          }
        }
        break;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.dataset.ref) result += el.dataset.ref;
        else if (el.tagName === 'BR') result += '\n';
      }
    }
    if (!reached && container === root) {
      const children = (root as Element).childNodes;
      let count = 0;
      for (const cn of children) {
        if (cn.nodeType === Node.ELEMENT_NODE && (cn as HTMLElement).dataset.ref) {
          result += (cn as HTMLElement).dataset.ref || '';
          count++;
        } else if (cn.nodeType === Node.TEXT_NODE) {
          result += cn.textContent || '';
          count++;
        } else if (cn.nodeType === Node.ELEMENT_NODE && (cn as Element).tagName === 'BR') {
          result += '\n';
          count++;
        }
        if (count >= offset) break;
      }
    }
    return result;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // 处理 / 键触发下拉菜单
    if (e.key === '/' && !showDropdown) {
      e.preventDefault();
      e.stopPropagation();
      
      const el = editorRef.current;
      if (el) {
        // 获取光标位置
        const cursorPos = getCursorPixelPosition();
        // 如果获取不到光标位置，使用编辑器位置
        const rect = el.getBoundingClientRect();
        const pos = cursorPos || {
          top: rect.top + window.scrollY + 35,
          left: rect.left + window.scrollX + 10
        };
        
        setDropdownPos(pos);
        setShowDropdown(true);
        setSearchQuery('');
        setSelectedIndex(0);
        insertCharAtCursor('/');
      }
      return;
    }

    if (showDropdown) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
        setSearchQuery('');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) insertItem(filteredItems[selectedIndex]);
      } else if (e.key === 'Backspace' && searchQuery.length === 0) {
        setShowDropdown(false);
      }
    }
  };

  function insertCharAtCursor(char: string) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(char);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    skipNextInputRef.current = true;
  }

  const insertItem = (item: ItemData) => {
    const el = editorRef.current;
    if (!el) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    const beforeCursor = extractPlainTextUpTo(el, range.startContainer, range.startOffset);
    const afterCursor = value.substring(beforeCursor.length + 1);
    const lastSlashIdx = beforeCursor.lastIndexOf('/');
    const beforeSlash = beforeCursor.substring(0, lastSlashIdx);

    const newValue = beforeSlash + item.displayText + ' ' + afterCursor;
    valueFromExternalRef.current = newValue;
    onChange(newValue);
    setShowDropdown(false);
    setSearchQuery('');

    skipNextInputRef.current = true;

    setTimeout(() => {
      const newEl = editorRef.current;
      if (!newEl) return;
      newEl.innerHTML = buildHtml(newValue);
      const newPos = beforeSlash.length + item.displayText.length + 1;

      const restoreCursor = (node: Node, targetPos: number): boolean => {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        let currentPos = 0;
        let n: Node | null;
        while ((n = walker.nextNode())) {
          if (n.nodeType === Node.TEXT_NODE) {
            const len = n.textContent?.length || 0;
            if (currentPos + len >= targetPos) {
              const r = document.createRange();
              r.setStart(n, targetPos - currentPos);
              r.collapse(true);
              const s = window.getSelection();
              if (s) { s.removeAllRanges(); s.addRange(r); }
              return true;
            }
            currentPos += len;
          } else if (n.nodeType === Node.ELEMENT_NODE) {
            const en = n as HTMLElement;
            if (en.dataset.ref) {
              const refLen = en.dataset.ref.length;
              if (currentPos + refLen >= targetPos) {
                const r = document.createRange();
                r.setStartAfter(en);
                r.collapse(true);
                const s = window.getSelection();
                if (s) { s.removeAllRanges(); s.addRange(r); }
                return true;
              }
              currentPos += refLen;
            }
          }
        }
        const r = document.createRange();
        r.selectNodeContents(node);
        r.collapse(false);
        const s = window.getSelection();
        if (s) { s.removeAllRanges(); s.addRange(r); }
        return true;
      };

      restoreCursor(newEl, newPos);
      newEl.focus();
    }, 0);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-remove]')) {
      e.preventDefault();
      e.stopPropagation();
      const chipSpan = target.closest('[data-ref]') as HTMLElement;
      if (chipSpan && chipSpan.dataset.ref) {
        const refText = chipSpan.dataset.ref;
        const idx = value.indexOf(refText);
        if (idx !== -1) {
          const newValue = value.substring(0, idx) + value.substring(idx + refText.length);
          valueFromExternalRef.current = newValue;
          onChange(newValue);
        }
      }
      return;
    }
  };

  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        editorRef.current && !editorRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  useEffect(() => {
    if (showDropdown && selectedIndex < filteredItems.length) {
      const el = dropdownRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, showDropdown, filteredItems.length]);

  // 手动触发下拉菜单
  const handleManualTrigger = () => {
    const el = editorRef.current;
    if (!el) return;
    
    // 聚焦编辑器
    el.focus();
    
    // 获取编辑器的位置
    const rect = el.getBoundingClientRect();
    
    // 在编辑器左上角显示下拉菜单（在编辑器内部）
    const pos = {
      top: rect.top + window.scrollY + 35, // 在编辑器顶部下方
      left: rect.left + window.scrollX + 10 // 稍微偏右一点
    };
    
    // 先插入 / 字符
    insertCharAtCursor('/');
    
    // 显示下拉菜单
    setDropdownPos(pos);
    setShowDropdown(true);
    setSearchQuery('');
    setSelectedIndex(0);
  };

  return (
    <div className="relative">
      <div className="flex justify-end gap-1 mb-1">
        {enableFullscreen ? (
          <button
            type="button"
            onClick={() => {
              setShowDropdown(false);
              setIsFullscreen(true);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="全屏编辑提示词"
            aria-label="全屏编辑提示词"
          >
            <Maximize2 size={14} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleManualTrigger}
          className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors flex items-center gap-1"
          title="插入变量、工具或函数"
        >
          <span className="font-mono">/</span> 插入
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        data-placeholder={placeholder}
        className={`prompt-editor-content w-full ${height} px-3 py-2 text-xs border border-gray-200 rounded resize-none focus:border-primary outline-none leading-relaxed font-mono overflow-auto whitespace-pre-wrap break-words`}
        spellCheck={false}
        suppressContentEditableWarning
      />

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="fixed bg-white rounded-lg shadow-xl border border-slate-200 py-2 max-h-64 overflow-y-auto"
          style={{ 
            top: dropdownPos.top + 4, 
            left: dropdownPos.left, 
            minWidth: '280px',
            zIndex: 99999
          }}
        >
          <div className="px-3 pb-2 border-b border-slate-100">
            <input
              type="text"
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedIndex(0); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded outline-none focus:border-primary"
              autoFocus
            />
          </div>

          {filteredItems.length === 0 ? (
            <div className="px-3 py-4 text-xs text-slate-400 text-center">无匹配项</div>
          ) : (
            <>
              {filteredItems.filter(i => i.type === 'variable').length > 0 && (
                <div className="pt-1">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Variable size={10} /> 变量
                  </div>
                  {filteredItems.filter(i => i.type === 'variable').map((item) => {
                    const globalIdx = filteredItems.indexOf(item);
                    return (
                      <button
                        key={item.id}
                        data-index={globalIdx}
                        onClick={() => insertItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full px-3 py-2 text-xs text-left flex items-center gap-2 ${globalIdx === selectedIndex ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                      >
                        <span className="font-mono text-emerald-600 font-medium">{item.displayText}</span>
                        {item.desc && <span className="text-slate-400 truncate ml-1">{item.desc}</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredItems.filter(i => i.type === 'tool').length > 0 && (
                <div className="pt-1">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Wrench size={10} /> 工具
                  </div>
                  {filteredItems.filter(i => i.type === 'tool').map((item) => {
                    const globalIdx = filteredItems.indexOf(item);
                    return (
                      <button
                        key={item.id}
                        data-index={globalIdx}
                        onClick={() => insertItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full px-3 py-2 text-xs text-left flex items-center gap-2 ${globalIdx === selectedIndex ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                      >
                        <span className="font-mono text-primary font-medium">{item.displayText}</span>
                        {item.desc && <span className="text-slate-400 truncate ml-1">{item.desc}</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredItems.filter(i => i.type === 'codeblock').length > 0 && (
                <div className="pt-1">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Code size={10} /> 代码块
                  </div>
                  {filteredItems.filter(i => i.type === 'codeblock').map((item) => {
                    const globalIdx = filteredItems.indexOf(item);
                    return (
                      <button
                        key={item.id}
                        data-index={globalIdx}
                        onClick={() => insertItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full px-3 py-2 text-xs text-left flex items-center gap-2 ${globalIdx === selectedIndex ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                      >
                        <span className="font-mono text-blue-600 font-medium">{item.displayText}</span>
                        {item.desc && <span className="text-slate-400 truncate ml-1">{item.desc}</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredItems.filter(i => i.type === 'flow').length > 0 && (
                <div className="pt-1">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Workflow size={10} /> 流程
                  </div>
                  {filteredItems.filter(i => i.type === 'flow').map((item) => {
                    const globalIdx = filteredItems.indexOf(item);
                    return (
                      <button
                        key={item.id}
                        data-index={globalIdx}
                        onClick={() => insertItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full px-3 py-2 text-xs text-left flex items-center gap-2 ${globalIdx === selectedIndex ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                      >
                        <span className="font-mono text-purple-600 font-medium">{item.displayText}</span>
                        {item.desc && <span className="text-slate-400 truncate ml-1">{item.desc}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {isFullscreen && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="prompt-editor-fullscreen-backdrop fixed inset-0 z-[99998] flex items-center justify-center bg-slate-950/40 p-4 sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby={fullscreenTitleId}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setIsFullscreen(false);
              }}
            >
              <section className="prompt-editor-fullscreen-panel flex h-[calc(100dvh-2rem)] w-full max-w-[1440px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl sm:h-[calc(100dvh-3rem)]">
                <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-5">
                  <h2 id={fullscreenTitleId} className="text-sm font-semibold text-slate-800">{fullscreenTitle}</h2>
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    title="关闭全屏编辑"
                    aria-label="关闭全屏编辑"
                  >
                    <X size={17} />
                  </button>
                </header>
                <div className="min-h-0 flex-1 p-4 sm:p-5">
                  <PromptEditor
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    variables={variables}
                    availableTools={availableTools}
                    availableFunctions={availableFunctions}
                    availableFlows={availableFlows}
                    height="h-[calc(100dvh-10rem)] sm:h-[calc(100dvh-11rem)]"
                    enableFullscreen={false}
                    fullscreenTitle={fullscreenTitle}
                    autoFocus
                  />
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
