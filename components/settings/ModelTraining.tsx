import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Download, 
  Filter,
  Search,
  Bot,
  MessageSquare,
  Phone,
  Clock,
  BarChart3,
  FileText,
  Wand2,
  Tags,
  Save,
  RefreshCw,
  Eye,
  MoreHorizontal,
  ArrowRight,
  Database,
  Zap,
  Brain,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit3,
  Plus,
  Send,
  Mic,
  User,
  Headset,
  PhoneOff,
  LayoutGrid,
  List,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckSquare,
  XSquare,
  HelpCircle,
  Repeat,
  Scissors,
  ThumbsDown,
  Lightbulb
} from 'lucide-react';

// ==================== 类型定义 ====================

interface CallRecord {
  id: string;
  callId: string;
  customerPhone: string;
  startTime: string;
  duration: number;
  botId: string;
  botName: string;
  status: 'completed' | 'failed' | 'in_progress';
  transcription: DialogueTurn[];
  scenarios: DetectedScenario[];
  annotation?: Annotation;
  debugResult?: DebugResult;
  createdAt: string;
  updatedAt: string;
}

interface DialogueTurn {
  id: string;
  speaker: 'customer' | 'bot';
  content: string;
  timestamp: number;
  audioUrl?: string;
}

interface DetectedScenario {
  id: string;
  type: ScenarioType;
  name: string;
  confidence: number;
  description: string;
  relatedTurns: string[];
  severity: 'high' | 'medium' | 'low';
  detectedAt: string;
}

type ScenarioType =
  | 'dissatisfied'      // 客户不满意
  | 'transfer'          // 转人工
  | 'repetition'        // 重复回答
  | 'interruption'      // 打断场景
  | 'other_negative';   // 其他负向

interface Annotation {
  id: string;
  status: 'pending' | 'confirmed' | 'corrected' | 'rejected';
  correctedType?: ScenarioType;
  notes?: string;
  annotatedAt?: string;
  annotatedBy?: string;
}

interface DebugResult {
  id: string;
  status: 'success' | 'failed' | 'partial';
  messages: DebugMessage[];
  latency: number;
  testedAt: string;
}

interface DebugMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  latency?: number;
}

interface AutoRecognitionConfig {
  enabled: boolean;
  schedule: string;  // cron表达式
  lastRunAt?: string;
  nextRunAt?: string;
  confidenceThreshold: number;
  enabledScenarios: ScenarioType[];
  targetBots: string[];
  lookbackDays: number;
}

interface ScenarioDefinition {
  type: ScenarioType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  prompt: string;
}

// ==================== 场景定义 ====================

const SCENARIO_DEFINITIONS: ScenarioDefinition[] = [
  {
    type: 'dissatisfied',
    name: '客户不满意',
    description: '客户对回答表示不满、抱怨或负面情绪',
    icon: <ThumbsDown size={16} />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    prompt: '识别客户表达不满、抱怨、生气、质疑等负面情绪的对话'
  },
  {
    type: 'transfer',
    name: '转人工',
    description: '客户要求转接人工客服',
    icon: <Headset size={16} />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    prompt: '识别客户明确要求转人工、找人工客服、要人工服务等场景'
  },
  {
    type: 'repetition',
    name: '重复回答',
    description: '机器人连续重复相同内容',
    icon: <Repeat size={16} />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    prompt: '识别机器人连续两次或以上给出相同或高度相似回答的场景'
  },
  {
    type: 'interruption',
    name: '打断场景',
    description: '机器人打断客户说话',
    icon: <Scissors size={16} />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    prompt: '识别客户话未说完、表达不完整时机器人就开始回答的场景'
  },
  {
    type: 'other_negative',
    name: '其他负向',
    description: '其他负面体验场景',
    icon: <AlertTriangle size={16} />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    prompt: '识别其他导致客户体验不佳的对话场景'
  }
];

// ==================== 模拟数据 ====================

const MOCK_RECORDS: CallRecord[] = [
  {
    id: '1',
    callId: 'CALL-20240115-001',
    customerPhone: '138****8888',
    startTime: '2024-01-15 10:30:00',
    duration: 120,
    botId: 'bot1',
    botName: '滴滴出行客服',
    status: 'completed',
    transcription: [
      { id: 't1', speaker: 'bot', content: '您好，这里是滴滴出行客服，请问有什么可以帮您？', timestamp: 0 },
      { id: 't2', speaker: 'customer', content: '我想问一下，我的订单为什么还没到账？', timestamp: 5 },
      { id: 't3', speaker: 'bot', content: '抱歉，我不太明白您的问题。请您再说一遍好吗？', timestamp: 8 },
      { id: 't4', speaker: 'customer', content: '我说我的退款为什么还没到账！', timestamp: 15 },
      { id: 't5', speaker: 'bot', content: '抱歉，我不太明白您的问题。请您再说一遍好吗？', timestamp: 18 },
    ],
    scenarios: [
      { 
        id: 's1', 
        type: 'unknown', 
        name: '未知场景', 
        confidence: 0.92, 
        description: '机器人两次无法理解用户关于退款的问题',
        relatedTurns: ['t3', 't5'],
        severity: 'high',
        detectedAt: '2024-01-15 22:00:00'
      },
      { 
        id: 's2', 
        type: 'repetition', 
        name: '重复回答', 
        confidence: 0.88, 
        description: '机器人连续两次给出相同的回答',
        relatedTurns: ['t3', 't5'],
        severity: 'medium',
        detectedAt: '2024-01-15 22:00:00'
      },
    ],
    annotation: {
      id: 'a1',
      status: 'pending',
    },
    createdAt: '2024-01-15 10:30:00',
    updatedAt: '2024-01-15 22:00:00'
  },
  {
    id: '2',
    callId: 'CALL-20240115-002',
    customerPhone: '139****9999',
    startTime: '2024-01-15 11:15:00',
    duration: 180,
    botId: 'bot1',
    botName: '滴滴出行客服',
    status: 'completed',
    transcription: [
      { id: 't1', speaker: 'bot', content: '您好，请问有什么可以帮您？', timestamp: 0 },
      { id: 't2', speaker: 'customer', content: '我要投诉你们的服务', timestamp: 3 },
      { id: 't3', speaker: 'bot', content: '非常抱歉给您带来不好的体验，请问具体是什么问题呢？', timestamp: 6 },
      { id: 't4', speaker: 'customer', content: '你们的司机态度太差了，我要...', timestamp: 10 },
      { id: 't5', speaker: 'bot', content: '好的，我理解您的感受，请问需要我为您转接人工客服吗？', timestamp: 12 },
    ],
    scenarios: [
      { 
        id: 's1', 
        type: 'interruption', 
        name: '打断场景', 
        confidence: 0.85, 
        description: '客户话未说完，机器人就插话',
        relatedTurns: ['t4', 't5'],
        severity: 'medium',
        detectedAt: '2024-01-15 22:00:00'
      },
    ],
    annotation: {
      id: 'a2',
      status: 'confirmed',
      annotatedAt: '2024-01-16 09:00:00',
      annotatedBy: '管理员',
    },
    createdAt: '2024-01-15 11:15:00',
    updatedAt: '2024-01-16 09:00:00'
  },
  {
    id: '3',
    callId: 'CALL-20240115-003',
    customerPhone: '137****7777',
    startTime: '2024-01-15 14:20:00',
    duration: 90,
    botId: 'bot2',
    botName: '金融服务机器人',
    status: 'completed',
    transcription: [
      { id: 't1', speaker: 'bot', content: '您好，请问有什么可以帮您？', timestamp: 0 },
      { id: 't2', speaker: 'customer', content: '我要找人工客服', timestamp: 3 },
      { id: 't3', speaker: 'bot', content: '好的，正在为您转接人工客服，请稍候。', timestamp: 5 },
    ],
    scenarios: [
      { 
        id: 's1', 
        type: 'transfer', 
        name: '转人工', 
        confidence: 0.95, 
        description: '客户明确要求转人工',
        relatedTurns: ['t2'],
        severity: 'low',
        detectedAt: '2024-01-15 22:00:00'
      },
    ],
    annotation: {
      id: 'a3',
      status: 'confirmed',
      annotatedAt: '2024-01-16 10:00:00',
      annotatedBy: '管理员',
    },
    createdAt: '2024-01-15 14:20:00',
    updatedAt: '2024-01-16 10:00:00'
  },
  {
    id: '4',
    callId: 'CALL-20240115-004',
    customerPhone: '136****6666',
    startTime: '2024-01-15 16:45:00',
    duration: 240,
    botId: 'bot1',
    botName: '滴滴出行客服',
    status: 'completed',
    transcription: [
      { id: 't1', speaker: 'bot', content: '您好，请问有什么可以帮您？', timestamp: 0 },
      { id: 't2', speaker: 'customer', content: '你们这个服务太差了', timestamp: 3 },
      { id: 't3', speaker: 'bot', content: '非常抱歉给您带来不好的体验', timestamp: 6 },
      { id: 't4', speaker: 'customer', content: '我要投诉你们', timestamp: 10 },
      { id: 't5', speaker: 'bot', content: '我理解您的不满，请问具体是什么问题呢？', timestamp: 13 },
    ],
    scenarios: [
      { 
        id: 's1', 
        type: 'dissatisfied', 
        name: '客户不满意', 
        confidence: 0.90, 
        description: '客户明确表达不满情绪',
        relatedTurns: ['t2', 't4'],
        severity: 'high',
        detectedAt: '2024-01-15 22:00:00'
      },
    ],
    annotation: {
      id: 'a4',
      status: 'corrected',
      correctedType: 'transfer',
      notes: '实际应该是转人工场景',
      annotatedAt: '2024-01-16 11:00:00',
      annotatedBy: '管理员',
    },
    createdAt: '2024-01-15 16:45:00',
    updatedAt: '2024-01-16 11:00:00'
  },
];

// ==================== 主组件 ====================

const ModelTraining: React.FC = () => {
  // 视图状态
  const [activeView, setActiveView] = useState<'records' | 'config'>('records');
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [detailRecord, setDetailRecord] = useState<CallRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // 筛选状态
  const [filters, setFilters] = useState({
    dateRange: { start: '', end: '' },
    scenarioTypes: [] as ScenarioType[],
    botId: 'all',
    severity: 'all' as 'all' | 'high' | 'medium' | 'low',
  });

  // 自动识别配置
  const [autoConfig, setAutoConfig] = useState<AutoRecognitionConfig>({
    enabled: true,
    schedule: '0 22 * * *',  // 每晚22点
    lastRunAt: '2024-01-15 22:05:00',
    nextRunAt: '2024-01-16 22:00:00',
    confidenceThreshold: 0.7,
    enabledScenarios: ['dissatisfied', 'transfer', 'repetition', 'interruption', 'other_negative'],
    targetBots: ['bot1', 'bot2'],
    lookbackDays: 1,
  });

  // 场景提示词配置
  const [scenarioPrompts, setScenarioPrompts] = useState<Record<ScenarioType, string>>({
    dissatisfied: `你是对话分析专家。请仔细分析以下机器人与客户的对话，识别出所有客户表达不满、抱怨、生气、质疑、讽刺或负面情绪的情况。

需要识别的情况包括但不限于：
1. 客户使用负面评价词：如"不好"、"差"、"失望"、"生气"、"不满"、"垃圾"、"太差了"等
2. 客户语气激动、情绪化：出现大量感叹号、问号或重复表达
3. 客户明确抱怨：如"你们服务太差"、"我不满意"、"我要投诉"等
4. 客户质疑机器人能力：如"你懂吗"、"你知道吗"、"你会不会搞错"等
5. 客户叹气、无奈表达：如"唉"、"算了"、"真是的"等

请判断客户的整体情绪状态，如存在上述任何一种情况，且情绪较为明显（置信度>0.7），请标记为"客户不满意"场景。`,
    transfer: `你是对话分析专家。请仔细分析以下机器人与客户的对话，识别出所有客户明确要求转接人工客服的情况。

需要识别的情况包括但不限于：
1. 客户明确要求找人工：如"转人工"、"找人工"、"人工服务"、"人工客服"、"真人"、"真人客服"等
2. 客户对机器人不满意而要求转人工：如"你帮我转人工吧"、"我不想和你说了，找个人"等
3. 客户多次要求未能解决后要求转人工
4. 客户提到与人工相关的业务：如"人工办理"、"人工激活"、"人工查询"等明确需要人工操作的需求

注意：仅当客户明确、主动地要求转人工时才标记为此场景。不要将客户只是在对话中提到"人工"这个词的情况误判。`,
    repetition: `你是对话分析专家。请仔细分析以下机器人与客户的对话，识别出机器人在连续多轮对话中重复相同或高度相似内容的情况。

需要识别的情况包括但不限于：
1. 机器人连续两次给出完全相同的回答
2. 机器人连续两次给出核心意思相同、仅措辞略有不同的回答
3. 机器人陷入循环：相同的问答模式重复出现2次以上
4. 机器人重复使用相同的开场白或结束语

判断标准：
- 字面重复：完全相同的句子或段落
- 语义重复：表达相同意思但用词不同，如"抱歉我无法理解"和"对不起我不明白您的问题"
- 模式重复：固定的问答套路反复出现

如机器人连续给出2次及以上相同或高度相似的回答，请标记为"重复回答"场景。`,
    interruption: `你是对话分析专家。请仔细分析以下机器人与客户的对话，识别出机器人打断客户说话或客户话未说完就被机器人打断的情况。

需要识别的情况包括但不限于：
1. 客户正在表达一句话，被机器人中途插话打断
2. 客户话还没说完（出现省略号、语句不完整），机器人就开始回应
3. 客户表达了部分信息（如只说了日期但没说具体时间），机器人就当作理解完整并回答
4. 机器人在客户还在说话时就开始播放提示音或做出回应

判断方法：
- 查看对话时间戳，相邻两条客户回复间隔过短
- 客户回复被截断或语义不完整
- 机器人的回答与客户当前句子的前半部分呼应，但未等客户说完

如存在上述情况，请标记为"打断场景"。`,
    other_negative: `你是对话分析专家。请仔细分析以下机器人与客户的对话，识别出所有其他导致客户体验不佳或可能影响服务质量的情况。

需要特别关注但不限于以下情况：
1. 机器人答非所问：客户问A，机器人回答B，两者不相关
2. 机器人回答混乱：逻辑不清、前后矛盾、表述模糊让人无法理解
3. 机器人过度打扰：在客户正常表达过程中频繁插话或打断
4. 机器人态度不当：过于机械、冷漠、敷衍或不专业
5. 知识缺失：机器人表示不知道、无法回答、不在服务范围内等
6. 交互体验差：等待时间过长、重复确认、流程繁琐等
7. 客户失去耐心：客户开始催促、使用不耐烦的语气

如发现除"客户不满意"、"转人工"、"重复回答"、"打断场景"之外的任何负面体验，请标记为"其他负向"场景，并简要说明具体问题。`,
  });

  const [editingPrompt, setEditingPrompt] = useState<ScenarioType | null>(null);
  const [editingPromptValue, setEditingPromptValue] = useState('');

  // 统计数据
  const stats = {
    totalRecords: MOCK_RECORDS.length,
    pendingAnnotation: MOCK_RECORDS.filter(r => !r.annotation || r.annotation.status === 'pending').length,
    confirmed: MOCK_RECORDS.filter(r => r.annotation?.status === 'confirmed').length,
    corrected: MOCK_RECORDS.filter(r => r.annotation?.status === 'corrected').length,
    byScenario: SCENARIO_DEFINITIONS.map(def => ({
      ...def,
      count: MOCK_RECORDS.filter(r => r.scenarios.some(s => s.type === def.type)).length
    })),
    bySeverity: {
      high: MOCK_RECORDS.filter(r => r.scenarios.some(s => s.severity === 'high')).length,
      medium: MOCK_RECORDS.filter(r => r.scenarios.some(s => s.severity === 'medium')).length,
      low: MOCK_RECORDS.filter(r => r.scenarios.some(s => s.severity === 'low')).length,
    }
  };

  // 筛选记录
  const getFilteredRecords = () => {
    return MOCK_RECORDS.filter(record => {
      if (filters.dateRange.start && record.startTime < filters.dateRange.start) return false;
      if (filters.dateRange.end && record.startTime > filters.dateRange.end) return false;
      if (filters.scenarioTypes.length > 0) {
        const hasMatchingType = record.scenarios.some(s => filters.scenarioTypes.includes(s.type));
        if (!hasMatchingType) return false;
      }
      if (filters.botId !== 'all' && record.botId !== filters.botId) return false;
      if (filters.severity !== 'all') {
        const hasMatchingSeverity = record.scenarios.some(s => s.severity === filters.severity);
        if (!hasMatchingSeverity) return false;
      }
      return true;
    });
  };

  // 处理标注
  const handleAnnotation = (recordId: string, status: Annotation['status'], notes?: string, correctedType?: ScenarioType) => {
    // 实际应该调用API
    console.log('Annotation:', { recordId, status, notes, correctedType });
  };

  // 导出数据
  const handleExport = (format: 'json' | 'csv') => {
    const records = selectedRecords.length > 0
      ? MOCK_RECORDS.filter(r => selectedRecords.includes(r.id))
      : getFilteredRecords();

    console.log('Export:', format, records);
    alert(`已导出 ${records.length} 条记录 (${format.toUpperCase()}格式)`);
  };

  // ==================== 渲染视图 ====================

  // 渲染导航栏
  const renderNav = () => (
    <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
      <button
        className={`pb-4 text-sm font-medium flex items-center gap-2 transition-colors ${
          activeView === 'records' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => setActiveView('records')}
      >
        <List size={18} />
        问题记录
        {stats.pendingAnnotation > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
            {stats.pendingAnnotation}
          </span>
        )}
      </button>
      <button
        className={`pb-4 text-sm font-medium flex items-center gap-2 transition-colors ${
          activeView === 'config' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => setActiveView('config')}
      >
        <Settings size={18} />
        识别配置
      </button>
    </div>
  );

  // 渲染数据看板
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-blue-100 text-sm">总问题记录</span>
            <Database size={20} className="text-blue-200" />
          </div>
          <p className="text-3xl font-bold">{stats.totalRecords}</p>
          <p className="text-blue-100 text-xs mt-2">今日新增 12 条</p>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-yellow-100 text-sm">待标注</span>
            <AlertCircle size={20} className="text-yellow-200" />
          </div>
          <p className="text-3xl font-bold">{stats.pendingAnnotation}</p>
          <p className="text-yellow-100 text-xs mt-2">需要人工审核</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-green-100 text-sm">已确认</span>
            <CheckCircle size={20} className="text-green-200" />
          </div>
          <p className="text-3xl font-bold">{stats.confirmed}</p>
          <p className="text-green-100 text-xs mt-2">识别准确</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-purple-100 text-sm">已修正</span>
            <Edit3 size={20} className="text-purple-200" />
          </div>
          <p className="text-3xl font-bold">{stats.corrected}</p>
          <p className="text-purple-100 text-xs mt-2">优化后可用</p>
        </div>
      </div>

      {/* 场景分布 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Tags size={20} className="text-primary" />
            场景分布
          </h3>
          <div className="space-y-3">
            {stats.byScenario.map(scenario => (
              <div key={scenario.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${scenario.bgColor}`}>
                    {React.cloneElement(scenario.icon as React.ReactElement, { className: scenario.color })}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{scenario.name}</p>
                    <p className="text-xs text-gray-500">{scenario.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">{scenario.count}</p>
                  <p className="text-xs text-gray-500">
                    {stats.totalRecords > 0 ? Math.round((scenario.count / stats.totalRecords) * 100) : 0}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-primary" />
            严重程度分布
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">高风险</span>
                <span className="text-sm font-medium text-red-600">{stats.bySeverity.high}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${stats.totalRecords > 0 ? (stats.bySeverity.high / stats.totalRecords) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">中风险</span>
                <span className="text-sm font-medium text-yellow-600">{stats.bySeverity.medium}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${stats.totalRecords > 0 ? (stats.bySeverity.medium / stats.totalRecords) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">低风险</span>
                <span className="text-sm font-medium text-blue-600">{stats.bySeverity.low}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${stats.totalRecords > 0 ? (stats.bySeverity.low / stats.totalRecords) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">快捷操作</h4>
            <div className="grid grid-cols-2 gap-3">
              <button 
                className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-primary text-sm font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                onClick={() => setActiveView('records')}
              >
                <Eye size={16} />
                查看待标注
              </button>
              <button 
                className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                onClick={() => handleExport('json')}
              >
                <Download size={16} />
                导出数据
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 最近识别记录 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            最近识别记录
          </h3>
          <button 
            className="text-primary text-sm hover:underline"
            onClick={() => setActiveView('records')}
          >
            查看全部
          </button>
        </div>
        <div className="space-y-3">
          {MOCK_RECORDS.slice(0, 3).map(record => (
            <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => { setDetailRecord(record); setShowDetailModal(true); }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${
                  !record.annotation || record.annotation.status === 'pending' ? 'bg-yellow-500' :
                  record.annotation.status === 'confirmed' ? 'bg-green-500' :
                  record.annotation.status === 'corrected' ? 'bg-blue-500' : 'bg-red-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">{record.callId}</p>
                  <p className="text-sm text-gray-500">{record.botName} · {record.startTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {record.scenarios.map((s, idx) => (
                    <span key={idx} className={`px-2 py-1 text-xs rounded-full ${s.bgColor} ${s.color}`}>
                      {s.name}
                    </span>
                  ))}
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 渲染问题记录列表
  const renderRecords = () => (
    <div>
      {/* 筛选栏 */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">筛选：</span>
          </div>
          
          <input 
            type="date" 
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            value={filters.dateRange.start}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))}
          />
          <span className="text-gray-400">至</span>
          <input 
            type="date" 
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            value={filters.dateRange.end}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))}
          />

          <select
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            value={filters.severity}
            onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value as any }))}
          >
            <option value="all">全部等级</option>
            <option value="high">高风险</option>
            <option value="medium">中风险</option>
            <option value="low">低风险</option>
          </select>

          <button 
            className="ml-auto px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
            onClick={() => setFilters({
              dateRange: { start: '', end: '' },
              scenarioTypes: [],
              botId: 'all',
              severity: 'all',
            })}
          >
            重置筛选
          </button>
        </div>

        {/* 场景类型筛选 */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
          <span className="text-sm text-gray-500">场景类型：</span>
          <div className="flex gap-2 flex-wrap">
            {SCENARIO_DEFINITIONS.map(def => (
              <button
                key={def.type}
                className={`px-3 py-1 text-xs rounded-full border transition-colors flex items-center gap-1 ${
                  filters.scenarioTypes.includes(def.type)
                    ? `${def.bgColor} ${def.color} border-current`
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setFilters(prev => ({
                    ...prev,
                    scenarioTypes: prev.scenarioTypes.includes(def.type)
                      ? prev.scenarioTypes.filter(t => t !== def.type)
                      : [...prev.scenarioTypes, def.type]
                  }));
                }}
              >
                {def.icon}
                {def.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedRecords.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-sm text-primary font-medium">
            已选择 {selectedRecords.length} 条记录
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
              onClick={() => handleExport('json')}
            >
              <Download size={14} />
              导出选中
            </button>
          </div>
        </div>
      )}

      {/* 记录列表 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input 
                  type="checkbox"
                  className="h-4 w-4 text-primary rounded border-gray-300"
                  checked={selectedRecords.length === getFilteredRecords().length && getFilteredRecords().length > 0}
                  onChange={() => {
                    const filtered = getFilteredRecords();
                    if (selectedRecords.length === filtered.length) {
                      setSelectedRecords([]);
                    } else {
                      setSelectedRecords(filtered.map(r => r.id));
                    }
                  }}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">通话信息</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">识别场景</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">严重程度</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {getFilteredRecords().map(record => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <input 
                    type="checkbox"
                    className="h-4 w-4 text-primary rounded border-gray-300"
                    checked={selectedRecords.includes(record.id)}
                    onChange={() => {
                      setSelectedRecords(prev => 
                        prev.includes(record.id) 
                          ? prev.filter(id => id !== record.id)
                          : [...prev, record.id]
                      );
                    }}
                  />
                </td>
                <td className="px-4 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{record.callId}</p>
                    <p className="text-sm text-gray-500">{record.botName}</p>
                    <p className="text-xs text-gray-400">{record.startTime}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {record.scenarios.map((scenario, idx) => {
                      const def = SCENARIO_DEFINITIONS.find(d => d.type === scenario.type);
                      return (
                        <span 
                          key={idx}
                          className={`px-2 py-1 text-xs rounded-full ${def?.bgColor} ${def?.color}`}
                          title={scenario.description}
                        >
                          {scenario.name}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-4 py-4">
                  {record.scenarios.some(s => s.severity === 'high') ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">高风险</span>
                  ) : record.scenarios.some(s => s.severity === 'medium') ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-600">中风险</span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">低风险</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                      onClick={() => { setDetailRecord(record); setShowDetailModal(true); }}
                      title="查看详情"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 渲染配置页面
  const renderConfig = () => (
    <div className="max-w-3xl">
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">自动识别任务</h3>
            <p className="text-sm text-gray-500">配置定时任务，自动识别问题通话记录</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {autoConfig.enabled ? '已启用' : '已停用'}
            </span>
            <button 
              className={`w-12 h-6 rounded-full transition-colors relative ${
                autoConfig.enabled ? 'bg-primary' : 'bg-gray-300'
              }`}
              onClick={() => setAutoConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                autoConfig.enabled ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500 mb-1">上次执行</p>
              <p className="font-medium text-gray-900">{autoConfig.lastRunAt || '从未执行'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">下次执行</p>
              <p className="font-medium text-gray-900">{autoConfig.nextRunAt || '已停用'}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              执行时间 (Cron表达式)
            </label>
            <input 
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={autoConfig.schedule}
              onChange={(e) => setAutoConfig(prev => ({ ...prev, schedule: e.target.value }))}
              placeholder="0 22 * * *"
            />
            <p className="text-xs text-gray-500 mt-1">默认每晚22点执行，分析当天的通话记录</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              回溯天数
            </label>
            <input 
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={autoConfig.lookbackDays}
              onChange={(e) => setAutoConfig(prev => ({ ...prev, lookbackDays: parseInt(e.target.value) }))}
              min={1}
              max={7}
            />
            <p className="text-xs text-gray-500 mt-1">每次分析最近N天的通话记录</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              置信度阈值
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={autoConfig.confidenceThreshold}
                onChange={(e) => setAutoConfig(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12">{autoConfig.confidenceThreshold}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              启用的识别场景
            </label>
            <div className="space-y-3">
              {SCENARIO_DEFINITIONS.filter(def => autoConfig.enabledScenarios.includes(def.type)).map(def => (
                <div key={def.type} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={autoConfig.enabledScenarios.includes(def.type)}
                      onChange={(e) => {
                        setAutoConfig(prev => ({
                          ...prev,
                          enabledScenarios: e.target.checked
                            ? [...prev.enabledScenarios, def.type]
                            : prev.enabledScenarios.filter(t => t !== def.type)
                        }));
                      }}
                      className="mt-1 h-4 w-4 text-primary rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {def.icon}
                          <span className="font-medium text-gray-900">{def.name}</span>
                        </div>
                        <button
                          onClick={() => {
                            setEditingPrompt(def.type);
                            setEditingPromptValue(scenarioPrompts[def.type]);
                          }}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Edit3 size={12} />
                          编辑提示词
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{scenarioPrompts[def.type]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {editingPrompt && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  编辑提示词 - {SCENARIO_DEFINITIONS.find(d => d.type === editingPrompt)?.name}
                </h4>
                <textarea
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                  value={editingPromptValue}
                  onChange={(e) => setEditingPromptValue(e.target.value)}
                  placeholder="输入场景识别提示词..."
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setEditingPrompt(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      setScenarioPrompts(prev => ({ ...prev, [editingPrompt]: editingPromptValue }));
                      setEditingPrompt(null);
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
          <button 
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            onClick={() => alert('配置已保存')}
          >
            <Save size={16} />
            保存配置
          </button>
          <button 
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            onClick={() => alert('立即执行识别任务')}
          >
            <Zap size={16} />
            立即执行
          </button>
        </div>
      </div>
    </div>
  );

  // 渲染详情弹窗
  const renderDetailModal = () => {
    if (!showDetailModal || !detailRecord) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{detailRecord.callId}</h3>
              <p className="text-sm text-gray-500">
                {detailRecord.botName} · {detailRecord.customerPhone} · {detailRecord.startTime}
              </p>
            </div>
            <button 
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setShowDetailModal(false)}
            >
              <XCircle size={24} />
            </button>
          </div>

          {/* 内容 */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* 识别的场景 */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">识别的场景</h4>
              <div className="space-y-2">
                {detailRecord.scenarios.map((scenario, idx) => {
                  const def = SCENARIO_DEFINITIONS.find(d => d.type === scenario.type);
                  return (
                    <div key={idx} className={`p-4 rounded-lg border ${def?.bgColor} border-current`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {def?.icon}
                          <span className="font-medium">{scenario.name}</span>
                        </div>
                        <span className="text-sm">置信度: {scenario.confidence.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-gray-600">{scenario.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 对话内容 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">对话内容</h4>
              <div className="space-y-3">
                {detailRecord.transcription.map(turn => (
                  <div 
                    key={turn.id}
                    className={`flex gap-3 ${turn.speaker === 'customer' ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-xl ${
                      turn.speaker === 'customer'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-primary text-white'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${turn.speaker === 'customer' ? 'text-gray-500' : 'text-white/70'}`}>
                          {turn.speaker === 'customer' ? '客户' : '机器人'}
                        </span>
                        <span className={`text-xs ${turn.speaker === 'customer' ? 'text-gray-400' : 'text-white/50'}`}>
                          {turn.timestamp}秒
                        </span>
                      </div>
                      <p className="text-sm">{turn.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 底部操作 */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center justify-end">
              <button
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                onClick={() => setShowDetailModal(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Brain size={28} className="text-primary" />
          模型训练数据平台
        </h1>
        <p className="text-gray-500 mt-1">
          自动识别问题通话记录，持续提升机器人服务质量
        </p>
      </div>

      {/* 导航 */}
      {renderNav()}

      {/* 内容区域 */}
      <div>
        {activeView === 'records' && renderRecords()}
        {activeView === 'config' && renderConfig()}
      </div>

      {/* 弹窗 */}
      {renderDetailModal()}
    </div>
  );
};

export default ModelTraining;
