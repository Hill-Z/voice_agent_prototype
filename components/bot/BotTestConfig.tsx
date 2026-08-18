import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, Edit3, Play, Check, X, 
  Folder, FileText, MessageSquare, Tag, 
  Clock, RotateCcw, Eye, FolderPlus, ChevronLeft, ChevronRight, 
  ArrowUp, ArrowDown, Eraser
} from 'lucide-react';
import { BotConfiguration, TestCase, TestConversation, TestResult } from '../../types';
import { Input, TextArea } from '../ui/FormComponents';

// Mockup 测试数据
const MOCK_TEST_CASES: TestCase[] = [
  {
    id: 'case_001',
    name: '用户咨询产品价格',
    suiteName: '销售场景测试',
    sourceTag: '生产环境',
    conversations: [
      { id: 'conv_001_1', userInput: '你好，请问你们的产品多少钱？', expectedResponse: '您好，我们的产品有多个版本，基础版99元/月，专业版299元/月，企业版需要定制报价。您想了解哪个版本呢？', timestamp: Date.now() },
      { id: 'conv_001_2', userInput: '专业版有什么功能？', expectedResponse: '专业版包含基础版所有功能，另外支持多用户协作、高级数据分析、API接口对接等功能。', timestamp: Date.now() }
    ],
    expectedOutcome: '成功引导用户了解产品并询问需求',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'case_002',
    name: '用户要求退款',
    suiteName: '售后场景测试',
    sourceTag: '用户反馈',
    conversations: [
      { id: 'conv_002_1', userInput: '我要退款，你们的产品不好用', expectedResponse: '非常抱歉给您带来了不好的体验。能否告诉我具体遇到了什么问题呢？我们会尽力帮您解决。', timestamp: Date.now() },
      { id: 'conv_002_2', userInput: '就是不好用，我要退款', expectedResponse: '我理解您的心情。根据我们的退款政策，购买7天内可以申请无理由退款。我帮您转接售后专员处理好吗？', timestamp: Date.now() }
    ],
    expectedOutcome: '安抚用户情绪并引导至售后流程',
    createdAt: '2024-01-16T14:30:00Z',
    updatedAt: '2024-01-16T14:30:00Z'
  },
  {
    id: 'case_003',
    name: '用户询问技术支持',
    suiteName: '技术支持测试',
    sourceTag: '工单系统',
    conversations: [
      { id: 'conv_003_1', userInput: '系统登录不上怎么办？', expectedResponse: '请问您遇到什么错误提示了吗？可以尝试清除浏览器缓存或使用无痕模式登录。', timestamp: Date.now() },
      { id: 'conv_003_2', userInput: '提示密码错误，但我确定密码是对的', expectedResponse: '可能是密码过期了，建议您点击"忘记密码"重置一下。或者我帮您转接技术支持？', timestamp: Date.now() },
      { id: 'conv_003_3', userInput: '好的，帮我转接吧', expectedResponse: '好的，正在为您转接技术支持，请稍等。', timestamp: Date.now() }
    ],
    expectedOutcome: '提供解决方案并成功转接人工',
    createdAt: '2024-01-17T09:15:00Z',
    updatedAt: '2024-01-17T09:15:00Z'
  },
  {
    id: 'case_004',
    name: '用户咨询优惠活动',
    suiteName: '销售场景测试',
    sourceTag: '营销活动',
    conversations: [
      { id: 'conv_004_1', userInput: '现在有什么优惠活动吗？', expectedResponse: '目前我们有新春特惠活动，年付可享受8折优惠，还送3个月使用时长。', timestamp: Date.now() },
      { id: 'conv_004_2', userInput: '年付是多少钱？', expectedResponse: '专业版年付原价3588元，现在优惠价2870元，相当于每月只要239元。', timestamp: Date.now() }
    ],
    expectedOutcome: '成功介绍优惠活动并促成意向',
    createdAt: '2024-01-18T11:20:00Z',
    updatedAt: '2024-01-18T11:20:00Z'
  },
  {
    id: 'case_005',
    name: '用户投诉服务质量',
    suiteName: '售后场景测试',
    sourceTag: '投诉渠道',
    conversations: [
      { id: 'conv_005_1', userInput: '你们的服务太差了，我要投诉', expectedResponse: '非常抱歉让您不满意。请您详细说明一下遇到的问题，我会记录并反馈给相关部门。', timestamp: Date.now() }
    ],
    expectedOutcome: '记录投诉并安抚用户情绪',
    createdAt: '2024-01-19T16:45:00Z',
    updatedAt: '2024-01-19T16:45:00Z'
  },
  {
    id: 'case_006',
    name: '用户咨询会员权益',
    suiteName: '会员服务测试',
    sourceTag: '客服热线',
    conversations: [
      { id: 'conv_006_1', userInput: '我想了解一下会员有什么权益？', expectedResponse: '会员享有专属客服、优先发货、生日礼包、积分翻倍等多重权益。', timestamp: Date.now() },
      { id: 'conv_006_2', userInput: '积分可以兑换什么？', expectedResponse: '积分可以兑换优惠券、实物礼品、会员专属商品等。', timestamp: Date.now() },
      { id: 'conv_006_3', userInput: '怎么升级会员等级？', expectedResponse: '消费满一定金额即可升级，银卡需累计消费1000元，金卡需5000元，钻石卡需20000元。', timestamp: Date.now() }
    ],
    expectedOutcome: '详细介绍会员权益并引导消费',
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-01-20T09:00:00Z'
  },
  {
    id: 'case_007',
    name: '用户申请发票',
    suiteName: '会员服务测试',
    sourceTag: '在线客服',
    conversations: [
      { id: 'conv_007_1', userInput: '我需要开个发票', expectedResponse: '好的，请问您需要开具增值税普通发票还是专用发票？', timestamp: Date.now() },
      { id: 'conv_007_2', userInput: '普通发票就行', expectedResponse: '请提供您的发票抬头和邮箱地址，我们会在3个工作日内发送电子发票。', timestamp: Date.now() }
    ],
    expectedOutcome: '收集发票信息并告知流程',
    createdAt: '2024-01-21T11:30:00Z',
    updatedAt: '2024-01-21T11:30:00Z'
  },
  {
    id: 'case_008',
    name: '用户咨询物流状态',
    suiteName: '物流查询测试',
    sourceTag: 'APP咨询',
    conversations: [
      { id: 'conv_008_1', userInput: '我的订单到哪了？', expectedResponse: '请提供您的订单号，我帮您查询物流状态。', timestamp: Date.now() },
      { id: 'conv_008_2', userInput: '订单号是20240120001', expectedResponse: '您的订单已发货，目前在北京转运中心，预计明天送达。', timestamp: Date.now() },
      { id: 'conv_008_3', userInput: '能催一下吗？', expectedResponse: '好的，我帮您备注加急配送，快递员会优先处理您的订单。', timestamp: Date.now() }
    ],
    expectedOutcome: '查询物流并处理催单请求',
    createdAt: '2024-01-22T14:15:00Z',
    updatedAt: '2024-01-22T14:15:00Z'
  },
  {
    id: 'case_009',
    name: '用户修改收货地址',
    suiteName: '物流查询测试',
    sourceTag: '电话客服',
    conversations: [
      { id: 'conv_009_1', userInput: '我想修改收货地址', expectedResponse: '请提供您的订单号，我帮您查看是否可以修改。', timestamp: Date.now() },
      { id: 'conv_009_2', userInput: '订单号是20240121002', expectedResponse: '您的订单还未发货，可以修改地址。请提供新的收货地址。', timestamp: Date.now() },
      { id: 'conv_009_3', userInput: '北京市朝阳区xxx路xxx号', expectedResponse: '已为您更新收货地址，新的地址是：北京市朝阳区xxx路xxx号。请确认是否正确？', timestamp: Date.now() }
    ],
    expectedOutcome: '成功修改收货地址',
    createdAt: '2024-01-23T10:00:00Z',
    updatedAt: '2024-01-23T10:00:00Z'
  },
  {
    id: 'case_010',
    name: '用户咨询产品功能',
    suiteName: '产品咨询测试',
    sourceTag: '官网咨询',
    conversations: [
      { id: 'conv_010_1', userInput: '你们的产品支持API对接吗？', expectedResponse: '是的，我们的专业版和企业版都支持API对接，可以与您的系统无缝集成。', timestamp: Date.now() },
      { id: 'conv_010_2', userInput: 'API文档在哪里看？', expectedResponse: '登录后在"开发者中心"可以查看完整的API文档和示例代码。', timestamp: Date.now() }
    ],
    expectedOutcome: '解答API相关问题',
    createdAt: '2024-01-24T15:30:00Z',
    updatedAt: '2024-01-24T15:30:00Z'
  },
  {
    id: 'case_011',
    name: '用户咨询数据安全',
    suiteName: '产品咨询测试',
    sourceTag: '企业客户',
    conversations: [
      { id: 'conv_011_1', userInput: '你们的数据安全吗？', expectedResponse: '我们采用银行级加密技术，数据存储在阿里云，通过了ISO27001认证。', timestamp: Date.now() },
      { id: 'conv_011_2', userInput: '可以私有化部署吗？', expectedResponse: '企业版支持私有化部署，可以根据您的需求定制方案。需要我安排销售顾问联系您吗？', timestamp: Date.now() }
    ],
    expectedOutcome: '解答数据安全问题并引导销售',
    createdAt: '2024-01-25T09:45:00Z',
    updatedAt: '2024-01-25T09:45:00Z'
  },
  {
    id: 'case_012',
    name: '用户反馈bug',
    suiteName: '技术支持测试',
    sourceTag: '工单系统',
    conversations: [
      { id: 'conv_012_1', userInput: '你们的系统有bug，导出功能用不了', expectedResponse: '非常抱歉给您带来不便。请问您使用的是什么浏览器？导出时有什么错误提示吗？', timestamp: Date.now() },
      { id: 'conv_012_2', userInput: 'Chrome浏览器，点击导出没反应', expectedResponse: '建议您尝试清除浏览器缓存，或者使用无痕模式试试。如果还有问题，我帮您转接技术支持。', timestamp: Date.now() }
    ],
    expectedOutcome: '收集bug信息并提供解决方案',
    createdAt: '2024-01-26T16:20:00Z',
    updatedAt: '2024-01-26T16:20:00Z'
  },
  {
    id: 'case_013',
    name: '用户咨询产品对比',
    suiteName: '销售场景测试',
    sourceTag: '在线咨询',
    conversations: [
      { id: 'conv_013_1', userInput: '你们和竞品有什么区别？', expectedResponse: '我们的产品在稳定性、易用性和性价比方面都有优势。具体来说，我们提供7x24小时客服支持，数据安全保障更完善。', timestamp: Date.now() },
      { id: 'conv_013_2', userInput: '价格方面呢？', expectedResponse: '我们的定价更灵活，按需付费，不需要一次性投入大量资金。', timestamp: Date.now() }
    ],
    expectedOutcome: '突出产品优势并引导购买',
    createdAt: '2024-01-27T10:30:00Z',
    updatedAt: '2024-01-27T10:30:00Z'
  },
  {
    id: 'case_014',
    name: '用户要求试用',
    suiteName: '销售场景测试',
    sourceTag: '官网咨询',
    conversations: [
      { id: 'conv_014_1', userInput: '可以先试用吗？', expectedResponse: '可以的，我们提供14天免费试用，期间可以使用所有功能。', timestamp: Date.now() },
      { id: 'conv_014_2', userInput: '怎么开始试用？', expectedResponse: '您可以直接注册账号，无需绑定信用卡即可开始试用。', timestamp: Date.now() }
    ],
    expectedOutcome: '介绍试用政策并引导注册',
    createdAt: '2024-01-28T14:00:00Z',
    updatedAt: '2024-01-28T14:00:00Z'
  },
  {
    id: 'case_015',
    name: '用户投诉处理慢',
    suiteName: '售后场景测试',
    sourceTag: '投诉渠道',
    conversations: [
      { id: 'conv_015_1', userInput: '你们处理问题太慢了，我都等了三天', expectedResponse: '非常抱歉让您久等了。请问您的工单号是多少？我帮您查询一下处理进度。', timestamp: Date.now() },
      { id: 'conv_015_2', userInput: '工单号是20240125001', expectedResponse: '我查到了，您的工单正在处理中，预计今天下午会有结果。我帮您加急处理。', timestamp: Date.now() }
    ],
    expectedOutcome: '安抚用户并加快处理',
    createdAt: '2024-01-29T11:15:00Z',
    updatedAt: '2024-01-29T11:15:00Z'
  },
  {
    id: 'case_016',
    name: '用户咨询退款进度',
    suiteName: '售后场景测试',
    sourceTag: '电话客服',
    conversations: [
      { id: 'conv_016_1', userInput: '我申请的退款什么时候到账？', expectedResponse: '请提供您的退款申请单号，我帮您查询。', timestamp: Date.now() },
      { id: 'conv_016_2', userInput: '退款单号是20240126001', expectedResponse: '您的退款申请已审核通过，预计3-5个工作日到账。', timestamp: Date.now() }
    ],
    expectedOutcome: '查询退款进度并告知时间',
    createdAt: '2024-01-30T09:45:00Z',
    updatedAt: '2024-01-30T09:45:00Z'
  },
  {
    id: 'case_017',
    name: '用户咨询系统兼容性',
    suiteName: '技术支持测试',
    sourceTag: '在线客服',
    conversations: [
      { id: 'conv_017_1', userInput: '你们的系统支持什么浏览器？', expectedResponse: '我们支持Chrome、Firefox、Safari、Edge等主流浏览器，建议使用Chrome获得最佳体验。', timestamp: Date.now() },
      { id: 'conv_017_2', userInput: '手机上能用吗？', expectedResponse: '可以的，我们支持iOS和Android系统，您可以在应用商店下载我们的APP。', timestamp: Date.now() }
    ],
    expectedOutcome: '解答兼容性问题',
    createdAt: '2024-01-31T13:20:00Z',
    updatedAt: '2024-01-31T13:20:00Z'
  },
  {
    id: 'case_018',
    name: '用户咨询数据迁移',
    suiteName: '技术支持测试',
    sourceTag: '企业客户',
    conversations: [
      { id: 'conv_018_1', userInput: '从其他系统迁移数据方便吗？', expectedResponse: '我们提供专业的数据迁移服务，支持从主流系统导入数据。', timestamp: Date.now() },
      { id: 'conv_018_2', userInput: '需要额外收费吗？', expectedResponse: '企业版客户可以免费享受数据迁移服务，我们会安排技术专员协助您。', timestamp: Date.now() }
    ],
    expectedOutcome: '介绍数据迁移服务',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z'
  },
  {
    id: 'case_019',
    name: '用户咨询积分规则',
    suiteName: '会员服务测试',
    sourceTag: 'APP咨询',
    conversations: [
      { id: 'conv_019_1', userInput: '积分怎么获得？', expectedResponse: '消费、签到、邀请好友都可以获得积分。消费1元=1积分，签到每天5积分，邀请好友100积分。', timestamp: Date.now() },
      { id: 'conv_019_2', userInput: '积分有有效期吗？', expectedResponse: '积分有效期为1年，过期会自动清零，请及时使用。', timestamp: Date.now() }
    ],
    expectedOutcome: '详细介绍积分规则',
    createdAt: '2024-02-02T15:30:00Z',
    updatedAt: '2024-02-02T15:30:00Z'
  },
  {
    id: 'case_020',
    name: '用户申请会员延期',
    suiteName: '会员服务测试',
    sourceTag: '电话客服',
    conversations: [
      { id: 'conv_020_1', userInput: '我的会员快到期了，能延期吗？', expectedResponse: '可以的，您可以直接续费，续费后会员时间会累加。', timestamp: Date.now() },
      { id: 'conv_020_2', userInput: '续费有优惠吗？', expectedResponse: '续费可以享受9折优惠，活动期间还有额外赠送时长。', timestamp: Date.now() }
    ],
    expectedOutcome: '介绍续费政策',
    createdAt: '2024-02-03T11:00:00Z',
    updatedAt: '2024-02-03T11:00:00Z'
  },
  {
    id: 'case_021',
    name: '用户催促发货',
    suiteName: '物流查询测试',
    sourceTag: 'APP咨询',
    conversations: [
      { id: 'conv_021_1', userInput: '我的订单什么时候发货？', expectedResponse: '请提供您的订单号，我帮您查询。', timestamp: Date.now() },
      { id: 'conv_021_2', userInput: '订单号是20240202001', expectedResponse: '您的订单已打包，今天下午会发货，发货后会通知您。', timestamp: Date.now() }
    ],
    expectedOutcome: '查询发货状态并安抚用户',
    createdAt: '2024-02-04T14:20:00Z',
    updatedAt: '2024-02-04T14:20:00Z'
  },
  {
    id: 'case_022',
    name: '用户申请退换货',
    suiteName: '物流查询测试',
    sourceTag: '电话客服',
    conversations: [
      { id: 'conv_022_1', userInput: '收到的商品有问题，想退货', expectedResponse: '非常抱歉给您带来不便。请问商品有什么问题？是否影响二次销售？', timestamp: Date.now() },
      { id: 'conv_022_2', userInput: '包装破损了', expectedResponse: '好的，我们会安排快递上门取件，免费为您更换。请问您方便的时间是？', timestamp: Date.now() }
    ],
    expectedOutcome: '处理退换货申请',
    createdAt: '2024-02-05T10:15:00Z',
    updatedAt: '2024-02-05T10:15:00Z'
  },
  {
    id: 'case_023',
    name: '用户咨询产品路线图',
    suiteName: '产品咨询测试',
    sourceTag: '企业客户',
    conversations: [
      { id: 'conv_023_1', userInput: '你们未来有什么新功能计划？', expectedResponse: '我们计划在Q2推出AI智能分析功能，Q3上线移动端优化，Q4开放API接口。', timestamp: Date.now() },
      { id: 'conv_023_2', userInput: '可以提前体验吗？', expectedResponse: '企业版客户可以申请参与内测，提前体验新功能。', timestamp: Date.now() }
    ],
    expectedOutcome: '介绍产品规划',
    createdAt: '2024-02-06T09:30:00Z',
    updatedAt: '2024-02-06T09:30:00Z'
  },
  {
    id: 'case_024',
    name: '用户咨询SLA保障',
    suiteName: '产品咨询测试',
    sourceTag: '技术评估',
    conversations: [
      { id: 'conv_024_1', userInput: '你们的服务可用性有保障吗？', expectedResponse: '我们提供99.9%的服务可用性保障，如果达不到会按协议赔偿。', timestamp: Date.now() },
      { id: 'conv_024_2', userInput: '数据备份呢？', expectedResponse: '我们采用多地容灾备份，数据实时同步，确保数据安全。', timestamp: Date.now() }
    ],
    expectedOutcome: '介绍SLA和数据保障',
    createdAt: '2024-02-07T16:00:00Z',
    updatedAt: '2024-02-07T16:00:00Z'
  }
];

interface BotTestConfigProps {
  config: BotConfiguration;
  updateField: <K extends keyof BotConfiguration>(key: K, value: BotConfiguration[K]) => void;
}

const BotTestConfig: React.FC<BotTestConfigProps> = ({ config, updateField }) => {
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<TestCase | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [showResultModal, setShowResultModal] = useState(false);
  const [viewingResult, setViewingResult] = useState<TestResult | null>(null);
  const [showNewSuiteModal, setShowNewSuiteModal] = useState(false);
  const [newSuiteName, setNewSuiteName] = useState('');
  // 筛选状态
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);

  // 获取所有测试用例（如果没有则使用mock数据）
  const testCases = config.testCases?.length ? config.testCases : MOCK_TEST_CASES;

  // 按测试集名称聚合测试用例
  const suites = useMemo(() => {
    const suiteMap = new Map<string, TestCase[]>();
    
    // 确保默认测试集存在
    suiteMap.set('通话记录测试集', []);
    
    // 添加所有测试用例到对应测试集
    testCases.forEach(tc => {
      if (!suiteMap.has(tc.suiteName)) {
        suiteMap.set(tc.suiteName, []);
      }
      suiteMap.get(tc.suiteName)!.push(tc);
    });
    
    return Array.from(suiteMap.entries()).map(([name, cases]) => {
      // 统计测试结果
      const passedCount = cases.filter(tc => testResults[tc.id]?.status === 'passed').length;
      const failedCount = cases.filter(tc => testResults[tc.id]?.status === 'failed').length;
      const runningCount = cases.filter(tc => testResults[tc.id]?.status === 'running').length;
      
      return {
        name,
        caseCount: cases.length,
        testCases: cases,
        passedCount,
        failedCount,
        runningCount
      };
    });
  }, [testCases, testResults]);

  // 筛选测试用例
  const filteredTestCases = useMemo(() => {
    if (!selectedSuite) return [];
    
    let cases = testCases.filter(tc => tc.suiteName === selectedSuite);
    
    // 按状态筛选
    if (filterStatus.length > 0) {
      cases = cases.filter(tc => {
        const status = testResults[tc.id]?.status || 'pending';
        return filterStatus.includes(status);
      });
    }
    
    return cases;
  }, [testCases, selectedSuite, testResults, filterStatus]);

  // 删除测试集合
  const deleteSuite = (suiteName: string) => {
    // 禁止删除默认测试集
    if (suiteName === '通话记录测试集') {
      alert('默认测试集不可删除');
      return;
    }
    
    if (!confirm(`确定要删除测试集 "${suiteName}" 及其所有测试用例吗？`)) return;
    
    const updatedCases = (config.testCases || []).filter(tc => tc.suiteName !== suiteName);
    updateField('testCases', updatedCases);
    
    if (selectedSuite === suiteName) {
      setSelectedSuite(null);
      setSelectedCase(null);
      setIsEditing(false);
    }
  };

  // 初始化时如果有测试集，默认选中第一个；如果没有，创建默认测试集
  useEffect(() => {
    if (suites.length > 0 && !selectedSuite) {
      setSelectedSuite(suites[0].name);
    } else if (suites.length === 0) {
      // 创建默认测试集
      const defaultSuiteName = '通话记录测试集';
      setSelectedSuite(defaultSuiteName);
    }
  }, [suites]);

  // 创建新测试集
  const createNewSuite = () => {
    if (!newSuiteName.trim()) return;
    const suiteName = newSuiteName.trim();
    
    // 检查测试集是否已存在
    if (suites.some(s => s.name === suiteName)) {
      alert('测试集名称已存在，请使用其他名称');
      return;
    }
    
    setSelectedSuite(suiteName);
    setNewSuiteName('');
    setShowNewSuiteModal(false);
    // 自动进入新建测试用例模式
    createTestCase(suiteName);
  };

  // 创建新测试用例
  const createTestCase = (suiteName?: string) => {
    const targetSuite = suiteName || selectedSuite;
    if (!targetSuite) return;
    
    const newCase: TestCase = {
      id: `case_${Date.now()}`,
      name: '',
      suiteName: targetSuite,
      sourceTag: '',
      conversations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSelectedCase(newCase);
    setIsEditing(true);
  };

  // 保存测试用例
  const saveTestCase = () => {
    if (!selectedCase) return;
    
    // 检查用例名称是否为空
    if (!selectedCase.name.trim()) {
      alert('请输入用例名称');
      return;
    }
    
    // 检查是否有对话轮次
    if (selectedCase.conversations.length === 0) {
      alert('请至少添加一个对话轮次');
      return;
    }

    const finalCase = {
      ...selectedCase,
      id: selectedCase.id.startsWith('case_') && !selectedCase.id.includes('_new') 
        ? selectedCase.id 
        : `case_${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    
    const updatedCases = selectedCase.id.startsWith('case_') && !config.testCases?.find(tc => tc.id === selectedCase.id)
      ? [...(config.testCases || []), finalCase]
      : (config.testCases || []).map(tc => tc.id === selectedCase.id ? finalCase : tc);
    
    updateField('testCases', updatedCases);
    setIsEditing(false);
    setSelectedCase(finalCase);
    
    // 如果当前选中的测试集不是这个用例的测试集，切换到该测试集
    if (selectedSuite !== finalCase.suiteName) {
      setSelectedSuite(finalCase.suiteName);
    }
  };

  // 删除测试用例
  const deleteTestCase = (caseId: string) => {
    if (!confirm('确定要删除这个测试用例吗？')) return;
    
    const updatedCases = (config.testCases || []).filter(tc => tc.id !== caseId);
    updateField('testCases', updatedCases);
    if (selectedCase?.id === caseId) {
      setSelectedCase(null);
      setIsEditing(false);
    }
  };

  // 添加对话轮次
  const addConversation = () => {
    if (!selectedCase) return;
    const newConv: TestConversation = {
      id: `conv_${Date.now()}`,
      userInput: '',
      timestamp: Date.now()
    };
    setSelectedCase({
      ...selectedCase,
      conversations: [...selectedCase.conversations, newConv]
    });
  };

  // 更新对话轮次
  const updateConversation = (index: number, field: 'userInput' | 'expectedResponse', value: string) => {
    if (!selectedCase) return;
    const updatedConvs = [...selectedCase.conversations];
    updatedConvs[index] = { ...updatedConvs[index], [field]: value };
    setSelectedCase({ ...selectedCase, conversations: updatedConvs });
  };

  // 删除对话轮次
  const deleteConversation = (index: number) => {
    if (!selectedCase) return;
    const updatedConvs = selectedCase.conversations.filter((_, i) => i !== index);
    setSelectedCase({ ...selectedCase, conversations: updatedConvs });
  };

  // 运行单个测试用例
  const runSingleTest = async (testCase: TestCase) => {
    setTestResults(prev => ({
      ...prev,
      [testCase.id]: { caseId: testCase.id, status: 'running', actualResponses: [], duration: 0 }
    }));

    // 模拟测试执行
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));
    
    // 模拟LLM返回结果
    const mockResponses = testCase.conversations.map((conv, idx) => {
      const responses = [
        `您好，感谢您的咨询。关于您的问题，我可以为您提供详细解答。`,
        `我理解您的需求，让我为您查询一下相关信息。`,
        `好的，我已经记录了您的需求，稍后会安排专人与您联系。`,
        `非常感谢您的反馈，我们会持续改进服务质量。`
      ];
      return responses[idx % responses.length];
    });

    // 测试运行后重置状态为需要人工标记
    const result: TestResult = {
      caseId: testCase.id,
      status: 'pending',
      actualResponses: mockResponses,
      duration: Date.now() - startTime,
      completedAt: new Date().toISOString()
    };

    setTestResults(prev => ({ ...prev, [testCase.id]: result }));
  };

  // 批量运行测试集（只测试筛选后的用例）
  const runSuiteTests = async (suiteName: string) => {
    // 使用筛选后的测试用例
    const suiteCases = filteredTestCases;
    for (const tc of suiteCases) {
      await runSingleTest(tc);
      // 间隔一点时间，避免同时运行
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  // 查看测试结果
  const viewResult = (caseId: string) => {
    const result = testResults[caseId];
    if (result) {
      setViewingResult(result);
      setShowResultModal(true);
    }
  };

  // 人工标记测试结果
  const markTestResult = (caseId: string, passed: boolean) => {
    const existingResult = testResults[caseId] || {
      caseId,
      status: 'pending',
      actualResponses: [],
      duration: 0
    };
    
    const updatedResult: TestResult = {
      ...existingResult,
      status: passed ? 'passed' : 'failed',
      completedAt: new Date().toISOString()
    };
    
    setTestResults(prev => ({ ...prev, [caseId]: updatedResult }));
  };

  // 测试用例导航
  const navigateTestCase = (direction: 'prev' | 'next') => {
    if (!selectedSuite || !selectedCase) return;
    
    const suiteCases = testCases
      .filter(tc => tc.suiteName === selectedSuite)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    const currentIndex = suiteCases.findIndex(tc => tc.id === selectedCase.id);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? suiteCases.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === suiteCases.length - 1 ? 0 : currentIndex + 1;
    }
    
    setSelectedCase(suiteCases[newIndex]);
    setIsEditing(false);
  };

  return (
    <div className="flex h-[calc(100vh-240px)] min-h-[500px]">
      {/* 左侧：测试集列表 */}
      <div className="w-48 border-r border-gray-200 bg-gray-50 flex flex-col">
        <div className="p-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center text-sm">
            <Folder size={14} className="mr-1.5" /> 测试集
          </h3>
          <button
            onClick={() => setShowNewSuiteModal(true)}
            className="p-1.5 text-primary hover:bg-sky-100 rounded"
            title="新建测试集"
          >
            <FolderPlus size={16} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {suites
            .sort((a, b) => {
              // 默认测试集排在最前面
              if (a.name === '通话记录测试集') return -1;
              if (b.name === '通话记录测试集') return 1;
              return a.name.localeCompare(b.name);
            })
            .map(suite => (
              <div
                key={suite.name}
                className={`p-3 cursor-pointer border-b border-gray-100 transition-colors ${
                  selectedSuite === suite.name ? 'bg-white border-l-4 border-l-primary' : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span 
                    className="font-medium text-sm text-slate-700 truncate flex-1"
                    onClick={() => { setSelectedSuite(suite.name); setSelectedCase(null); setIsEditing(false); }}
                  >
                    {suite.name === '通话记录测试集' && <span className="text-primary font-semibold">[默认]</span>} {suite.name}
                  </span>
                  <div className="flex items-center space-x-1 ml-2">
                    <span className="text-xs bg-gray-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                      {suite.caseCount}
                    </span>
                    {suite.name !== '通话记录测试集' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSuite(suite.name);
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="删除测试集"
                      >
                        <Eraser size={12} />
                      </button>
                    )}
                  </div>
                </div>
                {suite.passedCount > 0 || suite.failedCount > 0 || suite.runningCount > 0 ? (
                  <div className="flex items-center space-x-1.5">
                    {suite.passedCount > 0 && (
                      <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.25 rounded-full flex items-center">
                        <Check size={10} className="mr-0.5" /> {suite.passedCount}
                      </span>
                    )}
                    {suite.failedCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.25 rounded-full flex items-center">
                        <X size={10} className="mr-0.5" /> {suite.failedCount}
                      </span>
                    )}
                    {suite.runningCount > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.25 rounded-full flex items-center">
                        <RotateCcw size={10} className="mr-0.5 animate-spin" /> {suite.runningCount}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
        </div>

        {selectedSuite && (
          <div className="p-3 border-t border-gray-200 bg-white">
            <button
              onClick={() => runSuiteTests(selectedSuite)}
              className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-sky-600 flex items-center justify-center"
            >
              <Play size={14} className="mr-2" /> 批量测试
            </button>
          </div>
        )}
      </div>

      {/* 中间：测试用例列表 */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-3 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center text-sm">
              <FileText size={14} className="mr-1.5" /> 测试用例
            </h3>
            {selectedSuite && (
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[140px]">{selectedSuite}</p>
            )}
          </div>
          <button
            onClick={() => selectedSuite && createTestCase()}
            disabled={!selectedSuite}
            className={`p-1.5 rounded ${
              selectedSuite 
                ? 'text-primary hover:bg-sky-50' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title={selectedSuite ? "新建测试用例" : "请先选择测试集"}
          >
            <Plus size={18} />
          </button>
        </div>
        
        {/* 筛选功能 */}
        {selectedSuite && (
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700">状态筛选</p>
              {filterStatus.length > 0 && (
                <button
                  onClick={() => {
                    setFilterStatus([]);
                  }}
                  className="text-xs text-primary hover:underline flex items-center"
                >
                  <Eraser size={12} className="mr-1" /> 清除筛选
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'pending', label: '待标记', color: 'bg-gray-100 text-gray-600', selectedColor: 'bg-gray-600 text-white' },
                { value: 'passed', label: '通过', color: 'bg-green-100 text-green-600', selectedColor: 'bg-green-600 text-white' },
                { value: 'failed', label: '失败', color: 'bg-red-100 text-red-600', selectedColor: 'bg-red-600 text-white' },
                { value: 'running', label: '运行中', color: 'bg-blue-100 text-blue-600', selectedColor: 'bg-blue-600 text-white' }
              ].map(status => {
                const isSelected = filterStatus.includes(status.value);
                return (
                  <button
                    key={status.value}
                    onClick={() => {
                      setFilterStatus(prev => 
                        isSelected 
                          ? prev.filter(s => s !== status.value) 
                          : [...prev, status.value]
                      );
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      isSelected ? status.selectedColor : status.color
                    }`}
                  >
                    {status.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {selectedSuite ? (
            filteredTestCases.map(tc => {
              const result = testResults[tc.id];
              return (
                <div
                  key={tc.id}
                  onClick={() => { setSelectedCase(tc); setIsEditing(false); }}
                  className={`p-3 cursor-pointer border-b border-gray-100 transition-colors ${
                    selectedCase?.id === tc.id ? 'bg-sky-50 border-l-4 border-l-primary' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-700 truncate">{tc.name || '未命名用例'}</div>
                      <div className="flex items-center mt-1 space-x-2">
                        {tc.sourceTag && (
                          <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                            {tc.sourceTag}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">{tc.conversations.length} 轮</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-0.5 ml-1">
                      {result?.status === 'passed' && (
                        <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">
                          通过
                        </span>
                      )}
                      {result?.status === 'failed' && (
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                          失败
                        </span>
                      )}
                      {result?.status === 'running' && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full animate-pulse">
                          运行中
                        </span>
                      )}
                      {result?.status === 'pending' && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                          待标记
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400">
              <Folder size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">请选择左侧测试集</p>
            </div>
          )}
          
          {selectedSuite && filteredTestCases.length === 0 && (
            <div className="p-6 text-center text-slate-400 text-sm">
              {filterStatus.length > 0 || filterTags.length > 0 ? '没有符合条件的测试用例' : '该测试集暂无用例'}
            </div>
          )}
        </div>
      </div>

      {/* 右侧：测试用例详情/编辑 */}
      <div className="flex-1 bg-white flex flex-col">
        {isEditing && selectedCase ? (
          // 编辑模式
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {selectedCase.id.startsWith('case_') && !config.testCases?.find(tc => tc.id === selectedCase.id) ? '新建测试用例' : '编辑测试用例'}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => { setIsEditing(false); setSelectedCase(null); }}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-gray-200 rounded"
                >
                  取消
                </button>
                <button
                  onClick={saveTestCase}
                  className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-sky-600"
                >
                  保存
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="用例名称"
                  value={selectedCase.name}
                  onChange={(e) => setSelectedCase({ ...selectedCase, name: e.target.value })}
                  placeholder="请输入用例名称"
                />
                <Input
                  label="所属测试集"
                  value={selectedCase.suiteName}
                  onChange={(e) => setSelectedCase({ ...selectedCase, suiteName: e.target.value })}
                  placeholder="测试集名称"
                />
              </div>

              <Input
                label="来源标注"
                value={selectedCase.sourceTag || ''}
                onChange={(e) => setSelectedCase({ ...selectedCase, sourceTag: e.target.value })}
                placeholder="如：生产环境、用户反馈等"
              />

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center">
                    <MessageSquare size={14} className="mr-1" /> 对话轮次
                    <div className="ml-2 relative group">
                      <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xs cursor-help hover:bg-gray-200 transition-colors">
                        ?
                      </div>
                      <div className="absolute left-0 top-full mt-1 w-60 bg-white rounded-lg shadow-lg p-2 text-xs text-slate-600 border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <div className="font-medium mb-1">功能说明</div>
                        <div>开启开场白功能时，由机器人优先发起对话</div>
                        <div>关闭该功能时，则由用户率先发起交流</div>
                      </div>
                    </div>
                  </label>
                  <button
                    onClick={addConversation}
                    className="text-xs bg-primary text-white px-2.5 py-1 rounded hover:bg-sky-600 flex items-center"
                  >
                    <Plus size={12} className="mr-1" /> 添加轮次
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedCase.conversations.map((conv, index) => (
                    <div key={conv.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-slate-500">第 {index + 1} 轮</span>
                        <button
                          onClick={() => deleteConversation(index)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <TextArea
                        value={conv.userInput}
                        onChange={(e) => updateConversation(index, 'userInput', e.target.value)}
                        placeholder="用户输入内容"
                        rows={2}
                        className="mb-2"
                      />
                      <TextArea
                        value={conv.expectedResponse || ''}
                        onChange={(e) => updateConversation(index, 'expectedResponse', e.target.value)}
                        placeholder="期望的机器人回复（可选）"
                        rows={2}
                      />
                    </div>
                  ))}

                  {selectedCase.conversations.length === 0 && (
                    <div className="text-center py-6 text-slate-400 border border-dashed border-gray-300 rounded-lg">
                      <MessageSquare size={24} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">点击上方按钮添加对话轮次</p>
                    </div>
                  )}
                </div>
              </div>

              <TextArea
                label="预期结果"
                value={selectedCase.expectedOutcome || ''}
                onChange={(e) => setSelectedCase({ ...selectedCase, expectedOutcome: e.target.value })}
                placeholder="描述期望的测试结果"
                rows={2}
              />
            </div>
          </div>
        ) : selectedCase ? (
          // 查看模式
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 truncate">{selectedCase.name || '未命名用例'}</h3>
                <div className="flex items-center mt-0.5 space-x-3 text-xs text-slate-500">
                  <span className="flex items-center"><Folder size={12} className="mr-1" /> {selectedCase.suiteName}</span>
                  {selectedCase.sourceTag && (
                    <span className="flex items-center"><Tag size={12} className="mr-1" /> {selectedCase.sourceTag}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={() => runSingleTest(selectedCase)}
                  disabled={testResults[selectedCase.id]?.status === 'running'}
                  className="p-2 text-primary hover:bg-sky-100 rounded"
                  title="运行测试"
                >
                  {testResults[selectedCase.id]?.status === 'running' ? (
                    <RotateCcw size={16} className="animate-spin" />
                  ) : (
                    <Play size={16} />
                  )}
                </button>
                {testResults[selectedCase.id] && (
                  <button
                    onClick={() => viewResult(selectedCase.id)}
                    className="p-2 text-slate-600 hover:bg-gray-200 rounded"
                    title="查看结果"
                  >
                    <Eye size={16} />
                  </button>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-slate-600 hover:bg-gray-200 rounded"
                  title="编辑"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => deleteTestCase(selectedCase.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                  title="删除"
                >
                  <Eraser size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* 测试结果概览 */}
              {testResults[selectedCase.id] && (
                <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {testResults[selectedCase.id].status === 'passed' && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
                          通过
                        </span>
                      )}
                      {testResults[selectedCase.id].status === 'failed' && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                          失败
                        </span>
                      )}
                      {testResults[selectedCase.id].status === 'running' && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium animate-pulse">
                          运行中
                        </span>
                      )}
                      {testResults[selectedCase.id].status === 'pending' && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                          待标记
                        </span>
                      )}
                      <span className="text-sm text-slate-600">
                        测试结果
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      <Clock size={12} className="inline mr-1" />
                      {testResults[selectedCase.id].duration}ms
                    </span>
                  </div>
                </div>
              )}

              {/* 对话轮次展示 */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-slate-700 mb-2">对话脚本</h4>
                {selectedCase.conversations.map((conv, index) => (
                  <div key={conv.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-slate-400 mb-2">第 {index + 1} 轮</div>
                    <div className="mb-2">
                      <div className="text-xs text-slate-500 mb-1">用户输入：</div>
                      <div className="text-sm text-slate-700 bg-white p-2 rounded border border-gray-200">
                        {conv.userInput || '（空）'}
                      </div>
                    </div>
                    {conv.expectedResponse && (
                      <div className="mb-2">
                        <div className="text-xs text-slate-500 mb-1">期望回复：</div>
                        <div className="text-sm text-slate-600 bg-orange-50 p-2 rounded border border-orange-100">
                          {conv.expectedResponse}
                        </div>
                      </div>
                    )}
                    
                    {/* 实际返回结果 */}
                    {testResults[selectedCase.id]?.actualResponses[index] && (
                      <div className="mt-2">
                        <div className="text-xs text-slate-500 mb-1">实际返回：</div>
                        <div className={`text-sm p-2 rounded border ${
                          testResults[selectedCase.id].status === 'passed' 
                            ? 'bg-green-50 border-green-200 text-green-700' 
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          {testResults[selectedCase.id].actualResponses[index]}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {selectedCase.conversations.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                    <p>暂无对话内容</p>
                  </div>
                )}
              </div>

              {selectedCase.expectedOutcome && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-xs text-slate-500 mb-1">预期结果：</div>
                  <div className="text-sm text-slate-700">{selectedCase.expectedOutcome}</div>
                </div>
              )}
            </div>

            {/* 底部固定操作栏 */}
            <div className="border-t border-gray-200 bg-white p-3 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => navigateTestCase('prev')}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-gray-100 rounded flex items-center"
                  title="上一条"
                >
                  <ChevronLeft size={16} className="mr-1" /> 上一条
                </button>
                <button
                  onClick={() => navigateTestCase('next')}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-gray-100 rounded flex items-center"
                  title="下一条"
                >
                  下一条 <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
              {testResults[selectedCase.id] && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => markTestResult(selectedCase.id, true)}
                    className="px-4 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
                  >
                    <Check size={14} className="mr-1" /> 标记通过
                  </button>
                  <button
                    onClick={() => markTestResult(selectedCase.id, false)}
                    className="px-4 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 flex items-center"
                  >
                    <X size={14} className="mr-1" /> 标记失败
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // 空状态
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">请选择或创建一个测试用例</p>
            </div>
          </div>
        )}
      </div>

      {/* 新建测试集弹窗 */}
      {showNewSuiteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">新建测试集</h3>
              <button 
                onClick={() => { setShowNewSuiteModal(false); setNewSuiteName(''); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <Input
                label="测试集名称"
                value={newSuiteName}
                onChange={(e) => setNewSuiteName(e.target.value)}
                placeholder="请输入测试集名称"
                autoFocus
              />
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex justify-end space-x-2">
              <button 
                onClick={() => { setShowNewSuiteModal(false); setNewSuiteName(''); }}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-gray-100 rounded"
              >
                取消
              </button>
              <button 
                onClick={createNewSuite}
                disabled={!newSuiteName.trim()}
                className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-sky-600 disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 测试结果详情弹窗 */}
      {showResultModal && viewingResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">测试结果详情</h3>
              <button 
                onClick={() => setShowResultModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className={`p-3 rounded-lg ${
                viewingResult.status === 'passed' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  {viewingResult.status === 'passed' ? (
                    <Check size={18} className="text-green-500 mr-2" />
                  ) : (
                    <X size={18} className="text-red-500 mr-2" />
                  )}
                  <span className="font-medium">
                    {viewingResult.status === 'passed' ? '测试通过' : '测试失败'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  耗时：{viewingResult.duration}ms | 完成时间：{viewingResult.completedAt ? new Date(viewingResult.completedAt).toLocaleString() : '-'}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-slate-700 text-sm">LLM返回内容</h4>
                {viewingResult.actualResponses.map((response, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-xs text-slate-400 mb-1">第 {idx + 1} 轮回复</div>
                    <div className="text-sm text-slate-700">{response}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotTestConfig;