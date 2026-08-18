// 工具配置页，承接工具定义与工具专属业务配置入口。
import React, { useMemo, useState } from 'react';
import { Edit3, Link, Plus, Power, Search, Settings2, Trash2, Wrench } from 'lucide-react';
import { AgentTool, BotConfiguration, BotVariable, ExtractionConfig, PricingRule, PricingRuleType, PricingTable } from '../../types';
import AgentToolModal from '../bot/agent/AgentToolModal';
import McpServerModal from '../bot/agent/McpServerModal';
import GeoLocationToolConfig from './GeoLocationToolConfig';
import PricingConfigurationWorkspace from './PricingConfigurationWorkspace';

const INITIAL_TOOLS: AgentTool[] = [
  { id: 'tool_api_call', name: 'query_api', description: '调用外部接口获取数据', type: 'API', enabled: true, category: 'api_call', parameters: [] },
  { id: 'tool_rag_search', name: 'search_knowledge', description: '检索知识库内容', type: 'RAG', enabled: true, category: 'knowledge', parameters: [], ragConfig: { knowledgeBaseId: '', topK: 3, similarityThreshold: 0.7 } },
  {
    id: 'tool_calculate_quote',
    name: 'calculate_quote',
    displayName: '家政服务报价',
    description: '根据服务类型、城市、面积和规格匹配价格并计算报价。',
    modelReadme: '用户咨询服务价格时调用。信息不足时先补充服务项目、城市、规格和数量。',
    type: 'PRICING',
    enabled: true,
    category: 'pricing',
    icon: '¥',
    parameters: [
      { name: 'item_name', type: 'string', description: '服务或商品名称', required: true, source: 'llm' },
      { name: 'quantity', type: 'number', description: '计价数量', required: true, source: 'llm' },
      { name: 'location', type: 'string', description: '城市、区域或门店', required: false, source: 'llm' },
      { name: 'appliance_type', type: 'string', description: '家电规格', required: false, source: 'llm' },
    ],
    pricingConfig: { mode: 'quote', dataSource: 'rule', pricingRuleId: 'pricing_rule_home_service' },
    duplicateCallPolicy: 'reuse_result',
    interruptionPolicy: 'cancel',
    pauseSilenceTimer: true,
    firstProgressFeedbackSeconds: 3,
    progressFeedbackIntervalSeconds: 8,
    maxExecutionSeconds: 10,
    progressSpeeches: ['正在为您核算价格，请稍候。'],
    executionLevel: 'auto',
    needReturn: true,
    directPlayOnReturn: true,
    failureSpeech: '抱歉，暂时无法完成报价，请补充服务信息或联系人工客服。',
  },
  {
    id: 'tool_calculate_cart',
    name: 'calculate_cart',
    displayName: '超市商品计价',
    description: '识别商品、数量和单位，维护当前通话购物车并计算合计金额。',
    modelReadme: '用户连续购买多件商品时调用，通过 action 区分新增、修改、删除和计算合计。',
    type: 'PRICING',
    enabled: true,
    category: 'pricing',
    icon: '🧮',
    parameters: [
      { name: 'action', type: 'string', description: 'add、update、remove 或 total', required: true, source: 'llm' },
      { name: 'item_name', type: 'string', description: '商品名称', required: false, source: 'llm' },
      { name: 'quantity', type: 'number', description: '商品数量', required: false, source: 'llm' },
      { name: 'location', type: 'string', description: '门店', required: false, source: 'llm' },
      { name: 'member_level', type: 'string', description: '会员等级', required: false, source: 'llm' },
    ],
    pricingConfig: { mode: 'cart', dataSource: 'rule', pricingRuleId: 'pricing_rule_supermarket', resultSpeechMode: 'change_and_total' },
    duplicateCallPolicy: 'reuse_result',
    interruptionPolicy: 'cancel',
    pauseSilenceTimer: true,
    firstProgressFeedbackSeconds: 2,
    progressFeedbackIntervalSeconds: 6,
    maxExecutionSeconds: 5,
    progressSpeeches: ['正在为您计算，请稍候。'],
    executionLevel: 'auto',
    needReturn: true,
    directPlayOnReturn: true,
    failureSpeech: '抱歉，暂时无法完成商品计价，请确认商品名称和数量。',
  },
  { id: 'tool_sms', name: 'send_sms', description: '向用户发送短信通知', type: 'SMS', enabled: true, category: 'communication', parameters: [] },
  {
    id: 'tool_query_order',
    name: 'query_order',
    description: '查询用户订单状态',
    type: 'API',
    enabled: true,
    category: 'api_call',
    parameters: [],
    executionStrategy: {
      playFiller: true,
      fillerType: 'TTS',
      fillerContent: '正在为您查询，请稍候...',
      soundEffect: { enabled: true, audioId: 'bgm_keyboard_typing', audioName: '键盘敲击声', audioUrl: 'mock_bgm_2.wav', stopOnTtsStart: true },
    },
  },
  { id: 'tool_transfer', name: 'transfer_call', description: '转接人工客服', type: 'TRANSFER', enabled: true, category: 'transfer', parameters: [] },
  { id: 'tool_geo_location', name: 'query_location', description: '查询地理位置信息（门店、网点等）', type: 'CUSTOM', enabled: true, category: 'other', icon: '📍', parameters: [] },
];

const SERVICE_PRICING_FIELDS: NonNullable<PricingTable['fields']> = [
  { id: 'field_service_scene', name: '服务场景', key: 'service_scene', type: 'select', required: false, searchable: true, matchable: true, calculable: false, options: ['日常清洁', '装修开荒', '换季大扫除', '家电清洗'] },
  { id: 'field_appliance_type', name: '家电规格', key: 'appliance_type', type: 'select', required: false, searchable: true, matchable: true, calculable: false, options: ['不适用', '挂机', '柜机', '中央空调'] },
  { id: 'field_area_min', name: '面积下限', key: 'area_min', type: 'number', required: false, searchable: false, matchable: true, calculable: true },
  { id: 'field_area_max', name: '面积上限', key: 'area_max', type: 'number', required: false, searchable: false, matchable: true, calculable: true },
];

const PRODUCT_PRICING_FIELDS: NonNullable<PricingTable['fields']> = [
  { id: 'field_brand', name: '品牌', key: 'brand', type: 'text', required: false, searchable: true, matchable: true, calculable: false },
  { id: 'field_member_level', name: '会员等级', key: 'member_level', type: 'select', required: false, searchable: true, matchable: true, calculable: false, options: ['普通会员', '银卡', '金卡'] },
  { id: 'field_pack_size', name: '包装数量', key: 'pack_size', type: 'number', required: false, searchable: false, matchable: true, calculable: true },
];

const INITIAL_PRICING_TABLES: PricingTable[] = [
  { id: 'pricing_table_home_service', name: '家政服务价格表', type: 'SERVICE', version: 'V3', rowCount: 126, source: 'excel', status: 'published', updatedAt: new Date('2026-07-18 16:20:00').getTime(), fields: SERVICE_PRICING_FIELDS },
  { id: 'pricing_table_supermarket', name: '武汉门店商品价格', type: 'PRODUCT', version: 'V8', rowCount: 3250, source: 'excel', status: 'published', updatedAt: new Date('2026-07-21 09:35:00').getTime(), fields: PRODUCT_PRICING_FIELDS },
  { id: 'pricing_table_supermarket_draft', name: '武汉门店商品价格', type: 'PRODUCT', version: 'V9', rowCount: 3278, source: 'excel', status: 'draft', updatedAt: new Date('2026-07-22 10:15:00').getTime(), fields: PRODUCT_PRICING_FIELDS },
];

const createPricingRule = (id: string, name: string, tableId: string, tableType: 'SERVICE' | 'PRODUCT', type: PricingRuleType, scope: string[], priority: number, version: string, status: 'draft' | 'published', condition: string): PricingRule => ({
  id,
  name,
  tableId,
  tableType,
  type,
  scope,
  condition,
  priority,
  parameters: type === 'base_increment'
    ? { unit: '平方米', quantityField: 'quantity', baseQuantity: 100, basePrice: 500, excessUnitPrice: 5 }
    : type === 'fixed'
      ? { unit: tableType === 'SERVICE' ? '次' : '件', fixedPrice: 99 }
      : type === 'tiered'
        ? { unit: tableType === 'SERVICE' ? '次' : '件', tiers: [{ from: 1, to: 10, unitPrice: 10 }, { from: 11, unitPrice: 8 }] }
        : { unit: tableType === 'SERVICE' ? '次' : '件', quantityField: 'quantity', minimumQuantity: 1 },
  version,
  status,
  updatedAt: Date.now(),
});

const INITIAL_PRICING_RULES: PricingRule[] = [
  { ...createPricingRule('pricing_rule_home_service', '家政服务标准计价', 'pricing_table_home_service', 'SERVICE', 'base_increment', ['开荒保洁'], 100, 'V3', 'published', '按城市、服务规格匹配'), conditions: [
    { id: 'cond_home_name', fieldKey: 'name', operator: 'contains', valueSource: 'input', inputParameter: 'item_name' },
    { id: 'cond_home_location', fieldKey: 'location', operator: 'eq', valueSource: 'input', inputParameter: 'location' },
    { id: 'cond_home_area_min', fieldKey: 'area_min', operator: 'lte', valueSource: 'input', inputParameter: 'quantity' },
    { id: 'cond_home_area_max', fieldKey: 'area_max', operator: 'gte', valueSource: 'input', inputParameter: 'quantity' },
  ] },
  createPricingRule('pricing_rule_daily_clean', '日常保洁按小时计价', 'pricing_table_home_service', 'SERVICE', 'unit', ['日常保洁'], 90, 'V3', 'published', '最低 2 小时起订'),
  createPricingRule('pricing_rule_appliance', '家电清洗固定价', 'pricing_table_home_service', 'SERVICE', 'fixed', ['家电清洗'], 80, 'V3', 'published', '按家电品类和规格匹配'),
  createPricingRule('pricing_rule_deep_clean', '深度保洁计价', 'pricing_table_home_service', 'SERVICE', 'base_increment', ['深度保洁'], 70, 'V3', 'published', '按面积计算'),
  createPricingRule('pricing_rule_service_tier', '批量服务阶梯价', 'pricing_table_home_service', 'SERVICE', 'tiered', ['全部服务'], 50, 'V3', 'draft', '适用于企业客户'),
  createPricingRule('pricing_rule_holiday', '节假日服务价', 'pricing_table_home_service', 'SERVICE', 'fixed', ['全部服务'], 40, 'V4', 'draft', '法定节假日生效'),
  { ...createPricingRule('pricing_rule_supermarket', '武汉门店商品计价', 'pricing_table_supermarket', 'PRODUCT', 'unit', ['全部商品'], 100, 'V8', 'published', '按门店、SKU 和销售单位匹配'), conditions: [
    { id: 'cond_product_name', fieldKey: 'name', operator: 'contains', valueSource: 'input', inputParameter: 'item_name' },
    { id: 'cond_product_location', fieldKey: 'location', operator: 'eq', valueSource: 'input', inputParameter: 'location' },
  ] },
  createPricingRule('pricing_rule_fresh', '生鲜称重计价', 'pricing_table_supermarket', 'PRODUCT', 'unit', ['生鲜'], 95, 'V8', 'published', '按实际称重数量计算'),
  createPricingRule('pricing_rule_bulk', '整箱商品阶梯价', 'pricing_table_supermarket', 'PRODUCT', 'tiered', ['饮料', '乳品'], 80, 'V8', 'published', '满箱后使用阶梯单价'),
  createPricingRule('pricing_rule_daily', '日用百货固定价', 'pricing_table_supermarket', 'PRODUCT', 'fixed', ['日用百货'], 70, 'V8', 'published', '按 SKU 固定价格'),
  createPricingRule('pricing_rule_grain', '粮油按量计价', 'pricing_table_supermarket', 'PRODUCT', 'unit', ['粮油'], 60, 'V8', 'published', '按斤或袋计算'),
  createPricingRule('pricing_rule_member', '会员商品试算', 'pricing_table_supermarket', 'PRODUCT', 'tiered', ['全部商品'], 30, 'V9', 'draft', '会员等级为金卡'),
];

const CATEGORY_OPTIONS = [
  { id: 'all', label: '全部' },
  { id: 'api_call', label: 'API' },
  { id: 'knowledge', label: 'RAG' },
  { id: 'pricing', label: '计价' },
  { id: 'communication', label: '通信' },
  { id: 'transfer', label: '转接' },
  { id: 'other', label: '其他' },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  api_call: 'API',
  knowledge: 'RAG',
  pricing: '计价',
  communication: '通信',
  transfer: '转接',
  other: '其他',
};

const TYPE_LABELS: Partial<Record<AgentTool['type'], string>> = {
  PRICING: '智能计价',
  QUOTE: '智能计价',
  CART_PRICING: '智能计价',
};

interface ToolConfigPageProps {
  bots?: BotConfiguration[];
  extractionConfigs?: ExtractionConfig[];
}

const isPricingTool = (tool: AgentTool) => tool.type === 'PRICING' || tool.type === 'QUOTE' || tool.type === 'CART_PRICING';

export default function ToolConfigPage({ bots = [], extractionConfigs = [] }: ToolConfigPageProps) {
  const [tools, setTools] = useState<AgentTool[]>(INITIAL_TOOLS);
  const [pricingTables, setPricingTables] = useState<PricingTable[]>(INITIAL_PRICING_TABLES);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(INITIAL_PRICING_RULES);
  const [editingTool, setEditingTool] = useState<AgentTool | null>(null);
  const [activePricingToolId, setActivePricingToolId] = useState<string | null>(null);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
  const [isGeoModalOpen, setIsGeoModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORY_OPTIONS)[number]['id']>('all');
  const [keyword, setKeyword] = useState('');

  const availableVariables = useMemo<BotVariable[]>(() => {
    const uniqueVariables = new Map<string, BotVariable>();
    bots.forEach((bot) => bot.variables?.forEach((variable) => uniqueVariables.set(variable.id, variable)));
    return Array.from(uniqueVariables.values());
  }, [bots]);

  const handleSaveTool = (tool: AgentTool) => {
    setTools((current) => current.some((item) => item.id === tool.id)
      ? current.map((item) => item.id === tool.id ? tool : item)
      : [{ ...tool, id: tool.id || `tool_${Date.now()}` }, ...current]);
    setIsToolModalOpen(false);
  };

  const savePricingTable = (table: PricingTable) => setPricingTables((current) => current.some((item) => item.id === table.id) ? current.map((item) => item.id === table.id ? table : item) : [table, ...current]);
  const savePricingRule = (rule: PricingRule) => setPricingRules((current) => current.some((item) => item.id === rule.id) ? current.map((item) => item.id === rule.id ? rule : item) : [rule, ...current]);
  const toggleToolEnabled = (id: string) => setTools((current) => current.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item));
  const handleDeleteTool = (id: string) => setTools((current) => current.filter((item) => item.id !== id));

  const filteredTools = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return tools.filter((item) => {
      const matchesCategory = activeCategory === 'all' || (item.category || 'other') === activeCategory;
      const matchesKeyword = !normalizedKeyword || [item.displayName, item.name, item.description, item.type, item.id, CATEGORY_LABELS[item.category || 'other']].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedKeyword));
      return matchesCategory && matchesKeyword;
    });
  }, [activeCategory, keyword, tools]);

  const activePricingTool = activePricingToolId ? tools.find((tool) => tool.id === activePricingToolId && isPricingTool(tool)) : undefined;
  if (activePricingTool) {
    return <PricingConfigurationWorkspace tool={activePricingTool} pricingTables={pricingTables} pricingRules={pricingRules} extractionConfigs={extractionConfigs} onBack={() => setActivePricingToolId(null)} onSaveTool={handleSaveTool} onSaveTable={savePricingTable} onSaveRule={savePricingRule} />;
  }

  return (
    <div className="mx-auto w-full max-w-[var(--layout-panel-max-width)] space-y-5 px-[var(--layout-content-padding-x)] py-[var(--layout-content-padding-y)]">
      <div className="flex items-start justify-between gap-4">
        <div><h1 className="flex items-center text-[var(--typography-size-headline)] font-bold text-[var(--color-semantic-text-primary)]"><Wrench size={22} className="mr-2 text-[var(--color-semantic-primary)]" />工具配置</h1><p className="mt-1 text-sm text-[var(--color-semantic-text-tertiary)]">管理语音 Agent 可调用工具。</p></div>
        <div className="flex items-center gap-2"><button onClick={() => setIsMcpModalOpen(true)} className="flex h-9 items-center rounded-[var(--component-button-radius)] bg-[var(--color-semantic-success)] px-4 text-sm font-semibold text-white"><Link size={15} className="mr-1.5" />添加 MCP</button><button onClick={() => { setEditingTool(null); setIsToolModalOpen(true); }} className="flex h-9 items-center rounded-[var(--component-button-radius)] bg-[var(--color-semantic-primary)] px-4 text-sm font-semibold text-white"><Plus size={15} className="mr-1.5" />添加工具</button></div>
      </div>

      <section className="overflow-hidden rounded-[var(--component-card-radius)] border border-[var(--color-semantic-border-default)] bg-white shadow-[var(--shadow-xs)]">
        <div className="flex min-h-[var(--component-filter-toolbar-height)] flex-wrap items-center justify-between gap-3 border-b border-[var(--color-semantic-border-subtle)] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-[var(--component-search-width-md)] max-w-full"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-semantic-text-placeholder)]" /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} className="h-[var(--component-search-height)] w-full rounded-[var(--component-search-radius)] border border-[var(--color-semantic-border-default)] bg-white pl-9 pr-3 text-sm outline-none focus:border-[var(--color-semantic-border-focus)]" placeholder="搜索工具名称 / 类型 / ID" /></div>
            <div className="flex items-center gap-1 rounded-[var(--radius-control)] bg-[var(--color-semantic-bg-subtle)] p-1">{CATEGORY_OPTIONS.map((item) => { const count = item.id === 'all' ? tools.length : tools.filter((tool) => (tool.category || 'other') === item.id).length; return <button key={item.id} onClick={() => setActiveCategory(item.id)} className={`h-8 rounded-[var(--radius-md)] px-3 text-xs font-semibold ${activeCategory === item.id ? 'bg-white text-[var(--color-semantic-primary)] shadow-[var(--shadow-xs)]' : 'text-[var(--color-semantic-text-tertiary)] hover:text-[var(--color-semantic-text-primary)]'}`}>{item.label} {count}</button>; })}</div>
          </div>
          <span className="text-xs text-[var(--color-semantic-text-tertiary)]">当前展示 {filteredTools.length} 个工具</span>
        </div>

        {filteredTools.length === 0 ? <div className="flex h-64 flex-col items-center justify-center text-[var(--color-semantic-text-tertiary)]"><Wrench size={40} className="mb-3 opacity-20" /><p className="text-sm font-semibold text-[var(--color-semantic-text-secondary)]">暂无匹配工具</p></div> : (
          <div className="divide-y divide-[var(--component-table-border)]">{filteredTools.map((tool) => (
            <div key={tool.id} data-tool-id={tool.id} className="flex min-h-[var(--density-default-row)] items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-[var(--color-semantic-bg-row-hover)]">
              <div className="flex min-w-0 items-center space-x-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-semantic-border-default)] bg-white shadow-[var(--shadow-xs)]"><span className="text-lg">{tool.icon || '🔧'}</span></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-[var(--color-semantic-text-primary)]">{tool.displayName || tool.name}</span><span className="rounded-[var(--component-badge-radius)] border border-[var(--color-semantic-border-subtle)] bg-[var(--color-semantic-bg-subtle)] px-2 py-0.5 text-[11px] text-[var(--color-semantic-text-tertiary)]">{TYPE_LABELS[tool.type] || tool.type}</span><span className="rounded-[var(--component-badge-radius)] border border-[var(--color-blue-100)] bg-[var(--color-semantic-primary-soft)] px-2 py-0.5 text-[11px] text-[var(--color-semantic-primary-text)]">{CATEGORY_LABELS[tool.category || 'other']}</span><span className={`rounded-[var(--component-badge-radius)] border px-2 py-0.5 text-[11px] ${tool.enabled ? 'border-[var(--color-green-100)] bg-[var(--color-semantic-success-soft)] text-[var(--color-semantic-success)]' : 'border-[var(--color-semantic-border-subtle)] bg-[var(--color-semantic-bg-subtle)] text-[var(--color-semantic-text-tertiary)]'}`}>{tool.enabled ? '已启用' : '已禁用'}</span></div><div className="mt-1 max-w-2xl truncate text-xs text-[var(--color-semantic-text-secondary)]" title={tool.description}>{tool.description}</div><div className="mt-1 font-mono text-[11px] text-[var(--color-semantic-text-placeholder)]">{tool.displayName ? tool.name : tool.id}</div></div></div>
              <div className="flex shrink-0 items-center gap-2">
                <button onClick={() => toggleToolEnabled(tool.id)} className={`flex h-8 items-center rounded-[var(--radius-md)] border px-3 text-xs font-semibold ${tool.enabled ? 'border-[var(--color-green-100)] bg-[var(--color-semantic-success-soft)] text-[var(--color-semantic-success)]' : 'border-[var(--color-semantic-border-default)] bg-white text-[var(--color-semantic-text-tertiary)]'}`}><Power size={12} className="mr-1" />{tool.enabled ? '停用' : '启用'}</button>
                <button onClick={() => { if (tool.id === 'tool_geo_location') setIsGeoModalOpen(true); else { setEditingTool(tool); setIsToolModalOpen(true); } }} className="flex h-8 items-center rounded-[var(--radius-md)] border border-[var(--color-semantic-border-default)] px-3 text-xs font-semibold text-[var(--color-semantic-text-secondary)] hover:bg-[var(--state-hover-bg)]"><Edit3 size={12} className="mr-1" />编辑</button>
                {isPricingTool(tool) && <button onClick={() => setActivePricingToolId(tool.id)} className="flex h-8 items-center rounded-[var(--radius-md)] border border-[var(--color-blue-100)] bg-[var(--color-semantic-primary-soft)] px-3 text-xs font-semibold text-[var(--color-semantic-primary-text)] hover:bg-[var(--color-blue-100)]"><Settings2 size={12} className="mr-1" />配置计价</button>}
                <button onClick={() => handleDeleteTool(tool.id)} className="flex h-8 items-center rounded-[var(--radius-md)] border border-[var(--color-red-100)] px-3 text-xs font-semibold text-[var(--color-semantic-danger)] hover:bg-[var(--color-semantic-danger-soft)]"><Trash2 size={12} className="mr-1" />删除</button>
              </div>
            </div>
          ))}</div>
        )}
      </section>

      {isToolModalOpen && <AgentToolModal tool={editingTool || undefined} onSave={handleSaveTool} onClose={() => setIsToolModalOpen(false)} extractionConfigs={extractionConfigs} pricingRules={pricingRules} availableVariables={availableVariables} />}
      {isMcpModalOpen && <McpServerModal onClose={() => setIsMcpModalOpen(false)} onSave={() => setIsMcpModalOpen(false)} />}
      {isGeoModalOpen && <GeoLocationToolConfig onClose={() => setIsGeoModalOpen(false)} />}
    </div>
  );
}
