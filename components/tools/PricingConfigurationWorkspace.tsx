import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  FileSpreadsheet,
  Play,
  Plus,
  Save,
  Search,
  Settings2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  AgentTool,
  ExtractionConfig,
  PricingConditionOperator,
  PricingFieldDefinition,
  PricingFieldType,
  PricingRule,
  PricingRuleCondition,
  PricingRuleType,
  PricingTable,
  PricingTableType,
} from '../../types';
import { Input, Select } from '../ui/FormComponents';

interface PricingConfigurationWorkspaceProps {
  tool: AgentTool;
  pricingTables: PricingTable[];
  pricingRules: PricingRule[];
  extractionConfigs: ExtractionConfig[];
  onBack: () => void;
  onSaveTool: (tool: AgentTool) => void;
  onSaveTable: (table: PricingTable) => void;
  onSaveRule: (rule: PricingRule) => void;
}

type WorkspaceTab = 'data' | 'rules' | 'imports' | 'test';
type PricingDataStatus = 'enabled' | 'disabled';

interface PriceRow {
  id: string;
  type: PricingTableType;
  code: string;
  name: string;
  spec: string;
  category: string;
  location: string;
  unit: string;
  price: number;
  status: PricingDataStatus;
  attributes: Record<string, string | number | boolean>;
}

interface ImportJob {
  id: string;
  tableType: PricingTableType;
  fileName: string;
  tableName: string;
  createdAt: string;
  total: number;
  success: number;
  failed: number;
  duplicate: number;
  operator: string;
  status: 'completed' | 'failed' | 'processing';
}

const RULE_TYPE_LABELS: Record<PricingRuleType, string> = {
  fixed: '固定价',
  unit: '按量计价',
  base_increment: '基础价加增量',
  tiered: '阶梯价',
  package: '套餐价',
  surcharge: '附加费',
  api: '接口计价',
};

const MODE_LABELS = {
  quote: '单次报价',
  cart: '连续计价',
  both: '同时支持',
} as const;

const SERVICE_NAMES = ['日常保洁', '开荒保洁', '全屋大扫除', '深度保洁', '空调挂机清洗', '空调柜机清洗', '冰箱清洗', '油烟机清洗', '窗帘清洗', '沙发清洗'];
const PRODUCT_NAMES = ['红富士苹果', '纯牛奶', '东北大米', '鲜鸡蛋', '抽纸', '洗衣液', '矿泉水', '橙汁', '酸奶', '面粉'];
const SERVICE_CATEGORIES = ['保洁服务', '家电清洗', '软装清洗'];
const PRODUCT_CATEGORIES = ['生鲜', '乳品', '粮油', '日用百货', '饮料'];
const SERVICE_LOCATIONS = ['全国', '北京', '上海', '武汉'];
const PRODUCT_LOCATIONS = ['武汉光谷店', '武汉汉口店', '武汉武昌店'];
const PRODUCT_BRANDS = ['农夫优选', '光明', '北大荒', '清风', '蓝月亮'];

const createPriceRows = (type: PricingTableType, count: number): PriceRow[] => Array.from({ length: count }, (_, index) => {
  const service = type === 'SERVICE';
  const names = service ? SERVICE_NAMES : PRODUCT_NAMES;
  const locations = service ? SERVICE_LOCATIONS : PRODUCT_LOCATIONS;
  const nameIndex = index % names.length;
  const name = names[nameIndex];
  const category = service
    ? nameIndex <= 3 ? '保洁服务' : nameIndex <= 7 ? '家电清洗' : '软装清洗'
    : [0, 3].includes(nameIndex) ? '生鲜'
      : [1, 8].includes(nameIndex) ? '乳品'
        : [2, 9].includes(nameIndex) ? '粮油'
          : [4, 5].includes(nameIndex) ? '日用百货'
            : '饮料';
  const unit = service
    ? nameIndex <= 3 ? '平方米' : nameIndex <= 7 ? '台' : '件'
    : [0, 3].includes(nameIndex) ? '斤' : [1, 8].includes(nameIndex) ? '盒' : [2, 9].includes(nameIndex) ? '袋' : '件';
  const serviceBasePrices = [50, 500, 699, 599, 99, 139, 129, 159, 30, 120];
  const productBasePrices = [8, 6.5, 39.9, 7.8, 12.9, 29.9, 2, 9.9, 5.8, 25.9];
  const batch = Math.floor(index / names.length);
  return {
    id: `${type.toLowerCase()}_${index + 1}`,
    type,
    code: service ? `FW-${String(index + 1).padStart(4, '0')}` : `SKU-${String(100001 + index)}`,
    name: `${name}${index >= names.length ? ` ${Math.floor(index / names.length) + 1}` : ''}`,
    spec: service ? (unit === '平方米' ? `${60 + (batch % 8) * 20}平方米` : unit === '台' ? `${1 + (batch % 3)}台` : '标准规格') : `${1 + (batch % 5)}${unit}`,
    category,
    location: locations[index % locations.length],
    unit,
    price: Number(((service ? serviceBasePrices[nameIndex] : productBasePrices[nameIndex]) + batch * (service ? 5 : 0.2)).toFixed(2)),
    status: index > 0 && index % 23 === 0 ? 'disabled' : 'enabled',
    attributes: service
      ? {
        service_scene: nameIndex <= 3 ? ['日常清洁', '装修开荒', '换季大扫除', '日常清洁'][nameIndex] : '家电清洗',
        appliance_type: nameIndex === 4 ? '挂机' : nameIndex === 5 ? '柜机' : nameIndex >= 6 && nameIndex <= 7 ? '不适用' : '不适用',
        area_min: unit === '平方米' ? Math.max(0, 60 + (batch % 8) * 20 - 20) : 0,
        area_max: unit === '平方米' ? 60 + (batch % 8) * 20 : 0,
      }
      : {
        brand: PRODUCT_BRANDS[nameIndex % PRODUCT_BRANDS.length],
        member_level: index % 5 === 0 ? '金卡' : index % 3 === 0 ? '银卡' : '普通会员',
        pack_size: 1 + (batch % 5),
      },
  };
});

const INITIAL_PRICE_ROWS: Record<PricingTableType, PriceRow[]> = {
  SERVICE: createPriceRows('SERVICE', 126),
  PRODUCT: createPriceRows('PRODUCT', 3250),
};

const IMPORT_JOBS: ImportJob[] = Array.from({ length: 18 }, (_, index) => {
  const tableType: PricingTableType = index % 2 === 0 ? 'PRODUCT' : 'SERVICE';
  const total = tableType === 'PRODUCT' ? 3250 - index * 17 : 126 - (index % 5) * 4;
  const failed = index % 4 === 0 ? 8 : index % 4 === 1 ? 2 : 0;
  const duplicate = index % 3 === 0 ? 4 : 0;
  return {
    id: `import_${index + 1}`,
    tableType,
    fileName: tableType === 'PRODUCT' ? `武汉门店商品价格_V${8 - Math.floor(index / 2)}.xlsx` : `家政服务价格表_V${3 + Math.floor(index / 2)}.xlsx`,
    tableName: tableType === 'PRODUCT' ? '武汉门店商品价格' : '家政服务价格表',
    createdAt: `2026-07-${String(Math.max(1, 21 - index)).padStart(2, '0')} ${index % 2 ? '16:20' : '09:35'}`,
    total,
    success: total - failed - duplicate,
    failed,
    duplicate,
    operator: index % 3 === 0 ? '王敏' : index % 3 === 1 ? '张伟' : '陈晨',
    status: index === 7 ? 'failed' : index === 12 ? 'processing' : 'completed',
  };
});

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const BUILT_IN_PRICING_FIELDS: PricingFieldDefinition[] = [
  { id: 'builtin_code', name: '编码', key: 'code', type: 'text', required: true, searchable: true, matchable: true, calculable: false },
  { id: 'builtin_name', name: '名称', key: 'name', type: 'text', required: true, searchable: true, matchable: true, calculable: false },
  { id: 'builtin_spec', name: '规格', key: 'spec', type: 'text', required: false, searchable: true, matchable: true, calculable: false },
  { id: 'builtin_category', name: '分类', key: 'category', type: 'text', required: true, searchable: true, matchable: true, calculable: false },
  { id: 'builtin_location', name: '区域 / 门店', key: 'location', type: 'text', required: false, searchable: true, matchable: true, calculable: false },
  { id: 'builtin_unit', name: '单位', key: 'unit', type: 'text', required: true, searchable: true, matchable: true, calculable: false },
  { id: 'builtin_price', name: '价格', key: 'price', type: 'number', required: true, searchable: false, matchable: true, calculable: true },
];

const CONDITION_OPERATOR_LABELS: Record<PricingConditionOperator, string> = {
  eq: '等于', neq: '不等于', in: '属于', contains: '包含', gt: '大于', gte: '大于等于', lt: '小于', lte: '小于等于', between: '介于',
};

function normalizePricingConfig(tool: AgentTool): NonNullable<AgentTool['pricingConfig']> {
  if (tool.pricingConfig) return tool.pricingConfig;
  if (tool.type === 'QUOTE') {
    return {
      mode: 'quote',
      dataSource: tool.quoteConfig?.dataSource === 'api' ? 'api' : 'rule',
      pricingRuleId: tool.quoteConfig?.pricingRuleId,
      externalInterfaceId: tool.quoteConfig?.externalInterfaceId,
    };
  }
  return {
    mode: 'cart',
    dataSource: tool.cartPricingConfig?.dataSource === 'api' ? 'api' : 'rule',
    pricingRuleId: tool.cartPricingConfig?.pricingRuleId,
    externalInterfaceId: tool.cartPricingConfig?.externalInterfaceId,
    storeVariableId: tool.cartPricingConfig?.storeVariableId,
    resultSpeechMode: tool.cartPricingConfig?.resultSpeechMode,
  };
}

export default function PricingConfigurationWorkspace({
  tool,
  pricingTables,
  pricingRules,
  extractionConfigs,
  onBack,
  onSaveTool,
  onSaveTable,
  onSaveRule,
}: PricingConfigurationWorkspaceProps) {
  const initialConfig = normalizePricingConfig(tool);
  const [draft, setDraft] = useState<AgentTool>({ ...tool, type: 'PRICING', pricingConfig: initialConfig });
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('data');
  const [selectedTableId, setSelectedTableId] = useState(
    pricingRules.find((rule) => rule.id === initialConfig.pricingRuleId)?.tableId
      || pricingTables.find((table) => initialConfig.mode === 'cart' ? table.type === 'PRODUCT' : table.type === 'SERVICE')?.id
      || pricingTables[0]?.id
      || '',
  );
  const [priceRows, setPriceRows] = useState<Record<PricingTableType, PriceRow[]>>(INITIAL_PRICE_ROWS);
  const [editingPriceRow, setEditingPriceRow] = useState<PriceRow | null>(null);
  const [isPriceRowModalOpen, setIsPriceRowModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [selectedImport, setSelectedImport] = useState<ImportJob | null>(null);
  const [savedState, setSavedState] = useState<'saved' | 'published' | null>(null);

  const config = draft.pricingConfig || initialConfig;
  const selectedTable = pricingTables.find((table) => table.id === selectedTableId) || pricingTables[0];
  const tableType = selectedTable?.type || (config.mode === 'cart' ? 'PRODUCT' : 'SERVICE');
  const modeLabel = MODE_LABELS[config.mode];

  const updateConfig = (updates: Partial<NonNullable<AgentTool['pricingConfig']>>) => {
    setDraft((current) => ({
      ...current,
      pricingConfig: { ...(current.pricingConfig || initialConfig), ...updates },
    }));
  };

  const save = (publish: boolean) => {
    onSaveTool({ ...draft, enabled: publish ? true : draft.enabled });
    setSavedState(publish ? 'published' : 'saved');
  };

  const savePriceRow = (row: PriceRow) => {
    setPriceRows((current) => ({
      ...current,
      [row.type]: current[row.type].some((item) => item.id === row.id)
        ? current[row.type].map((item) => item.id === row.id ? row : item)
        : [row, ...current[row.type]],
    }));
    setIsPriceRowModalOpen(false);
    setEditingPriceRow(null);
  };

  return (
    <div className="mx-auto w-full max-w-[var(--layout-panel-max-width)] px-[var(--layout-content-padding-x)] py-[var(--layout-content-padding-y)]">
      <header className="mb-5 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={onBack} title="返回工具列表" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--component-button-radius)] border border-[var(--color-semantic-border-default)] bg-white text-[var(--color-semantic-text-secondary)] hover:bg-[var(--state-hover-bg)]">
            <ArrowLeft size={17} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[var(--typography-size-headline)] font-bold text-[var(--color-semantic-text-primary)]">计价配置</h1>
              <span className="rounded-[var(--component-badge-radius)] border border-[var(--color-blue-100)] bg-[var(--color-semantic-primary-soft)] px-2 py-0.5 text-[11px] text-[var(--color-semantic-primary-text)]">{modeLabel}</span>
            </div>
            <div className="mt-1 text-sm text-[var(--color-semantic-text-tertiary)]">{draft.displayName || draft.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {savedState && <span className="mr-1 text-xs text-[var(--color-semantic-success)]">{savedState === 'published' ? '已发布' : '已保存'}</span>}
          <button onClick={() => save(false)} className="flex h-9 items-center rounded-[var(--component-button-radius)] border border-[var(--color-semantic-border-default)] bg-white px-4 text-sm font-semibold text-[var(--color-semantic-text-secondary)] hover:bg-[var(--state-hover-bg)]"><Save size={15} className="mr-1.5" />保存</button>
          <button onClick={() => save(true)} className="flex h-9 items-center rounded-[var(--component-button-radius)] bg-[var(--color-semantic-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-semantic-primary-hover)]"><CheckCircle2 size={15} className="mr-1.5" />发布</button>
        </div>
      </header>

      <div className="overflow-hidden rounded-[var(--component-card-radius)] border border-[var(--color-semantic-border-default)] bg-white shadow-[var(--shadow-xs)]">
        <div className="grid grid-cols-1 gap-4 border-b border-[var(--color-semantic-border-subtle)] bg-[var(--color-semantic-bg-subtle)] px-5 py-4 lg:grid-cols-3">
              <Select
                label="计价来源"
                options={[{ label: '平台计价', value: 'rule' }, { label: '客户接口', value: 'api' }]}
                value={config.dataSource}
            onChange={(event) => { updateConfig({ dataSource: event.target.value as 'rule' | 'api' }); setActiveTab('data'); }}
          />
          {config.dataSource === 'rule' ? (
            <>
              <Select
                label="价格表"
                options={pricingTables.map((table) => ({ label: `${table.name} ${table.version}`, value: table.id }))}
                value={selectedTableId}
                onChange={(event) => {
                  const tableId = event.target.value;
                  const firstPublishedRule = pricingRules.find((rule) => rule.tableId === tableId && rule.status === 'published');
                  setSelectedTableId(tableId);
                  updateConfig({ pricingRuleId: firstPublishedRule?.id });
                }}
              />
              <Select
                label="生效规则"
                options={pricingRules.filter((rule) => rule.tableId === selectedTableId && rule.status === 'published').map((rule) => ({ label: `${rule.name} ${rule.version}`, value: rule.id }))}
                value={config.pricingRuleId || ''}
                onChange={(event) => updateConfig({ pricingRuleId: event.target.value })}
              />
            </>
          ) : (
            <Select
              label="计价接口"
              options={[{ label: '请选择接口', value: '' }, ...extractionConfigs.map((item) => ({ label: item.name, value: item.id }))]}
              value={config.externalInterfaceId || ''}
              onChange={(event) => updateConfig({ externalInterfaceId: event.target.value })}
            />
          )}
        </div>

        <nav className="flex h-12 items-end border-b border-[var(--color-semantic-border-default)] px-5" aria-label="计价配置导航">
          {(config.dataSource === 'rule'
            ? ([['data', '价格数据'], ['rules', '计算规则'], ['imports', '导入记录'], ['test', '计价测试']] as Array<[WorkspaceTab, string]>)
            : ([['data', '接口配置'], ['test', '计价测试']] as Array<[WorkspaceTab, string]>))
            .map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`mr-7 h-12 border-b-2 text-sm font-semibold ${activeTab === id ? 'border-[var(--color-semantic-primary)] text-[var(--color-semantic-primary)]' : 'border-transparent text-[var(--color-semantic-text-secondary)] hover:text-[var(--color-semantic-text-primary)]'}`}>
              {label}
            </button>
          ))}
        </nav>

        {config.dataSource === 'api' && activeTab !== 'test' ? (
          <ApiPricingPanel config={config} extractionConfigs={extractionConfigs} />
        ) : (
          <>
            {activeTab === 'data' && selectedTable && (
              <PriceDataPanel
                table={selectedTable}
                rows={priceRows[tableType]}
                onImport={() => setIsImportModalOpen(true)}
                onConfigureFields={() => setIsFieldModalOpen(true)}
                onAdd={() => { setEditingPriceRow(null); setIsPriceRowModalOpen(true); }}
                onEdit={(row) => { setEditingPriceRow(row); setIsPriceRowModalOpen(true); }}
              />
            )}
            {activeTab === 'rules' && selectedTable && (
              <RulesPanel
                table={selectedTable}
                rules={pricingRules.filter((rule) => rule.tableId === selectedTable.id)}
                onAdd={() => { setEditingRule(null); setIsRuleModalOpen(true); }}
                onEdit={(rule) => { setEditingRule(rule); setIsRuleModalOpen(true); }}
              />
            )}
            {activeTab === 'imports' && selectedTable && (
              <ImportRecordsPanel jobs={IMPORT_JOBS.filter((job) => job.tableType === selectedTable.type)} onView={setSelectedImport} />
            )}
            {activeTab === 'test' && selectedTable && <PricingTestPanel mode={config.mode} table={selectedTable} rules={pricingRules.filter((rule) => rule.tableId === selectedTable.id)} rows={priceRows[tableType]} />}
          </>
        )}
      </div>

      {isPriceRowModalOpen && selectedTable && (
        <PriceRowModal
          row={editingPriceRow || undefined}
          table={selectedTable}
          onClose={() => { setIsPriceRowModalOpen(false); setEditingPriceRow(null); }}
          onSave={savePriceRow}
        />
      )}
      {isRuleModalOpen && selectedTable && (
        <PricingRuleModal
          rule={editingRule || undefined}
          table={selectedTable}
          tool={draft}
          onClose={() => setIsRuleModalOpen(false)}
          onSave={(rule) => { onSaveRule(rule); setIsRuleModalOpen(false); }}
        />
      )}
      {isImportModalOpen && selectedTable && (
        <PriceImportModal
          table={selectedTable}
          onClose={() => setIsImportModalOpen(false)}
          onSave={(table) => { onSaveTable(table); setIsImportModalOpen(false); }}
        />
      )}
      {isFieldModalOpen && selectedTable && (
        <PricingFieldsModal
          table={selectedTable}
          onClose={() => setIsFieldModalOpen(false)}
          onSave={(fields) => { onSaveTable({ ...selectedTable, fields, updatedAt: Date.now() }); setIsFieldModalOpen(false); }}
        />
      )}
      {selectedImport && <ImportDetailModal job={selectedImport} onClose={() => setSelectedImport(null)} />}
    </div>
  );
}

function ApiPricingPanel({ config, extractionConfigs }: { config: NonNullable<AgentTool['pricingConfig']>; extractionConfigs: ExtractionConfig[] }) {
  const selected = extractionConfigs.find((item) => item.id === config.externalInterfaceId);
  return (
    <div className="p-6">
      <div className="grid grid-cols-2 gap-5">
        <Input label="请求方式" value={selected?.method || '-'} disabled />
        <Input label="接口地址" value={selected?.interfaceUrl || '-'} disabled />
      </div>
    </div>
  );
}

function PriceDataPanel({ table, rows, onImport, onConfigureFields, onAdd, onEdit }: { table: PricingTable; rows: PriceRow[]; onImport: () => void; onConfigureFields: () => void; onAdd: () => void; onEdit: (row: PriceRow) => void }) {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const categories = useMemo(() => Array.from(new Set(rows.map((row) => row.category))), [rows]);
  const locations = useMemo(() => Array.from(new Set(rows.map((row) => row.location))), [rows]);
  const filtered = useMemo(() => rows.filter((row) => {
    const normalized = keyword.trim().toLowerCase();
    return (!normalized || [row.code, row.name, row.spec, ...Object.values(row.attributes).map(String)].some((value) => value.toLowerCase().includes(normalized)))
      && (category === 'all' || row.category === category)
      && (location === 'all' || row.location === location)
      && (status === 'all' || row.status === status);
  }), [category, keyword, location, rows, status]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const updateFilter = (setter: (value: string) => void, value: string) => { setter(value); setPage(1); };

  return (
    <section className="p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <SearchInput value={keyword} onChange={(value) => updateFilter(setKeyword, value)} placeholder="搜索编码、名称或规格" />
          <CompactSelect value={category} onChange={(value) => updateFilter(setCategory, value)} options={[['all', '全部分类'], ...categories.map((item) => [item, item])]} />
          <CompactSelect value={location} onChange={(value) => updateFilter(setLocation, value)} options={[['all', table.type === 'SERVICE' ? '全部区域' : '全部门店'], ...locations.map((item) => [item, item])]} />
          <CompactSelect value={status} onChange={(value) => updateFilter(setStatus, value)} options={[['all', '全部状态'], ['enabled', '启用'], ['disabled', '停用']]} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onConfigureFields} className="flex h-9 items-center rounded-[var(--component-button-radius)] border border-[var(--color-semantic-border-default)] bg-white px-3 text-sm font-semibold text-[var(--color-semantic-text-secondary)] hover:bg-[var(--state-hover-bg)]"><Settings2 size={14} className="mr-1.5" />字段配置</button>
          <button onClick={onImport} className="flex h-9 items-center rounded-[var(--component-button-radius)] border border-[var(--color-semantic-border-default)] bg-white px-3 text-sm font-semibold text-[var(--color-semantic-text-secondary)] hover:bg-[var(--state-hover-bg)]"><Upload size={14} className="mr-1.5" />导入 Excel</button>
          <button onClick={onAdd} className="flex h-9 items-center rounded-[var(--component-button-radius)] bg-[var(--color-semantic-primary)] px-3 text-sm font-semibold text-white"><Plus size={14} className="mr-1.5" />新增价格</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-control)] border border-[var(--component-table-border)]">
        <table className="w-full min-w-[1180px] text-left">
          <thead className="border-b border-[var(--component-table-border)] bg-[var(--color-semantic-bg-subtle)]">
            <tr>{['编码', table.type === 'SERVICE' ? '服务名称' : '商品名称', '规格', '分类', table.type === 'SERVICE' ? '适用区域' : '门店', ...(table.fields || []).map((field) => field.name), '单位', '价格（元）', '状态', '操作'].map((label) => <th key={label} className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-[var(--color-semantic-text-tertiary)]">{label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[var(--component-table-border)]">
            {pagedRows.map((row) => (
              <tr key={row.id} className="hover:bg-[var(--color-semantic-bg-row-hover)]">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[var(--color-semantic-text-secondary)]">{row.code}</td>
                <td className="px-4 py-3 text-sm font-semibold text-[var(--color-semantic-text-primary)]">{row.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--color-semantic-text-secondary)]">{row.spec}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--color-semantic-text-secondary)]">{row.category}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--color-semantic-text-secondary)]">{row.location}</td>
                {(table.fields || []).map((field) => <td key={field.id} className="whitespace-nowrap px-4 py-3 text-sm text-[var(--color-semantic-text-secondary)]">{formatFieldValue(row.attributes[field.key])}</td>)}
                <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--color-semantic-text-secondary)]">{row.unit}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-[var(--color-semantic-text-primary)]">{row.price.toFixed(2)}</td>
                <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={row.status === 'enabled' ? '启用' : '停用'} active={row.status === 'enabled'} /></td>
                <td className="whitespace-nowrap px-4 py-3"><button onClick={() => onEdit(row)} className="text-sm font-semibold text-[var(--color-semantic-primary)] hover:underline">编辑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={safePage} total={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />
    </section>
  );
}

function RulesPanel({ table, rules, onAdd, onEdit }: { table: PricingTable; rules: PricingRule[]; onAdd: () => void; onEdit: (rule: PricingRule) => void }) {
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const filtered = rules.filter((rule) => (!keyword.trim() || [rule.name, describeConditions(rule, table), ...rule.scope].some((value) => value.toLowerCase().includes(keyword.trim().toLowerCase())))
    && (type === 'all' || rule.type === type)
    && (status === 'all' || rule.status === status));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  return (
    <section className="p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <SearchInput value={keyword} onChange={(value) => { setKeyword(value); setPage(1); }} placeholder="搜索规则名称或适用范围" />
          <CompactSelect value={type} onChange={(value) => { setType(value); setPage(1); }} options={[['all', '全部计价方式'], ['fixed', '固定价'], ['unit', '按量计价'], ['base_increment', '基础价加增量'], ['tiered', '阶梯价']]} />
          <CompactSelect value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={[['all', '全部状态'], ['published', '已发布'], ['draft', '草稿']]} />
        </div>
        <button onClick={onAdd} className="flex h-9 items-center rounded-[var(--component-button-radius)] bg-[var(--color-semantic-primary)] px-3 text-sm font-semibold text-white"><Plus size={14} className="mr-1.5" />新增规则</button>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-control)] border border-[var(--component-table-border)]">
        <table className="w-full min-w-[940px] text-left">
          <thead className="border-b border-[var(--component-table-border)] bg-[var(--color-semantic-bg-subtle)]"><tr>{['规则名称', '计价方式', '适用对象', '条件', '优先级', '版本', '状态', '操作'].map((label) => <th key={label} className="px-4 py-3 text-xs font-semibold text-[var(--color-semantic-text-tertiary)]">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-[var(--component-table-border)]">
            {filtered.slice((safePage - 1) * pageSize, safePage * pageSize).map((rule) => (
              <tr key={rule.id} className="hover:bg-[var(--color-semantic-bg-row-hover)]">
                <td className="px-4 py-3 text-sm font-semibold text-[var(--color-semantic-text-primary)]">{rule.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--color-semantic-text-secondary)]">{RULE_TYPE_LABELS[rule.type]}</td>
                <td className="px-4 py-3 text-sm text-[var(--color-semantic-text-secondary)]">{rule.scope.join('、')}</td>
                <td className="max-w-[320px] px-4 py-3 text-sm text-[var(--color-semantic-text-secondary)]">{describeConditions(rule, table)}</td>
                <td className="px-4 py-3 text-sm text-[var(--color-semantic-text-secondary)]">{rule.priority}</td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--color-semantic-text-secondary)]">{rule.version}</td>
                <td className="px-4 py-3"><StatusBadge status={rule.status === 'published' ? '已发布' : '草稿'} active={rule.status === 'published'} /></td>
                <td className="px-4 py-3"><button onClick={() => onEdit(rule)} className="text-sm font-semibold text-[var(--color-semantic-primary)] hover:underline">编辑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={safePage} total={filtered.length} pageSize={pageSize} onPageChange={setPage} />
      <div className="sr-only">{table.name}</div>
    </section>
  );
}

function describeConditions(rule: PricingRule, table: PricingTable) {
  if (!rule.conditions?.length) return rule.condition || '-';
  const fields = [...BUILT_IN_PRICING_FIELDS, ...(table.fields || [])];
  return rule.conditions.map((condition) => {
    const field = fields.find((item) => item.key === condition.fieldKey)?.name || condition.fieldKey;
    const target = condition.valueSource === 'input' ? `参数 ${condition.inputParameter || '-'}` : condition.value || '-';
    return `${field}${CONDITION_OPERATOR_LABELS[condition.operator]}${target}`;
  }).join(' 且 ');
}

function ImportRecordsPanel({ jobs, onView }: { jobs: ImportJob[]; onView: (job: ImportJob) => void }) {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const filtered = jobs.filter((job) => (!keyword.trim() || [job.fileName, job.operator].some((value) => value.toLowerCase().includes(keyword.trim().toLowerCase()))) && (status === 'all' || job.status === status));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  return (
    <section className="p-5">
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <SearchInput value={keyword} onChange={(value) => { setKeyword(value); setPage(1); }} placeholder="搜索文件名或操作人" />
        <CompactSelect value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={[['all', '全部状态'], ['completed', '已完成'], ['failed', '失败'], ['processing', '处理中']]} />
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-control)] border border-[var(--component-table-border)]">
        <table className="w-full min-w-[1050px] text-left">
          <thead className="border-b border-[var(--component-table-border)] bg-[var(--color-semantic-bg-subtle)]"><tr>{['文件名', '导入时间', '总数', '成功', '失败', '重复', '操作人', '状态', '操作'].map((label) => <th key={label} className="px-4 py-3 text-xs font-semibold text-[var(--color-semantic-text-tertiary)]">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-[var(--component-table-border)]">
            {filtered.slice((safePage - 1) * pageSize, safePage * pageSize).map((job) => (
              <tr key={job.id} className="hover:bg-[var(--color-semantic-bg-row-hover)]">
                <td className="px-4 py-3 text-sm font-semibold text-[var(--color-semantic-text-primary)]">{job.fileName}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--color-semantic-text-secondary)]">{job.createdAt}</td>
                <td className="px-4 py-3 text-sm">{job.total.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-[var(--color-semantic-success)]">{job.success.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-[var(--color-semantic-danger)]">{job.failed}</td>
                <td className="px-4 py-3 text-sm text-[var(--color-orange-600)]">{job.duplicate}</td>
                <td className="px-4 py-3 text-sm text-[var(--color-semantic-text-secondary)]">{job.operator}</td>
                <td className="px-4 py-3"><StatusBadge status={job.status === 'completed' ? '已完成' : job.status === 'failed' ? '失败' : '处理中'} active={job.status === 'completed'} danger={job.status === 'failed'} /></td>
                <td className="px-4 py-3"><button onClick={() => onView(job)} className="text-sm font-semibold text-[var(--color-semantic-primary)] hover:underline">查看结果</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={safePage} total={filtered.length} pageSize={pageSize} onPageChange={setPage} />
    </section>
  );
}

function PricingTestPanel({ mode, table, rules, rows }: { mode: NonNullable<AgentTool['pricingConfig']>['mode']; table: PricingTable; rules: PricingRule[]; rows: PriceRow[] }) {
  const [testMode, setTestMode] = useState<'quote' | 'cart'>(mode === 'cart' ? 'cart' : 'quote');
  const [result, setResult] = useState<{ row?: PriceRow; rule?: PricingRule; total: number; trace: string[] } | null>(null);
  const service = table.type === 'SERVICE';
  const [itemName, setItemName] = useState(service ? '开荒保洁' : '红富士苹果');
  const [location, setLocation] = useState(service ? '武汉' : '武汉光谷店');
  const [quantity, setQuantity] = useState(service ? 120 : 3.5);
  const [customValues, setCustomValues] = useState<Record<string, string>>({ appliance_type: '不适用', member_level: '普通会员' });
  const [cartItems, setCartItems] = useState([
    { id: '1', product: '红富士苹果', quantity: 3.5, unit: '斤', price: 8 },
    { id: '2', product: '纯牛奶', quantity: 2, unit: '盒', price: 6.5 },
  ]);
  const total = cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const inputFields = (table.fields || []).filter((field) => field.matchable && field.type !== 'number' && field.key !== 'service_scene');
  const runQuote = () => {
    const row = rows.find((item) => item.name.startsWith(itemName) && item.location === location && inputFields.every((field) => !customValues[field.key] || item.attributes[field.key] === customValues[field.key]))
      || rows.find((item) => item.name.startsWith(itemName))
      || rows.find((item) => item.status === 'enabled');
    const rule = rules.filter((item) => item.status === 'published').sort((a, b) => b.priority - a.priority).find((item) => item.scope.includes(itemName) || item.scope.includes('全部服务') || item.scope.includes('全部商品')) || rules[0];
    const params = rule?.parameters || {};
    let calculated = row?.price || 0;
    let calculation = `${row?.price?.toFixed(2) || '0.00'} 元`;
    if (rule?.type === 'unit') {
      const billable = Math.max(quantity, params.minimumQuantity || 0);
      calculated = billable * (row?.price || params.unitPrice || 0);
      calculation = `${billable} ${params.unit || row?.unit || ''} × ${(row?.price || params.unitPrice || 0).toFixed(2)} 元`;
    } else if (rule?.type === 'base_increment') {
      calculated = (params.basePrice || 0) + Math.max(0, quantity - (params.baseQuantity || 0)) * (params.excessUnitPrice || 0);
      calculation = `${params.basePrice || 0} 元基础价 + ${Math.max(0, quantity - (params.baseQuantity || 0))} × ${params.excessUnitPrice || 0} 元`;
    } else if (rule?.type === 'tiered') {
      const tier = (params.tiers || []).find((item) => quantity >= item.from && (item.to === undefined || quantity <= item.to)) || params.tiers?.[params.tiers.length - 1];
      calculated = quantity * (tier?.unitPrice || row?.price || 0);
      calculation = `${quantity} × ${(tier?.unitPrice || row?.price || 0).toFixed(2)} 元`;
    } else if (rule?.parameters?.fixedPrice !== undefined) {
      calculated = rule.parameters.fixedPrice;
      calculation = `固定价格 ${rule.parameters.fixedPrice.toFixed(2)} 元`;
    }
    setResult({ row, rule, total: Number(calculated.toFixed(2)), trace: [row ? `命中价格数据：${row.name} / ${row.location}` : '未命中价格数据', rule ? `命中规则：${rule.name}` : '未命中计价规则', `计算过程：${calculation}`] });
  };
  return (
    <section className="p-5">
      {mode === 'both' && (
        <div className="mb-5 inline-flex rounded-[var(--radius-control)] bg-[var(--color-semantic-bg-subtle)] p-1">
            <button onClick={() => { setTestMode('quote'); setResult(null); }} className={`h-8 rounded-[var(--radius-md)] px-4 text-sm font-semibold ${testMode === 'quote' ? 'bg-white text-[var(--color-semantic-primary)] shadow-[var(--shadow-xs)]' : 'text-[var(--color-semantic-text-secondary)]'}`}>单次报价</button>
            <button onClick={() => { setTestMode('cart'); setResult(null); }} className={`h-8 rounded-[var(--radius-md)] px-4 text-sm font-semibold ${testMode === 'cart' ? 'bg-white text-[var(--color-semantic-primary)] shadow-[var(--shadow-xs)]' : 'text-[var(--color-semantic-text-secondary)]'}`}>连续计价</button>
        </div>
      )}
      {testMode === 'quote' ? (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <Select label={service ? '服务项目' : '商品'} options={service ? SERVICE_NAMES : PRODUCT_NAMES} value={itemName} onChange={(event) => { setItemName(event.target.value); setResult(null); }} />
            <Select label={service ? '城市' : '门店'} options={service ? SERVICE_LOCATIONS : PRODUCT_LOCATIONS} value={location} onChange={(event) => { setLocation(event.target.value); setResult(null); }} />
            <Input label="数量" type="number" value={quantity} onChange={(event) => { setQuantity(Number(event.target.value)); setResult(null); }} suffix={service ? '平方米' : '斤'} />
            <div className="flex items-end pb-5"><button onClick={runQuote} className="flex h-10 w-full items-center justify-center rounded-[var(--component-button-radius)] bg-[var(--color-semantic-primary)] text-sm font-semibold text-white"><Play size={14} className="mr-1.5" />运行测试</button></div>
          </div>
          {inputFields.length > 0 && <div className="mt-1 grid grid-cols-1 gap-4 lg:grid-cols-4">{inputFields.map((field) => field.type === 'select' ? <Select key={field.id} label={field.name} options={field.options || []} value={customValues[field.key] || ''} onChange={(event) => setCustomValues((current) => ({ ...current, [field.key]: event.target.value }))} /> : <Input key={field.id} label={field.name} value={customValues[field.key] || ''} onChange={(event) => setCustomValues((current) => ({ ...current, [field.key]: event.target.value }))} />)}</div>}
        </>
      ) : (
        <div>
          <div className="mb-3 flex justify-end"><button onClick={() => setCartItems((items) => [...items, { id: String(Date.now()), product: '抽纸', quantity: 1, unit: '件', price: 12.9 }])} className="flex h-8 items-center rounded-[var(--component-button-radius)] border border-[var(--color-semantic-border-default)] px-3 text-sm font-semibold text-[var(--color-semantic-text-secondary)]"><Plus size={14} className="mr-1" />添加商品</button></div>
          <div className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--component-table-border)]">
            <table className="w-full text-left"><thead className="border-b border-[var(--component-table-border)] bg-[var(--color-semantic-bg-subtle)]"><tr>{['商品', '数量', '单位', '单价（元）', '小计（元）', '操作'].map((label) => <th key={label} className="px-4 py-3 text-xs font-semibold text-[var(--color-semantic-text-tertiary)]">{label}</th>)}</tr></thead><tbody className="divide-y divide-[var(--component-table-border)]">{cartItems.map((item) => <tr key={item.id}><td className="px-4 py-3 text-sm font-semibold">{item.product}</td><td className="px-4 py-3"><input type="number" value={item.quantity} onChange={(event) => setCartItems((items) => items.map((entry) => entry.id === item.id ? { ...entry, quantity: Number(event.target.value) } : entry))} className="h-8 w-24 rounded border border-[var(--color-semantic-border-default)] px-2 text-sm" /></td><td className="px-4 py-3 text-sm">{item.unit}</td><td className="px-4 py-3 text-sm">{item.price.toFixed(2)}</td><td className="px-4 py-3 text-sm font-semibold">{(item.quantity * item.price).toFixed(2)}</td><td className="px-4 py-3"><button title="删除" onClick={() => setCartItems((items) => items.filter((entry) => entry.id !== item.id))} className="text-[var(--color-semantic-danger)]"><Trash2 size={15} /></button></td></tr>)}</tbody></table>
          </div>
           <div className="mt-4 flex justify-end"><button onClick={() => setResult({ total: Number(total.toFixed(2)), trace: [`购物车共 ${cartItems.length} 项商品`, '按当前价格表逐项计算', '已汇总小计'], row: rows[0], rule: rules[0] })} className="flex h-9 items-center rounded-[var(--component-button-radius)] bg-[var(--color-semantic-primary)] px-4 text-sm font-semibold text-white"><Calculator size={14} className="mr-1.5" />计算合计</button></div>
        </div>
      )}
       {result && (
        <div className="mt-5 border-t border-[var(--color-semantic-border-subtle)] pt-5">
          <div className="grid grid-cols-[1fr_auto] gap-6">
            <div>
              <div className="text-sm font-semibold text-[var(--color-semantic-text-primary)]">计算结果</div>
              <div className="mt-2 space-y-1 text-sm text-[var(--color-semantic-text-secondary)]">{result.trace.map((item) => <div key={item}>{item}</div>)}</div>
            </div>
            <div className="text-right"><div className="text-xs text-[var(--color-semantic-text-tertiary)]">合计金额</div><div className="mt-1 text-2xl font-bold text-[var(--color-semantic-primary)]">¥{result.total.toFixed(2)}</div></div>
          </div>
        </div>
      )}
    </section>
  );
}

function Pagination({ page, total, pageSize, onPageChange, onPageSizeChange }: { page: number; total: number; pageSize: number; onPageChange: (page: number) => void; onPageSizeChange?: (size: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-semantic-text-tertiary)]">
      <span>显示 {start}-{end} 条，共 {total.toLocaleString()} 条</span>
      <div className="flex items-center gap-2">
        {onPageSizeChange && <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="h-8 rounded border border-[var(--color-semantic-border-default)] bg-white px-2 text-xs text-[var(--color-semantic-text-secondary)]">{PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size} 条/页</option>)}</select>}
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="flex h-8 w-8 items-center justify-center rounded border border-[var(--color-semantic-border-default)] bg-white disabled:opacity-40" title="上一页"><ChevronLeft size={14} /></button>
        <span className="min-w-16 text-center">{page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="flex h-8 w-8 items-center justify-center rounded border border-[var(--color-semantic-border-default)] bg-white disabled:opacity-40" title="下一页"><ChevronRight size={14} /></button>
      </div>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="relative w-[280px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-semantic-text-placeholder)]" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-9 w-full rounded-[var(--component-search-radius)] border border-[var(--color-semantic-border-default)] bg-white pl-9 pr-3 text-sm outline-none focus:border-[var(--color-semantic-border-focus)]" /></div>;
}

function CompactSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[][] }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 rounded-[var(--component-field-radius)] border border-[var(--color-semantic-border-default)] bg-white px-3 text-sm text-[var(--color-semantic-text-secondary)] outline-none focus:border-[var(--color-semantic-border-focus)]">{options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>;
}

function StatusBadge({ status, active, danger = false }: { status: string; active: boolean; danger?: boolean }) {
  const className = danger
    ? 'border-[var(--color-red-100)] bg-[var(--color-semantic-danger-soft)] text-[var(--color-semantic-danger)]'
    : active
      ? 'border-[var(--color-green-100)] bg-[var(--color-semantic-success-soft)] text-[var(--color-semantic-success)]'
      : 'border-[var(--color-semantic-border-default)] bg-[var(--color-semantic-bg-subtle)] text-[var(--color-semantic-text-tertiary)]';
  return <span className={`rounded-[var(--component-badge-radius)] border px-2 py-0.5 text-[11px] ${className}`}>{status}</span>;
}

function formatFieldValue(value: string | number | boolean | undefined) {
  if (value === undefined || value === '') return '-';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return String(value);
}

function PriceRowModal({ row, table, onClose, onSave }: { row?: PriceRow; table: PricingTable; onClose: () => void; onSave: (row: PriceRow) => void }) {
  const tableType = table.type;
  const [formData, setFormData] = useState<PriceRow>(row || {
    id: `price_${Date.now()}`,
    type: tableType,
    code: '',
    name: '',
    spec: '',
    category: tableType === 'SERVICE' ? SERVICE_CATEGORIES[0] : PRODUCT_CATEGORIES[0],
    location: tableType === 'SERVICE' ? SERVICE_LOCATIONS[0] : PRODUCT_LOCATIONS[0],
    unit: tableType === 'SERVICE' ? '次' : '件',
    price: 0,
    status: 'enabled',
    attributes: Object.fromEntries((table.fields || []).map((field) => [field.key, field.type === 'number' ? 0 : field.type === 'boolean' ? false : field.options?.[0] || ''])),
  });
  const updateAttribute = (key: string, value: string | number | boolean) => setFormData((current) => ({ ...current, attributes: { ...current.attributes, [key]: value } }));
  return (
    <Modal title={row ? '编辑价格' : '新增价格'} icon={<Edit3 size={17} />} onClose={onClose} footer={<><SecondaryButton onClick={onClose}>取消</SecondaryButton><PrimaryButton onClick={() => formData.code.trim() && formData.name.trim() && onSave(formData)}>保存</PrimaryButton></>}>
      <div className="grid grid-cols-2 gap-x-4">
        <Input label="编码" required value={formData.code} onChange={(event) => setFormData({ ...formData, code: event.target.value })} />
        <Input label={tableType === 'SERVICE' ? '服务名称' : '商品名称'} required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} />
        <Input label="规格" value={formData.spec} onChange={(event) => setFormData({ ...formData, spec: event.target.value })} />
        <Select label="分类" options={(tableType === 'SERVICE' ? SERVICE_CATEGORIES : PRODUCT_CATEGORIES)} value={formData.category} onChange={(event) => setFormData({ ...formData, category: event.target.value })} />
        <Select label={tableType === 'SERVICE' ? '适用区域' : '门店'} options={tableType === 'SERVICE' ? SERVICE_LOCATIONS : PRODUCT_LOCATIONS} value={formData.location} onChange={(event) => setFormData({ ...formData, location: event.target.value })} />
        <Select label="单位" options={['次', '平方米', '台', '件', '斤', '盒']} value={formData.unit} onChange={(event) => setFormData({ ...formData, unit: event.target.value })} />
        <Input label="价格" type="number" min={0} step={0.01} value={formData.price} onChange={(event) => setFormData({ ...formData, price: Number(event.target.value) })} />
        <Select label="状态" options={[{ label: '启用', value: 'enabled' }, { label: '停用', value: 'disabled' }]} value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value as PricingDataStatus })} />
        {(table.fields || []).map((field) => (
          field.type === 'select'
            ? <Select key={field.id} label={field.name} options={field.options || []} value={String(formData.attributes[field.key] ?? '')} onChange={(event) => updateAttribute(field.key, event.target.value)} />
            : field.type === 'boolean'
              ? <Select key={field.id} label={field.name} options={[{ label: '是', value: 'true' }, { label: '否', value: 'false' }]} value={String(formData.attributes[field.key] ?? 'false')} onChange={(event) => updateAttribute(field.key, event.target.value === 'true')} />
              : <Input key={field.id} label={field.name} type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} value={String(formData.attributes[field.key] ?? '')} onChange={(event) => updateAttribute(field.key, field.type === 'number' ? Number(event.target.value) : event.target.value)} />
        ))}
      </div>
    </Modal>
  );
}

function PricingRuleModal({ rule, table, tool, onClose, onSave }: { rule?: PricingRule; table: PricingTable; tool: AgentTool; onClose: () => void; onSave: (rule: PricingRule) => void }) {
  const [formData, setFormData] = useState<PricingRule>(rule || {
    id: `pricing_rule_${Date.now()}`,
    name: '',
    tableId: table.id,
    tableType: table.type,
    type: 'unit',
    scope: [table.type === 'SERVICE' ? '全部服务' : '全部商品'],
    condition: '',
    conditions: [],
    priority: 100,
    parameters: { quantityField: 'input:quantity', minimumQuantity: 1, unit: table.type === 'SERVICE' ? '次' : '件' },
    version: table.version,
    status: 'draft',
    updatedAt: Date.now(),
  });
  const updateParameters = (updates: NonNullable<PricingRule['parameters']>) => setFormData({ ...formData, parameters: { ...(formData.parameters || {}), ...updates } });
  const fields = [...BUILT_IN_PRICING_FIELDS, ...(table.fields || []).filter((field) => field.matchable)];
  const quantityOptions = [
    ...tool.parameters.filter((parameter) => parameter.type === 'number').map((parameter) => ({ label: `工具参数：${parameter.name}`, value: `input:${parameter.name}` })),
    ...(table.fields || []).filter((field) => field.type === 'number' && field.calculable).map((field) => ({ label: `价格字段：${field.name}`, value: `field:${field.key}` })),
  ];
  const selectedQuantityField = formData.parameters?.quantityField
    ? formData.parameters.quantityField.includes(':') ? formData.parameters.quantityField : `input:${formData.parameters.quantityField}`
    : quantityOptions[0]?.value || '';
  const updateCondition = (id: string, updates: Partial<PricingRuleCondition>) => setFormData((current) => ({
    ...current,
    conditions: (current.conditions || []).map((condition) => condition.id === id ? { ...condition, ...updates } : condition),
  }));
  const addCondition = () => setFormData((current) => ({
    ...current,
    conditions: [...(current.conditions || []), { id: `condition_${Date.now()}`, fieldKey: fields[0]?.key || 'name', operator: 'eq', valueSource: 'input', inputParameter: tool.parameters[0]?.name || '' }],
  }));
  const updateTier = (index: number, updates: Partial<{ from: number; to?: number; unitPrice: number }>) => {
    const tiers = [...(formData.parameters?.tiers || [{ from: 1, to: 10, unitPrice: 10 }])];
    tiers[index] = { ...tiers[index], ...updates };
    updateParameters({ tiers });
  };
  return (
    <Modal title={rule ? '编辑计价规则' : '新增计价规则'} icon={<Calculator size={17} />} onClose={onClose} footer={<><SecondaryButton onClick={onClose}>取消</SecondaryButton><PrimaryButton onClick={() => formData.name.trim() && onSave({ ...formData, updatedAt: Date.now() })}>保存</PrimaryButton></>}>
      <Input label="规则名称" required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} />
      <div className="grid grid-cols-2 gap-x-4">
        <Select label="计价方式" options={[{ label: '固定价', value: 'fixed' }, { label: '按量计价', value: 'unit' }, { label: '基础价加增量', value: 'base_increment' }, { label: '阶梯价', value: 'tiered' }]} value={formData.type} onChange={(event) => setFormData({ ...formData, type: event.target.value as PricingRuleType, parameters: { quantityField: quantityOptions[0]?.value } })} />
        <Select label="适用对象" options={table.type === 'SERVICE' ? ['全部服务', ...SERVICE_CATEGORIES, ...SERVICE_NAMES] : ['全部商品', ...PRODUCT_CATEGORIES, ...PRODUCT_NAMES]} value={formData.scope[0]} onChange={(event) => setFormData({ ...formData, scope: [event.target.value] })} />
        <Input label="优先级" type="number" value={formData.priority} onChange={(event) => setFormData({ ...formData, priority: Number(event.target.value) })} />
      </div>
      <div className="mb-5 rounded-[var(--radius-control)] border border-[var(--color-semantic-border-default)]">
        <div className="flex items-center justify-between border-b border-[var(--color-semantic-border-subtle)] bg-[var(--color-semantic-bg-subtle)] px-4 py-3">
          <span className="text-sm font-semibold text-[var(--color-semantic-text-primary)]">匹配条件</span>
          <button onClick={addCondition} className="flex h-8 items-center rounded-[var(--component-button-radius)] border border-[var(--color-semantic-border-default)] bg-white px-3 text-xs font-semibold text-[var(--color-semantic-primary)]"><Plus size={13} className="mr-1" />添加条件</button>
        </div>
        <div className="space-y-3 p-4">
          {(formData.conditions || []).length === 0 && <div className="py-2 text-center text-sm text-[var(--color-semantic-text-tertiary)]">全部价格数据</div>}
          {(formData.conditions || []).map((condition) => {
            const selectedField = fields.find((field) => field.key === condition.fieldKey);
            return (
              <div key={condition.id} className="grid grid-cols-[1.2fr_120px_120px_1.2fr_32px] items-center gap-2">
                <CompactSelect value={condition.fieldKey} onChange={(value) => updateCondition(condition.id, { fieldKey: value, value: '' })} options={fields.map((field) => [field.key, field.name])} />
                <CompactSelect value={condition.operator} onChange={(value) => updateCondition(condition.id, { operator: value as PricingConditionOperator })} options={(selectedField?.type === 'number' ? ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between'] : ['eq', 'neq', 'contains', 'in']).map((operator) => [operator, CONDITION_OPERATOR_LABELS[operator as PricingConditionOperator]])} />
                <CompactSelect value={condition.valueSource} onChange={(value) => updateCondition(condition.id, { valueSource: value as 'fixed' | 'input' })} options={[['input', '工具参数'], ['fixed', '固定值']]} />
                {condition.valueSource === 'input'
                  ? <CompactSelect value={condition.inputParameter || ''} onChange={(value) => updateCondition(condition.id, { inputParameter: value })} options={tool.parameters.map((parameter) => [parameter.name, parameter.name])} />
                  : selectedField?.type === 'select'
                    ? <CompactSelect value={condition.value || ''} onChange={(value) => updateCondition(condition.id, { value })} options={(selectedField.options || []).map((option) => [option, option])} />
                    : <input value={condition.value || ''} onChange={(event) => updateCondition(condition.id, { value: event.target.value })} className="h-9 rounded-[var(--component-field-radius)] border border-[var(--color-semantic-border-default)] px-3 text-sm outline-none focus:border-[var(--color-semantic-border-focus)]" />}
                <button title="删除条件" onClick={() => setFormData((current) => ({ ...current, conditions: (current.conditions || []).filter((item) => item.id !== condition.id) }))} className="flex h-8 w-8 items-center justify-center text-[var(--color-semantic-danger)]"><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mb-5 rounded-[var(--radius-control)] border border-[var(--color-semantic-border-default)] bg-[var(--color-semantic-bg-subtle)] p-4">
        {formData.type === 'fixed' && <div className="grid grid-cols-2 gap-x-4"><Input label="固定价格" type="number" min={0} value={formData.parameters?.fixedPrice ?? ''} onChange={(event) => updateParameters({ fixedPrice: Number(event.target.value) })} /><Select label="计价单位" options={['次', '平方米', '台', '件', '斤', '盒']} value={formData.parameters?.unit || '件'} onChange={(event) => updateParameters({ unit: event.target.value })} /></div>}
        {formData.type === 'unit' && <div className="grid grid-cols-3 gap-x-4"><Select label="计费数量字段" options={quantityOptions} value={selectedQuantityField} onChange={(event) => updateParameters({ quantityField: event.target.value })} /><Input label="最低计费数量" type="number" min={0} value={formData.parameters?.minimumQuantity ?? 1} onChange={(event) => updateParameters({ minimumQuantity: Number(event.target.value) })} /><Select label="计价单位" options={['次', '平方米', '台', '件', '斤', '盒']} value={formData.parameters?.unit || '件'} onChange={(event) => updateParameters({ unit: event.target.value })} /></div>}
        {formData.type === 'base_increment' && <div className="grid grid-cols-2 gap-x-4"><Select label="计费数量字段" options={quantityOptions} value={selectedQuantityField} onChange={(event) => updateParameters({ quantityField: event.target.value })} /><Select label="计价单位" options={['次', '平方米', '台', '件', '斤', '盒']} value={formData.parameters?.unit || '平方米'} onChange={(event) => updateParameters({ unit: event.target.value })} /><Input label="基础数量" type="number" min={0} value={formData.parameters?.baseQuantity ?? ''} onChange={(event) => updateParameters({ baseQuantity: Number(event.target.value) })} /><Input label="基础价格" type="number" min={0} value={formData.parameters?.basePrice ?? ''} onChange={(event) => updateParameters({ basePrice: Number(event.target.value) })} /><Input label="超出单价" type="number" min={0} value={formData.parameters?.excessUnitPrice ?? ''} onChange={(event) => updateParameters({ excessUnitPrice: Number(event.target.value) })} /></div>}
        {formData.type === 'tiered' && <div><Select label="计费数量字段" options={quantityOptions} value={selectedQuantityField} onChange={(event) => updateParameters({ quantityField: event.target.value })} />{(formData.parameters?.tiers || [{ from: 1, to: 10, unitPrice: 10 }]).map((tier, index) => <div key={index} className="grid grid-cols-[1fr_1fr_1fr_32px] gap-x-3"><Input label="起始数量" type="number" value={tier.from} onChange={(event) => updateTier(index, { from: Number(event.target.value) })} /><Input label="截止数量" type="number" value={tier.to ?? ''} onChange={(event) => updateTier(index, { to: event.target.value ? Number(event.target.value) : undefined })} /><Input label="区间单价" type="number" value={tier.unitPrice} onChange={(event) => updateTier(index, { unitPrice: Number(event.target.value) })} /><button title="删除阶梯" onClick={() => updateParameters({ tiers: (formData.parameters?.tiers || []).filter((_, tierIndex) => tierIndex !== index) })} className="mb-5 mt-7 flex h-9 w-8 items-center justify-center text-[var(--color-semantic-danger)]"><Trash2 size={14} /></button></div>)}<button onClick={() => updateParameters({ tiers: [...(formData.parameters?.tiers || []), { from: 1, unitPrice: 0 }] })} className="flex h-8 items-center text-sm font-semibold text-[var(--color-semantic-primary)]"><Plus size={14} className="mr-1" />添加阶梯</button></div>}
      </div>
      <div className="grid grid-cols-2 gap-x-4"><Input label="版本" value={formData.version} onChange={(event) => setFormData({ ...formData, version: event.target.value })} /><Select label="状态" options={[{ label: '草稿', value: 'draft' }, { label: '已发布', value: 'published' }]} value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value as 'draft' | 'published' })} /></div>
    </Modal>
  );
}

function PricingFieldsModal({ table, onClose, onSave }: { table: PricingTable; onClose: () => void; onSave: (fields: PricingFieldDefinition[]) => void }) {
  const emptyField = (): PricingFieldDefinition => ({ id: `field_${Date.now()}`, name: '', key: '', type: 'text', required: false, searchable: true, matchable: true, calculable: false });
  const [fields, setFields] = useState<PricingFieldDefinition[]>(table.fields || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PricingFieldDefinition>(emptyField());
  const [optionsText, setOptionsText] = useState('');

  const startCreate = () => { setEditingId(null); setFormData(emptyField()); setOptionsText(''); };
  const startEdit = (field: PricingFieldDefinition) => { setEditingId(field.id); setFormData({ ...field }); setOptionsText((field.options || []).join('\n')); };
  const saveField = () => {
    const key = formData.key.trim().replace(/\s+/g, '_');
    if (!formData.name.trim() || !key) return;
    const next: PricingFieldDefinition = {
      ...formData,
      key,
      name: formData.name.trim(),
      calculable: formData.type === 'number' && formData.calculable,
      options: formData.type === 'select' ? optionsText.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean) : undefined,
    };
    setFields((current) => editingId ? current.map((field) => field.id === editingId ? next : field) : [...current, next]);
    startCreate();
  };

  return (
    <Modal title="字段配置" icon={<Settings2 size={17} />} onClose={onClose} footer={<><SecondaryButton onClick={onClose}>取消</SecondaryButton><PrimaryButton onClick={() => onSave(fields)}>保存</PrimaryButton></>}>
      <div className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--component-table-border)]">
        <table className="w-full text-left">
          <thead className="border-b border-[var(--component-table-border)] bg-[var(--color-semantic-bg-subtle)]"><tr>{['字段名称', '字段标识', '类型', '用途', '操作'].map((label) => <th key={label} className="px-3 py-3 text-xs font-semibold text-[var(--color-semantic-text-tertiary)]">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-[var(--component-table-border)]">
            {fields.map((field) => (
              <tr key={field.id}>
                <td className="px-3 py-3 text-sm font-semibold">{field.name}</td>
                <td className="px-3 py-3 font-mono text-xs text-[var(--color-semantic-text-secondary)]">{field.key}</td>
                <td className="px-3 py-3 text-sm text-[var(--color-semantic-text-secondary)]">{{ text: '文本', number: '数值', select: '选项', boolean: '布尔', date: '日期' }[field.type]}</td>
                <td className="px-3 py-3 text-xs text-[var(--color-semantic-text-secondary)]">{[field.searchable && '检索', field.matchable && '匹配', field.calculable && '计算'].filter(Boolean).join('、') || '-'}</td>
                <td className="whitespace-nowrap px-3 py-3"><button onClick={() => startEdit(field)} className="mr-3 text-sm font-semibold text-[var(--color-semantic-primary)]">编辑</button><button onClick={() => setFields((current) => current.filter((item) => item.id !== field.id))} className="text-sm font-semibold text-[var(--color-semantic-danger)]">删除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 rounded-[var(--radius-control)] border border-[var(--color-semantic-border-default)] bg-[var(--color-semantic-bg-subtle)] p-4">
        <div className="mb-4 flex items-center justify-between"><span className="text-sm font-semibold text-[var(--color-semantic-text-primary)]">{editingId ? '编辑字段' : '新增字段'}</span>{editingId && <button onClick={startCreate} className="text-xs font-semibold text-[var(--color-semantic-primary)]">取消编辑</button>}</div>
        <div className="grid grid-cols-3 gap-x-4">
          <Input label="字段名称" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} />
          <Input label="字段标识" value={formData.key} onChange={(event) => setFormData({ ...formData, key: event.target.value })} />
          <Select label="字段类型" options={[{ label: '文本', value: 'text' }, { label: '数值', value: 'number' }, { label: '选项', value: 'select' }, { label: '布尔', value: 'boolean' }, { label: '日期', value: 'date' }]} value={formData.type} onChange={(event) => setFormData({ ...formData, type: event.target.value as PricingFieldType, calculable: event.target.value === 'number' ? formData.calculable : false })} />
        </div>
        {formData.type === 'select' && <div className="mb-5"><label className="mb-2 block text-sm font-semibold text-[var(--color-semantic-text-secondary)]">选项</label><textarea value={optionsText} onChange={(event) => setOptionsText(event.target.value)} className="min-h-20 w-full rounded-[var(--component-field-radius)] border border-[var(--color-semantic-border-default)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-semantic-border-focus)]" /></div>}
        <div className="mb-4 flex flex-wrap gap-5">
          <FieldCheckbox label="必填" checked={formData.required} onChange={(checked) => setFormData({ ...formData, required: checked })} />
          <FieldCheckbox label="可检索" checked={formData.searchable} onChange={(checked) => setFormData({ ...formData, searchable: checked })} />
          <FieldCheckbox label="参与匹配" checked={formData.matchable} onChange={(checked) => setFormData({ ...formData, matchable: checked })} />
          {formData.type === 'number' && <FieldCheckbox label="参与计算" checked={formData.calculable} onChange={(checked) => setFormData({ ...formData, calculable: checked })} />}
        </div>
        <button onClick={saveField} className="flex h-9 items-center rounded-[var(--component-button-radius)] bg-[var(--color-semantic-primary)] px-4 text-sm font-semibold text-white"><Plus size={14} className="mr-1.5" />{editingId ? '更新字段' : '添加字段'}</button>
      </div>
    </Modal>
  );
}

function FieldCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-semantic-text-secondary)]"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[var(--color-semantic-primary)]" />{label}</label>;
}

function PriceImportModal({ table, onClose, onSave }: { table: PricingTable; onClose: () => void; onSave: (table: PricingTable) => void }) {
  const [version, setVersion] = useState(table.version);
  const [fileName, setFileName] = useState('');
  const excelColumns = table.type === 'SERVICE' ? ['服务编码', '服务名称', '城市', '家电规格', '面积下限', '面积上限', '价格'] : ['商品编码', '商品名称', '门店', '品牌', '会员等级', '包装数量', '价格'];
  const mappingOptions = [{ label: '忽略此列', value: '' }, ...BUILT_IN_PRICING_FIELDS.filter((field) => field.key !== 'price').map((field) => ({ label: field.name, value: field.key })), ...(table.fields || []).map((field) => ({ label: field.name, value: field.key })), { label: '价格', value: 'price' }];
  const [mappings, setMappings] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = { 服务编码: 'code', 商品编码: 'code', 服务名称: 'name', 商品名称: 'name', 城市: 'location', 门店: 'location', 家电规格: 'appliance_type', 面积下限: 'area_min', 面积上限: 'area_max', 品牌: 'brand', 会员等级: 'member_level', 包装数量: 'pack_size', 价格: 'price' };
    return Object.fromEntries(excelColumns.map((column) => [column, defaults[column] || '']));
  });
  return (
    <Modal title="导入价格数据" icon={<FileSpreadsheet size={17} />} onClose={onClose} footer={<><SecondaryButton onClick={onClose}>取消</SecondaryButton><PrimaryButton onClick={() => fileName && onSave({ ...table, version, source: 'excel', status: 'draft', updatedAt: Date.now() })}>开始导入</PrimaryButton></>}>
      <div className="grid grid-cols-2 gap-x-4"><Input label="价格表" value={table.name} disabled /><Input label="导入版本" value={version} onChange={(event) => setVersion(event.target.value)} /></div>
      <label className="flex h-28 cursor-pointer items-center justify-center rounded-[var(--component-field-radius)] border border-dashed border-[var(--color-semantic-border-strong)] bg-[var(--color-semantic-bg-subtle)] text-sm font-semibold text-[var(--color-semantic-primary)] hover:border-[var(--color-semantic-primary)]">
        <Upload size={17} className="mr-2" />{fileName || '选择 Excel 文件'}
        <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(event) => setFileName(event.target.files?.[0]?.name || '')} />
      </label>
      {fileName && <div className="mt-5 rounded-[var(--radius-control)] border border-[var(--color-semantic-border-default)]"><div className="border-b border-[var(--color-semantic-border-subtle)] bg-[var(--color-semantic-bg-subtle)] px-4 py-3 text-sm font-semibold text-[var(--color-semantic-text-primary)]">Excel 列映射</div><div className="divide-y divide-[var(--component-table-border)]">{excelColumns.map((column) => <div key={column} className="grid grid-cols-[1fr_220px] items-center gap-4 px-4 py-2"><span className="text-sm text-[var(--color-semantic-text-secondary)]">{column}</span><select value={mappings[column] || ''} onChange={(event) => setMappings((current) => ({ ...current, [column]: event.target.value }))} className="h-9 rounded-[var(--component-field-radius)] border border-[var(--color-semantic-border-default)] bg-white px-3 text-sm text-[var(--color-semantic-text-secondary)]"><option value="">请选择目标字段</option>{mappingOptions.map((option) => <option key={`${column}_${option.value}`} value={option.value}>{option.label}</option>)}</select></div>)}</div></div>}
    </Modal>
  );
}

function ImportDetailModal({ job, onClose }: { job: ImportJob; onClose: () => void }) {
  const [keyword, setKeyword] = useState('');
  const [result, setResult] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const rows = useMemo(() => Array.from({ length: Math.min(job.total, 80) }, (_, index) => {
    const failed = index < job.failed;
    const duplicate = !failed && index < job.failed + job.duplicate;
    return { row: index + 2, code: job.tableType === 'SERVICE' ? `FW-${String(index + 1).padStart(4, '0')}` : `SKU-${100001 + index}`, name: job.tableType === 'SERVICE' ? SERVICE_NAMES[index % SERVICE_NAMES.length] : PRODUCT_NAMES[index % PRODUCT_NAMES.length], result: failed ? 'failed' : duplicate ? 'duplicate' : 'success', reason: failed ? (index % 2 ? '价格不能为空' : '销售单位未匹配') : duplicate ? '商品编码重复' : '-' };
  }), [job]);
  const filtered = rows.filter((row) => (!keyword.trim() || [row.code, row.name].some((value) => value.toLowerCase().includes(keyword.trim().toLowerCase()))) && (result === 'all' || row.result === result));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-[980px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[var(--component-card-radius)] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-semantic-border-default)] bg-[var(--color-semantic-bg-subtle)] px-6 py-4"><div><h3 className="text-base font-bold text-[var(--color-semantic-text-primary)]">导入结果</h3><div className="mt-1 text-xs text-[var(--color-semantic-text-tertiary)]">{job.fileName} · {job.createdAt}</div></div><button onClick={onClose} title="关闭"><X size={20} /></button></div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-5 grid grid-cols-4 divide-x divide-[var(--color-semantic-border-subtle)] rounded-[var(--radius-control)] border border-[var(--color-semantic-border-default)] bg-[var(--color-semantic-bg-subtle)] py-4"><ImportMetric label="总计" value={job.total} /><ImportMetric label="成功" value={job.success} tone="success" /><ImportMetric label="失败" value={job.failed} tone="danger" /><ImportMetric label="重复" value={job.duplicate} tone="warning" /></div>
          <div className="mb-4 flex gap-2"><SearchInput value={keyword} onChange={(value) => { setKeyword(value); setPage(1); }} placeholder="搜索编码或名称" /><CompactSelect value={result} onChange={(value) => { setResult(value); setPage(1); }} options={[['all', '全部结果'], ['success', '成功'], ['failed', '失败'], ['duplicate', '重复']]} /></div>
          <div className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--component-table-border)]"><table className="w-full text-left"><thead className="border-b border-[var(--component-table-border)] bg-[var(--color-semantic-bg-subtle)]"><tr>{['Excel 行号', '编码', '名称', '导入结果', '原因'].map((label) => <th key={label} className="px-4 py-3 text-xs font-semibold text-[var(--color-semantic-text-tertiary)]">{label}</th>)}</tr></thead><tbody className="divide-y divide-[var(--component-table-border)]">{filtered.slice((safePage - 1) * pageSize, safePage * pageSize).map((row) => <tr key={row.row}><td className="px-4 py-3 font-mono text-xs">{row.row}</td><td className="px-4 py-3 font-mono text-xs">{row.code}</td><td className="px-4 py-3 text-sm">{row.name}</td><td className="px-4 py-3 text-sm font-semibold">{row.result === 'success' ? '成功' : row.result === 'failed' ? '失败' : '重复'}</td><td className="px-4 py-3 text-sm text-[var(--color-semantic-text-secondary)]">{row.reason}</td></tr>)}</tbody></table></div>
          <Pagination page={safePage} total={filtered.length} pageSize={pageSize} onPageChange={setPage} />
        </div>
        <div className="flex justify-between border-t border-[var(--color-semantic-border-default)] bg-[var(--color-semantic-bg-subtle)] px-6 py-4"><SecondaryButton onClick={() => undefined}><Download size={14} className="mr-1.5" />下载失败数据</SecondaryButton><PrimaryButton onClick={onClose}>关闭</PrimaryButton></div>
      </div>
    </div>
  );
}

function ImportMetric({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'success' | 'danger' | 'warning' }) {
  const toneClass = tone === 'success' ? 'text-[var(--color-semantic-success)]' : tone === 'danger' ? 'text-[var(--color-semantic-danger)]' : tone === 'warning' ? 'text-[var(--color-orange-600)]' : 'text-[var(--color-semantic-text-primary)]';
  return <div className="px-5"><div className="text-xs text-[var(--color-semantic-text-tertiary)]">{label}</div><div className={`mt-1 text-lg font-semibold ${toneClass}`}>{value.toLocaleString()}</div></div>;
}

function Modal({ title, icon, children, footer, onClose }: { title: string; icon: React.ReactNode; children: React.ReactNode; footer: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"><div className="flex max-h-[90vh] w-[720px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[var(--component-card-radius)] bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-[var(--color-semantic-border-default)] bg-[var(--color-semantic-bg-subtle)] px-6 py-4"><h3 className="flex items-center gap-2 text-base font-bold text-[var(--color-semantic-text-primary)]">{icon}{title}</h3><button onClick={onClose} title="关闭"><X size={20} /></button></div><div className="flex-1 overflow-y-auto p-6">{children}</div><div className="flex justify-end gap-2 border-t border-[var(--color-semantic-border-default)] bg-[var(--color-semantic-bg-subtle)] px-6 py-4">{footer}</div></div></div>;
}

function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="flex h-9 items-center rounded-[var(--component-button-radius)] bg-[var(--color-semantic-primary)] px-4 text-sm font-semibold text-white">{children}</button>;
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="flex h-9 items-center rounded-[var(--component-button-radius)] border border-[var(--color-semantic-border-default)] bg-white px-4 text-sm font-semibold text-[var(--color-semantic-text-secondary)]">{children}</button>;
}
