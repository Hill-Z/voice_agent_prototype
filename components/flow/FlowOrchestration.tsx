
import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Phone, 
  Play, 
  Settings, 
  Save, 
  PhoneOff, 
  Database,
  GitBranch,
  Headset,
  Activity,
  X,
  Plus,
  Clock,
  MessageSquare,
  Globe,
  Calculator,
  ArrowLeft,
  MoreHorizontal,
  Zap,
  UserCog,
  Workflow,
  Smartphone,
  Mail,
  Search,
  CheckCircle2,
  AlertTriangle,
  Move,
  Regex,
  Music,
  Loader
} from 'lucide-react';
import { BotConfiguration, ExtractionConfig } from '../../types';
import { Select, Input, Label } from '../ui/FormComponents';
import { FlowScenario } from './FlowListPage';

// --- TYPES ---

type NodeType = 'TRIGGER' | 'AI_AGENT' | 'LOGIC' | 'ACTION' | 'DATA';

interface FlowNode {
  id: string;
  type: NodeType;
  subType: string;
  label: string;
  x: number;
  y: number;
  config?: any;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  branchId?: string;
}


// --- COMPONENT CONFIG ---

interface ToolboxItem {
  type: NodeType;
  subType: string;
  label: string;
  icon: any;
  tip: string;
}

const TOOLBOX_GROUPS: { name: string; color: string; items: ToolboxItem[] }[] = [
  {
    name: 'AI 劳动力 (Agents)',
    color: 'indigo',
    items: [
      { type: 'AI_AGENT', subType: 'agent', label: '通用 AI Agent', icon: Bot, tip: '核心对话节点。加载一个预配置的机器人（如“销售”、“客服”），拥有独立的人设、Prompt 和记忆。用于处理一段完整的业务对话。' },
      { type: 'AI_AGENT', subType: 'assistant', label: '任务型助理', icon: UserCog, tip: '轻量级任务节点。用于执行单一任务（如“收集收货地址”或“核本身份”），通常Prompt较短，任务完成后自动流转到下一节点。' }
    ]
  },
  {
    name: '逻辑控制 (Logic)',
    color: 'amber',
    items: [
      { type: 'LOGIC', subType: 'regex_match', label: '关键词/正则检测', icon: Search, tip: '【脊髓反射】在进入 LLM 前优先匹配关键词。用于快速拦截“转人工”、“挂机”指令，降低延迟并节省 Token。' },
      { type: 'LOGIC', subType: 'intent_router', label: '意图分流', icon: GitBranch, tip: 'AI 分诊台。根据用户说的话（如“我要报修”、“太贵了”），将流程引导至不同的分支路径。支持配置 N 个意图出口。' },
      { type: 'LOGIC', subType: 'condition', label: '条件判断', icon: Clock, tip: '硬逻辑判断。根据变量值（如：是否 VIP、欠费金额 > 500、当前时间是夜间）来决定流程走向。' },
      { type: 'LOGIC', subType: 'variable_set', label: '变量赋值', icon: Calculator, tip: '对全局变量进行数学运算或赋值操作，用于计数器或状态标记。' }
    ]
  },
  {
    name: '通信动作 (Actions)',
    color: 'rose',
    items: [
      { type: 'ACTION', subType: 'play_filler', label: '等待音/填充', icon: Loader, tip: '【防静默】在 API 调用或 Agent 切换间隙，播放“正在查询”的语音或背景轻音乐，防止用户因静默而挂机。' },
      { type: 'ACTION', subType: 'transfer', label: '转人工坐席', icon: Headset, tip: '转接 SIP/PSTN。将当前通话转接给人工客服技能组。支持配置转接失败后的兜底逻辑。' },
      { type: 'ACTION', subType: 'transfer_pstn', label: '转外部电话', icon: Smartphone, tip: '转接到外部手机或固话号码（PSTN）。常用于转接销售个人手机或第三方合作伙伴。' },
      { type: 'ACTION', subType: 'play_audio', label: '播放录音', icon: Play, tip: '播放静态音频。播放一段预录制的音频文件（如：法律免责声明、背景音乐），播放期间支持打断设置。' },
      { type: 'ACTION', subType: 'hangup', label: '挂机 / 结束', icon: PhoneOff, tip: '结束通话。主动挂断电话。可配置挂机前的礼貌结束语（Good-bye Message）。' }
    ]
  },
  {
    name: '数据集成 (Data)',
    color: 'blue',
    items: [
      { type: 'DATA', subType: 'http_request', label: 'HTTP 请求', icon: Globe, tip: '通用 API 调用。向外部系统发送 HTTP 请求（GET/POST）。常用于查询会员信息、提交工单、获取实时库存等。' },
      { type: 'DATA', subType: 'create_ticket', label: 'CRM 操作', icon: Database, tip: '系统集成快捷指令。快速执行 CRM 操作（如：创建销售线索、更新客户标签），无需配置复杂的 API 参数。' },
      { type: 'DATA', subType: 'sms', label: '发送短信', icon: Mail, tip: '触发短信通道，向当前用户发送挂机短信（如：预约成功通知、网页链接）。' }
    ]
  }
];

// --- COMPONENT ---

interface FlowOrchestrationProps {
  bots: BotConfiguration[];
  extractionConfigs: ExtractionConfig[];
  currentScenario: FlowScenario | null;
  onBack: () => void;
  onSave: (scenario: FlowScenario) => void;
}

export default function FlowOrchestration({ bots, extractionConfigs, currentScenario, onBack, onSave }: FlowOrchestrationProps) {
  // Editor State
  const [nodes, setNodes] = useState<FlowNode[]>(currentScenario?.nodes || []);
  const [edges, setEdges] = useState<FlowEdge[]>(currentScenario?.edges || []);
  
  // Viewport / Canvas State
  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Node Drag State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  
  // Tooltip State (Fixed Positioning)
  const [hoveredTool, setHoveredTool] = useState<{ item: ToolboxItem, rect: DOMRect } | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Update nodes and edges when currentScenario changes
  useEffect(() => {
    if (currentScenario) {
      setNodes(currentScenario.nodes);
      setEdges(currentScenario.edges);
      setViewport({ x: 0, y: 0 }); // Reset viewport
    }
  }, [currentScenario]);

  // --- Handlers ---

  const handleSaveScenario = () => {
    if (currentScenario) {
      const updated = {
        ...currentScenario,
        nodes,
        edges,
        lastUpdated: Date.now()
      };
      onSave(updated);
      alert("流程保存成功！");
    }
  };

  // --- Canvas & Interaction Logic ---

  const handleMouseDown = (e: React.MouseEvent) => {
    // If clicking on a node (handled by stopPropagation in node), this won't fire for panning
    if (e.button === 0) { // Left click
       setIsPanning(true);
       setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation(); // Prevent canvas panning
    setSelectedNodeId(nodeId);
    setIsDraggingNode(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    if (isPanning) {
      setViewport(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (isDraggingNode && selectedNodeId) {
      setNodes(prev => prev.map(n => 
        n.id === selectedNodeId ? { ...n, x: n.x + deltaX, y: n.y + deltaY } : n
      ));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingNode(false);
  };

  const updateNodeConfig = (key: string, value: any) => {
    if (!selectedNodeId) return;
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNodeId) {
        return { ...n, config: { ...n.config, [key]: value } };
      }
      return n;
    }));
  };

  // --- RENDER HELPERS ---

  const renderBezierCurve = (startNode: FlowNode, endNode: FlowNode) => {
    // Adjust coordinates by viewport
    const startX = startNode.x + viewport.x + 220; // 220 is roughly node width
    const startY = startNode.y + viewport.y + 42;  // 42 is roughly half node height
    const endX = endNode.x + viewport.x;
    const endY = endNode.y + viewport.y + 42;

    const cp1x = startX + 80;
    const cp1y = startY;
    const cp2x = endX - 80;
    const cp2y = endY;

    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  };

  const getNodeColor = (type: NodeType) => {
    switch(type) {
      case 'TRIGGER': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'AI_AGENT': return 'bg-indigo-50 border-indigo-200 text-indigo-700';
      case 'LOGIC': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'DATA': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'ACTION': return 'bg-rose-50 border-rose-200 text-rose-700';
      default: return 'bg-white border-gray-200';
    }
  };

  const getNodeIcon = (subType: string) => {
    // Helper to find icon in TOOLBOX_GROUPS
    for (const group of TOOLBOX_GROUPS) {
      const item = group.items.find(i => i.subType === subType);
      if (item) return <item.icon size={16} />;
    }
    return <Activity size={16} />;
  };

  // --- VIEW: EDITOR ---
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex h-full bg-slate-50 relative overflow-hidden flex-col">
      {/* Editor Toolbar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20 shadow-sm">
         <div className="flex items-center">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 mr-2">
               <ArrowLeft size={18} />
            </button>
            <div>
               <div className="text-sm font-bold text-slate-800 flex items-center">
                  {currentScenario?.name}
                  <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded border border-slate-200">
                     v1.3
                  </span>
               </div>
            </div>
         </div>
         <div className="flex items-center space-x-3">
             <div className="flex items-center text-xs text-slate-400 mr-4">
                <Move size={12} className="mr-1" />
                按住画布拖动
             </div>
             <button className="bg-white border border-gray-300 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50">
                <Play size={14} className="inline mr-1" /> 模拟测试
             </button>
             <button onClick={handleSaveScenario} className="bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-sky-600 shadow-sm">
                <Save size={14} className="inline mr-1" /> 保存发布
             </button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* 1. Sidebar Palette (Higher Z-index to cover canvas) */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col z-40 shadow-sm overflow-y-auto">
          <div className="p-4">
             <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">组件库</h2>
             
             <div className="space-y-6">
                {TOOLBOX_GROUPS.map((group, idx) => (
                  <div key={idx}>
                    <div className={`text-[10px] font-bold text-${group.color}-600 mb-2 flex items-center`}>
                       {group.name}
                    </div>
                    <div className="space-y-2">
                      {group.items.map((item, iIdx) => (
                        <div key={iIdx} className="group relative">
                          <div 
                            className={`bg-${group.color}-50 border border-${group.color}-100 p-2 rounded flex items-center text-[10px] text-${group.color}-700 cursor-move hover:shadow-md transition-all select-none`}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('nodeType', item.type);
                              e.dataTransfer.setData('subType', item.subType);
                            }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredTool({ item, rect });
                            }}
                            onMouseLeave={() => setHoveredTool(null)}
                          >
                            <item.icon size={14} className="mr-2" /> {item.label}
                          </div>
                          
                          {/* Note: Tooltip is now rendered outside via Portal/Fixed logic below */}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* 2. Main Canvas */}
        <div 
          className={`flex-1 relative bg-slate-50 overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
           {/* Grid Background with Viewport Offset */}
           <div 
              className="absolute inset-0 pointer-events-none opacity-[0.05]" 
              style={{ 
                backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', 
                backgroundSize: '20px 20px',
                backgroundPosition: `${viewport.x}px ${viewport.y}px`
              }}
           ></div>

           {/* SVG Layer for Edges */}
           <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {edges.map(edge => {
                const start = nodes.find(n => n.id === edge.source);
                const end = nodes.find(n => n.id === edge.target);
                if (!start || !end) return null;
                
                const path = renderBezierCurve(start, end);
                
                // Calculate midpoint for label
                const startX = start.x + viewport.x + 220;
                const startY = start.y + viewport.y + 42;
                const endX = end.x + viewport.x;
                const endY = end.y + viewport.y + 42;
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;
                
                return (
                  <g key={edge.id}>
                    <path d={path} stroke="#94a3b8" strokeWidth="2" fill="none" />
                    {edge.label && (
                      <foreignObject x={midX - 40} y={midY - 10} width="80" height="20">
                        <div className="bg-white border border-gray-200 text-[9px] text-slate-500 rounded px-1 text-center shadow-sm truncate">
                          {edge.label}
                        </div>
                      </foreignObject>
                    )}
                  </g>
                );
              })}
           </svg>

           {/* Nodes Layer */}
           <div className="absolute inset-0 w-full h-full z-10 pointer-events-none">
              {nodes.map(node => (
                <div 
                  key={node.id}
                  className={`absolute w-[220px] rounded-lg border-2 shadow-sm transition-all hover:shadow-md group pointer-events-auto bg-white ${getNodeColor(node.type)} ${selectedNodeId === node.id ? 'ring-2 ring-primary ring-offset-2 scale-105 z-50 shadow-lg' : ''}`}
                  style={{ 
                    left: node.x + viewport.x, 
                    top: node.y + viewport.y 
                  }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                >
                  {/* Input Handle */}
                  {node.type !== 'TRIGGER' && (
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-slate-300 rounded-full z-20 hover:border-primary transition-all"></div>
                  )}
                  
                  {/* Node Content */}
                  <div className="p-3">
                    <div className="flex items-center mb-1.5">
                      <div className="opacity-80 mr-2 p-1 rounded-md bg-white/50">
                        {getNodeIcon(node.subType)}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="text-xs font-bold truncate text-slate-800">{node.label}</div>
                         <div className="text-[9px] opacity-70 truncate uppercase tracking-wider font-medium">
                           {node.type === 'AI_AGENT' ? 'AI 智能体' : node.subType.replace('_', ' ')}
                         </div>
                      </div>
                    </div>
                    
                    {/* Bot Specific Info */}
                    {node.type === 'AI_AGENT' && node.config?.botId && (
                       <div className="mt-2 pt-2 border-t border-indigo-100 text-[10px] text-indigo-600 flex items-center">
                          <Zap size={10} className="mr-1 fill-current" />
                          已关联: {node.config.botId}
                       </div>
                    )}
                    
                    {/* Logic Specific Info */}
                    {node.subType === 'intent_router' && (
                       <div className="mt-2 pt-2 border-t border-amber-100">
                          <div className="flex flex-wrap gap-1">
                             {node.config?.branches?.slice(0, 3).map((b: string) => (
                                <span key={b} className="px-1.5 py-0.5 bg-white rounded text-[9px] text-amber-600 border border-amber-100">{b}</span>
                             ))}
                             {(node.config?.branches?.length || 0) > 3 && <span className="text-[9px] text-amber-400">...</span>}
                          </div>
                       </div>
                    )}
                    
                    {/* Regex Specific Info */}
                    {node.subType === 'regex_match' && node.config?.pattern && (
                       <div className="mt-2 pt-2 border-t border-amber-100 text-[10px] text-amber-700 font-mono truncate">
                          /{node.config.pattern}/
                       </div>
                    )}

                    {/* Filler Specific Info */}
                    {node.subType === 'play_filler' && (
                       <div className="mt-2 pt-2 border-t border-rose-100 text-[10px] text-rose-600 flex items-center">
                          <Music size={10} className="mr-1" />
                          {node.config?.text || '播放等待音...'}
                       </div>
                    )}
                    
                    {/* Data/Action Specific Info */}
                    {(node.type === 'DATA' || (node.type === 'ACTION' && node.subType !== 'play_filler')) && node.config && (
                       <div className="mt-2 pt-2 border-t border-gray-100 text-[9px] text-slate-400 truncate font-mono">
                          {node.subType === 'http_request' && 'POST /api/check'}
                          {node.subType === 'sms' && 'Template: booking'}
                          {node.subType === 'transfer' && `Queue: ${node.config.queue}`}
                          {node.subType === 'transfer_pstn' && `Tel: ${node.config.number}`}
                       </div>
                    )}
                  </div>

                  {/* Output Handle */}
                  {node.subType !== 'hangup' && (
                    <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-slate-300 rounded-full z-20 hover:border-primary transition-all"></div>
                  )}
                  
                  {/* Loopback indicator for complex flows (Visual Only) */}
                  {node.id === 'logic_loop' && (
                     <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full p-0.5 shadow-sm border border-white">
                        <CheckCircle2 size={10} />
                     </div>
                  )}
                </div>
              ))}
           </div>
        </div>

        {/* 3. Property Panel (Right Side) */}
        {selectedNode && (
          <div className="w-80 bg-white border-l border-gray-200 shadow-xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center text-slate-800 font-bold text-sm">
                 <Settings size={16} className="mr-2 text-primary" />
                 {selectedNode.label}
               </div>
               <button onClick={() => setSelectedNodeId(null)} className="text-slate-400 hover:text-slate-600">
                 <X size={18} />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
               <div>
                 <Label label="节点名称" />
                 <Input 
                   value={selectedNode.label}
                   onChange={(e) => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, label: e.target.value } : n))}
                 />
               </div>

               {/* --- Agent Configuration --- */}
               {selectedNode.type === 'AI_AGENT' && (
                 <>
                   <div className="bg-indigo-50 p-3 rounded text-xs text-indigo-700 mb-2 leading-relaxed">
                     <span className="font-bold">Agent 节点</span> 代表一个独立的对话智能体。配置特定的提示词和人设来处理专门的业务环节。
                   </div>
                   
                   <div>
                      <Label label="关联机器人配置 (Profile)" required />
                      <Select 
                        options={[{label: '请选择...', value: ''}, ...bots.map(b => ({label: b.name, value: b.id}))]} 
                        value={selectedNode.config?.botId}
                        onChange={(e) => updateNodeConfig('botId', e.target.value)}
                      />
                      <button className="text-xs text-primary hover:underline mt-1 flex items-center">
                         <Plus size={10} className="mr-1" /> 新建机器人配置
                      </button>
                   </div>

                   <div>
                      <Label label="交接摘要 (Handoff Summary)" tooltip="当流程转接到此 Agent 时，向其注入的上下文摘要。" />
                      <textarea 
                        className="w-full h-24 px-3 py-2 text-xs border border-gray-200 rounded outline-none resize-none bg-slate-50 focus:border-indigo-300"
                        placeholder="例如：用户已经验证过身份，当前情绪比较激动，需要重点安抚..."
                        value={selectedNode.config?.summary || ''}
                        onChange={(e) => updateNodeConfig('summary', e.target.value)}
                      />
                   </div>

                   <div>
                      <Label label="角色设定 (System Prompt Override)" />
                      <div className="text-[10px] text-slate-400 mb-1">可选。若填写则覆盖所选机器人的默认提示词。</div>
                      <textarea 
                        className="w-full h-32 px-3 py-2 text-xs border border-gray-200 rounded outline-none resize-none"
                        value={selectedNode.config?.systemPrompt || ''}
                        onChange={(e) => updateNodeConfig('systemPrompt', e.target.value)}
                      />
                   </div>
                 </>
               )}

               {/* --- Regex Logic Configuration --- */}
               {selectedNode.subType === 'regex_match' && (
                 <>
                   <div className="bg-amber-50 p-3 rounded text-xs text-amber-700 mb-2 leading-relaxed">
                     <span className="font-bold">脊髓反射</span> 优先于 LLM 运行。当用户输入匹配正则表达式时，直接触发后续动作，不消耗 LLM Token。
                   </div>
                   <Label label="正则/关键词 (Regex)" />
                   <textarea 
                      className="w-full h-20 px-3 py-2 text-xs border border-gray-200 rounded outline-none resize-none font-mono text-slate-700"
                      value={selectedNode.config?.pattern || ''}
                      onChange={(e) => updateNodeConfig('pattern', e.target.value)}
                      placeholder="(转人工|人工客服|找人)"
                    />
                    <Label label="匹配后动作" />
                    <Select 
                       options={[{label: '挂机', value: 'hangup'}, {label: '转接分支', value: 'branch'}]} 
                       value={selectedNode.config?.action || 'branch'}
                       onChange={(e) => updateNodeConfig('action', e.target.value)}
                    />
                 </>
               )}

               {/* --- Filler Configuration --- */}
               {selectedNode.subType === 'play_filler' && (
                 <>
                    <div className="bg-rose-50 p-3 rounded text-xs text-rose-700 mb-2 leading-relaxed">
                     <span className="font-bold">防静默处理</span> 在执行耗时操作（如转接或API调用）前播放音频，防止用户挂机。
                   </div>
                   <Label label="填充话术 (TTS)" />
                   <textarea 
                      className="w-full h-20 px-3 py-2 text-xs border border-gray-200 rounded outline-none resize-none"
                      value={selectedNode.config?.text || ''}
                      onChange={(e) => updateNodeConfig('text', e.target.value)}
                      placeholder="正在为您查询，请稍后..."
                    />
                    <Label label="背景音效 (Sound)" />
                    <Select 
                       options={[{label: '键盘敲击声', value: 'keyboard_typing'}, {label: '轻音乐 (BGM)', value: 'light_music'}, {label: '无', value: 'none'}]} 
                       value={selectedNode.config?.sound || 'keyboard_typing'}
                       onChange={(e) => updateNodeConfig('sound', e.target.value)}
                    />
                 </>
               )}

               {/* --- Logic Configuration --- */}
               {selectedNode.subType === 'intent_router' && (
                 <>
                   <Label label="分流意图定义" />
                   <div className="space-y-2">
                      {selectedNode.config?.branches?.map((b: string, i: number) => (
                        <div key={i} className="flex items-center space-x-2">
                           <div className="flex-1 px-3 py-2 bg-slate-50 border border-gray-200 rounded text-xs text-slate-700">
                              {b}
                           </div>
                           <button className="text-slate-300 hover:text-red-500"><X size={14}/></button>
                        </div>
                      ))}
                      <div className="flex items-center space-x-2">
                         <input className="flex-1 px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-primary" placeholder="输入新意图 (如: 查余额)" />
                         <button className="bg-slate-100 p-2 rounded text-slate-600 hover:bg-slate-200"><Plus size={14}/></button>
                      </div>
                   </div>
                 </>
               )}

               {selectedNode.subType === 'condition' && (
                 <>
                    <Label label="条件表达式" />
                    <textarea 
                      className="w-full h-20 px-3 py-2 text-xs border border-gray-200 rounded outline-none resize-none font-mono text-amber-700 bg-amber-50/30"
                      value={selectedNode.config?.condition || ''}
                      onChange={(e) => updateNodeConfig('condition', e.target.value)}
                      placeholder="e.g. warranty_status == true"
                    />
                    <div className="text-[9px] text-slate-400 mt-1">支持 JavaScript 语法表达式。</div>
                 </>
               )}
               
               {/* --- Data Configuration --- */}
               {selectedNode.subType === 'create_ticket' && (
                 <>
                    <Label label="关联 API" />
                    <Select 
                       options={[{label: '创建工单接口', value: 'ticket_create'}, {label: '查询用户信息', value: 'user_query'}]} 
                       value={selectedNode.config?.api || 'ticket_create'}
                       onChange={(e) => updateNodeConfig('api', e.target.value)}
                    />
                    <div className="mt-2 bg-blue-50 p-2 rounded border border-blue-100 text-[10px] text-blue-700 font-mono">
                       POST /api/v1/tickets
                    </div>
                 </>
               )}

               {selectedNode.subType === 'sms' && (
                 <>
                    <Label label="短信模板" />
                    <Select 
                       options={[{label: '维修预约通知', value: 'repair_booking'}, {label: '挂机挽留', value: 'callback_req'}]} 
                       value={selectedNode.config?.template || 'repair_booking'}
                       onChange={(e) => updateNodeConfig('template', e.target.value)}
                    />
                 </>
               )}

               {/* --- Transfer Configuration --- */}
               {selectedNode.subType === 'transfer' && (
                  <>
                     <Label label="目标技能组 (Queue)" />
                     <Select 
                        options={[{label: 'VIP 坐席', value: 'vip_queue'}, {label: '普通客服', value: 'general_queue'}, {label: '报价专员', value: 'quote_team'}]} 
                        value={selectedNode.config?.queue}
                        onChange={(e) => updateNodeConfig('queue', e.target.value)}
                     />
                     <Label label="转接失败兜底" />
                     <Select options={[{label: '挂机', value: 'hangup'}, {label: '留言', value: 'voicemail'}]} value="hangup" />
                  </>
               )}

               {selectedNode.subType === 'transfer_pstn' && (
                  <>
                     <Label label="目标号码" tooltip="支持变量插值，如 ${district_manager_phone}" />
                     <Input 
                        value={selectedNode.config?.number || ''}
                        onChange={(e) => updateNodeConfig('number', e.target.value)}
                        placeholder="e.g. 13800138000"
                     />
                     <div className="bg-rose-50 p-2 rounded border border-rose-100 text-[10px] text-rose-700 flex items-start">
                        <AlertTriangle size={12} className="mr-1 mt-0.5" />
                        此动作将产生 PSTN 通话费用，请确保线路余额充足。
                     </div>
                  </>
               )}

            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
              <button onClick={() => setSelectedNodeId(null)} className="px-4 py-2 border border-gray-300 bg-white text-slate-600 rounded text-xs font-bold hover:bg-slate-50">
                 完成
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FIXED TOOLTIP LAYER (To avoid z-index/overflow clipping) */}
      {hoveredTool && (
        <div 
           className="fixed z-[100] w-60 p-3 bg-slate-800 text-white text-[10px] rounded-lg shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-100"
           style={{
             left: hoveredTool.rect.right + 10,
             top: Math.min(hoveredTool.rect.top, window.innerHeight - 150) // Prevent going off bottom screen
           }}
        >
          <div className="font-bold mb-1.5 text-slate-200 border-b border-slate-600 pb-1.5 flex items-center">
             <hoveredTool.item.icon size={12} className="mr-1.5" />
             {hoveredTool.item.label}
          </div>
          <div className="leading-relaxed text-slate-300">
             {hoveredTool.item.tip}
          </div>
          {/* Arrow */}
          <div className="absolute top-4 -left-1 w-2 h-2 bg-slate-800 transform rotate-45"></div>
        </div>
      )}

    </div>
  );
}
