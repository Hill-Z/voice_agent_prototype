// 任务流程配置的数据和纯函数，页面层只负责展示与交互。
import {
  LongTermFlowDefinition,
  LongTermFlowEdge,
  LongTermFlowFilter,
  LongTermFlowLane,
  LongTermFlowNode,
  LongTermFlowNodeConfig,
  LongTermFlowNodeType,
  LongTermFlowRun,
  LongTermFlowRunStore,
  LongTermFlowScenarioType,
  LongTermFlowSortConfig,
  LongTermFlowStatus,
  LongTermFlowSummary,
} from './longTermFlowTypes';

const BASE_LANES: LongTermFlowLane[] = [
  { id: '系统调度', description: '导入、定时检查、外部事件监听和任务状态流转。' },
  { id: '用户沟通 Agent', description: '外呼、诉求收集、承诺还款和结果确认。' },
  { id: '商家协商 Agent', description: '联系商家、收集反馈和协商方案。' },
  { id: '风控决策 Agent', description: '规则判断、金额阈值、证据完整性和自动决策。' },
  { id: '人工处理', description: '异常兜底、争议审核和高风险任务接管。' },
];

function createConfig(overrides: Partial<LongTermFlowNodeConfig>): LongTermFlowNodeConfig {
  return {
    owner: '系统调度器',
    goal: '完成当前节点的业务处理并输出明确结果。',
    inputVariables: [],
    outputVariables: [],
    retryCount: 1,
    fallback: '失败时进入异常队列并通知负责人。',
    prompt: '按执行目标处理当前任务，并记录处理结果。',
    visibleFunctionIds: [],
    transitionFunctionIds: [],
    readStateKeys: [],
    writeStateKeys: [],
    handoffSummaryTemplate: '客户：{{customer_name}}；当前节点：{{node_name}}；处理摘要：{{summary}}。',
    ...overrides,
  };
}

function createNode(node: Omit<LongTermFlowNode, 'dependsOn'> & { dependsOn?: string[] }): LongTermFlowNode {
  return {
    dependsOn: [],
    ...node,
  };
}

const collectionNodes: LongTermFlowNode[] = [
  createNode({
    id: 'collection_import',
    type: '触发器',
    lane: '系统调度',
    title: '导入逾期名单',
    subtitle: '批量启动任务',
    description: '从账务系统读取逾期名单并创建任务实例。',
    dayOffset: 0,
    position: { x: 80, y: 70 },
    output: '待外呼任务',
    riskLevel: '低',
    config: createConfig({
      owner: '系统调度器',
      goal: '筛选符合外呼规则的逾期用户。',
      inputVariables: ['customer_id', 'overdue_amount', 'overdue_days'],
      outputVariables: ['task_id', 'batch_id'],
      toolName: '逾期名单同步接口',
      toolCall: {
        toolId: 'sync_overdue_customers',
        toolName: '逾期名单同步接口',
        parameterMappings: ['overdue_days -> filter.overdueDays', 'overdue_amount -> filter.minAmount'],
        timeoutSeconds: 30,
        idempotencyKey: 'batch_id',
        permissionScope: '账务名单读取',
      },
      visibleFunctionIds: ['sync_overdue_customers'],
      writeStateKeys: ['task_id', 'batch_id'],
    }),
  }),
  createNode({
    id: 'collection_first_call',
    type: 'Agent',
    lane: '用户沟通 Agent',
    title: '首次外呼',
    subtitle: '承诺还款',
    description: '确认还款意愿并记录承诺日期。',
    dayOffset: 0,
    position: { x: 360, y: 190 },
    dependsOn: ['collection_import'],
    output: '承诺日期',
    riskLevel: '中',
    config: createConfig({
      owner: '催收外呼 Agent',
      goal: '完成合规外呼并收集还款承诺。',
      inputVariables: ['customer_name', 'overdue_amount', 'bill_date'],
      outputVariables: ['promise_date', 'customer_attitude'],
      retryCount: 2,
      prompt: '用合规、克制的语气确认客户是否可以还款，并记录承诺日期。',
      visibleFunctionIds: ['query_customer_profile'],
      transitionFunctionIds: ['goto_wait_after_promise'],
      readStateKeys: ['task_id'],
      writeStateKeys: ['promise_date', 'customer_attitude'],
    }),
  }),
  createNode({
    id: 'collection_wait_3_days',
    type: '等待',
    lane: '系统调度',
    title: '等待 3 天',
    subtitle: '恢复检查',
    description: '按承诺日期恢复流程并检查支付状态。',
    dayOffset: 3,
    position: { x: 660, y: 70 },
    dependsOn: ['collection_first_call'],
    output: '检查触发时间',
    riskLevel: '低',
    config: createConfig({
      owner: '系统调度器',
      goal: '在承诺日期后恢复流程。',
      inputVariables: ['promise_date'],
      outputVariables: ['resume_at'],
      retryCount: 0,
      waitPolicy: 'promise_date + 3d，跳过夜间保护时段。',
      waitRule: {
        mode: '日期字段',
        amount: 3,
        unit: '天',
        dateField: 'promise_date',
        resumeEvent: 'payment_status_changed',
        quietHours: '22:00-09:00 不触达',
        timeoutTarget: '检查是否已还款',
      },
      delayProfileId: 'delay_3d_payment_check',
      readStateKeys: ['promise_date'],
      writeStateKeys: ['resume_at'],
    }),
  }),
  createNode({
    id: 'collection_check_payment',
    type: '条件',
    lane: '系统调度',
    title: '检查是否已还款',
    subtitle: '支付状态分支',
    description: '查询支付结果并决定后续流转。',
    dayOffset: 3,
    position: { x: 940, y: 70 },
    dependsOn: ['collection_wait_3_days'],
    output: '还款判断',
    riskLevel: '中',
    config: createConfig({
      owner: '系统调度器',
      goal: '用支付结果判断是否继续跟进。',
      inputVariables: ['task_id', 'customer_id'],
      outputVariables: ['paid', 'paid_amount'],
      condition: 'paid_amount >= overdue_amount',
      conditionRule: {
        field: 'paid_amount',
        operator: '大于等于',
        value: 'overdue_amount',
        defaultTarget: '第二次外呼',
        description: '支付金额覆盖逾期金额时结束任务，否则进入二次跟进。',
      },
      toolName: '还款状态查询接口',
      toolCall: {
        toolId: 'query_payment_status',
        toolName: '还款状态查询接口',
        parameterMappings: ['customer_id -> customerId', 'task_id -> taskId'],
        timeoutSeconds: 20,
        idempotencyKey: 'task_id',
        permissionScope: '账务支付状态读取',
      },
      primaryFunctionId: 'query_payment_status',
      transitionFunctionIds: ['goto_done_if_paid', 'goto_second_call_if_unpaid'],
      readStateKeys: ['task_id'],
      writeStateKeys: ['paid', 'paid_amount'],
    }),
  }),
  createNode({
    id: 'collection_second_call',
    type: 'Agent',
    lane: '用户沟通 Agent',
    title: '第二次外呼',
    subtitle: '未还款跟进',
    description: '确认未还款原因并更新跟进结果。',
    dayOffset: 3,
    position: { x: 1220, y: 190 },
    dependsOn: ['collection_check_payment'],
    output: '跟进原因',
    riskLevel: '中',
    config: createConfig({
      owner: '催收外呼 Agent',
      goal: '确认未还款原因并记录新的处理结果。',
      inputVariables: ['overdue_amount', 'promise_date', 'call_summary'],
      outputVariables: ['delay_reason', 'next_promise_date', 'need_handoff'],
      retryCount: 2,
      prompt: '基于历史摘要继续沟通，确认未还款原因和下一步处理方式。',
      visibleFunctionIds: ['query_customer_profile'],
      transitionFunctionIds: ['goto_7d_wait', 'goto_manual_review'],
      readStateKeys: ['paid', 'promise_date'],
      writeStateKeys: ['delay_reason', 'need_handoff'],
    }),
  }),
  createNode({
    id: 'collection_wait_7_days',
    type: '等待',
    lane: '系统调度',
    title: '等待 7 天',
    subtitle: '最终检查',
    description: '按二次跟进结果恢复流程。',
    dayOffset: 10,
    position: { x: 1500, y: 70 },
    dependsOn: ['collection_second_call'],
    output: '最终检查时间',
    riskLevel: '低',
    config: createConfig({
      owner: '系统调度器',
      inputVariables: ['next_promise_date'],
      outputVariables: ['final_check_at'],
      retryCount: 0,
      waitPolicy: 'next_promise_date + 7d，节假日顺延。',
      waitRule: {
        mode: '日期字段',
        amount: 7,
        unit: '天',
        dateField: 'next_promise_date',
        resumeEvent: 'payment_status_changed',
        quietHours: '节假日顺延，22:00-09:00 不触达',
        timeoutTarget: '第三次外呼 / 转人工',
      },
      delayProfileId: 'delay_7d_final_check',
      readStateKeys: ['next_promise_date'],
      writeStateKeys: ['final_check_at'],
    }),
  }),
  createNode({
    id: 'collection_manual',
    type: '动作',
    lane: '人工处理',
    title: '第三次外呼 / 转人工',
    subtitle: '人工接管',
    description: '创建人工处理任务并附带历史摘要。',
    dayOffset: 10,
    position: { x: 1780, y: 550 },
    dependsOn: ['collection_wait_7_days'],
    output: '人工工单',
    riskLevel: '高',
    config: createConfig({
      owner: '催收主管',
      goal: '把高风险任务交给人工处理。',
      inputVariables: ['call_summary', 'delay_reason', 'overdue_amount'],
      outputVariables: ['ticket_id', 'handoff_reason'],
      toolName: '人工工单创建接口',
      toolCall: {
        toolId: 'create_manual_ticket',
        toolName: '人工工单创建接口',
        parameterMappings: ['customer_id -> customerId', 'delay_reason -> reason', 'overdue_amount -> amount'],
        timeoutSeconds: 30,
        idempotencyKey: 'task_id',
        permissionScope: '人工催收工单创建',
      },
      primaryFunctionId: 'create_manual_ticket',
      handoffSummaryTemplate: '客户 {{customer_name}} 已完成多轮跟进；原因：{{delay_reason}}；金额：{{overdue_amount}}。',
      readStateKeys: ['call_summary', 'delay_reason'],
      writeStateKeys: ['ticket_id'],
    }),
  }),
  createNode({
    id: 'collection_done',
    type: '结束',
    lane: '系统调度',
    title: '任务结束',
    subtitle: '关闭任务',
    description: '记录结果并回写客户状态。',
    dayOffset: 11,
    position: { x: 2080, y: 70 },
    dependsOn: ['collection_check_payment', 'collection_manual'],
    output: '最终状态',
    riskLevel: '低',
    config: createConfig({
      owner: '系统调度器',
      inputVariables: ['task_status', 'close_reason'],
      outputVariables: ['customer_tag', 'closed_at'],
      toolName: '客户状态回写接口',
      toolCall: {
        toolId: 'update_customer_status',
        toolName: '客户状态回写接口',
        parameterMappings: ['customer_id -> customerId', 'task_status -> status'],
        timeoutSeconds: 20,
        idempotencyKey: 'task_id',
        permissionScope: '客户状态写入',
      },
      primaryFunctionId: 'update_customer_status',
      writeStateKeys: ['closed_at'],
    }),
  }),
];

const collectionEdges: LongTermFlowEdge[] = [
  { id: 'edge_collection_1', source: 'collection_import', target: 'collection_first_call', label: '启动外呼', edgeType: '固定流转', condition: '名单导入成功', priority: 1 },
  { id: 'edge_collection_2', source: 'collection_first_call', target: 'collection_wait_3_days', label: '已承诺', edgeType: '条件分支', condition: 'promise_date exists', priority: 1 },
  { id: 'edge_collection_3', source: 'collection_wait_3_days', target: 'collection_check_payment', label: '到期检查', edgeType: '超时流转', condition: 'resume_at <= now', priority: 1 },
  { id: 'edge_collection_4', source: 'collection_check_payment', target: 'collection_done', label: '已还款', edgeType: '条件分支', condition: 'paid = true', priority: 1 },
  { id: 'edge_collection_5', source: 'collection_check_payment', target: 'collection_second_call', label: '未还款', edgeType: '条件分支', condition: 'paid = false', priority: 2 },
  { id: 'edge_collection_6', source: 'collection_second_call', target: 'collection_wait_7_days', label: '继续跟进', edgeType: '固定流转', condition: 'need_handoff = false', priority: 1 },
  { id: 'edge_collection_7', source: 'collection_wait_7_days', target: 'collection_manual', label: '升级', edgeType: '人工兜底', condition: 'final_check unpaid', priority: 1 },
  { id: 'edge_collection_8', source: 'collection_manual', target: 'collection_done', label: '已接管', edgeType: '固定流转', condition: 'ticket_id exists', priority: 1 },
];

const refundNodes: LongTermFlowNode[] = [
  createNode({
    id: 'refund_request',
    type: '触发器',
    lane: '系统调度',
    title: '用户发起退款',
    subtitle: '订单事件',
    description: '创建退款任务并加载订单上下文。',
    dayOffset: 0,
    position: { x: 80, y: 70 },
    output: '退款任务',
    riskLevel: '低',
    config: createConfig({
      inputVariables: ['order_id', 'customer_id', 'refund_reason'],
      outputVariables: ['refund_task_id', 'order_summary'],
      toolName: '订单查询接口',
      toolCall: {
        toolId: 'query_order_detail',
        toolName: '订单查询接口',
        parameterMappings: ['order_id -> orderId', 'customer_id -> customerId'],
        timeoutSeconds: 20,
        idempotencyKey: 'order_id',
        permissionScope: '订单详情读取',
      },
      primaryFunctionId: 'query_order_detail',
      writeStateKeys: ['refund_task_id', 'order_summary'],
    }),
  }),
  createNode({
    id: 'refund_user_agent',
    type: 'Agent',
    lane: '用户沟通 Agent',
    title: '收集用户退款原因',
    subtitle: '诉求整理',
    description: '确认退款原因、期望方案和证据完整度。',
    dayOffset: 0,
    position: { x: 360, y: 190 },
    dependsOn: ['refund_request'],
    output: '用户诉求摘要',
    riskLevel: '中',
    config: createConfig({
      owner: '用户协商 Agent',
      inputVariables: ['order_summary', 'customer_history'],
      outputVariables: ['refund_reason', 'evidence_level', 'expected_solution'],
      prompt: '确认用户诉求、证据和期望处理方式，并输出摘要。',
      visibleFunctionIds: ['query_customer_history'],
      transitionFunctionIds: ['goto_merchant_contact'],
      readStateKeys: ['order_summary'],
      writeStateKeys: ['refund_reason', 'evidence_level'],
    }),
  }),
  createNode({
    id: 'refund_merchant_agent',
    type: 'Agent',
    lane: '商家协商 Agent',
    title: '联系商家核实',
    subtitle: '商家反馈',
    description: '确认出餐、配送、商品问题和商家处理意见。',
    dayOffset: 0,
    position: { x: 660, y: 310 },
    dependsOn: ['refund_user_agent'],
    output: '商家反馈摘要',
    riskLevel: '中',
    config: createConfig({
      owner: '商家协商 Agent',
      inputVariables: ['order_summary', 'refund_reason'],
      outputVariables: ['merchant_agreed', 'merchant_comment', 'suggested_amount'],
      prompt: '联系商家核实订单争议点，并记录可接受方案。',
      visibleFunctionIds: ['contact_merchant'],
      transitionFunctionIds: ['goto_wait_merchant_reply'],
      readStateKeys: ['refund_reason'],
      writeStateKeys: ['merchant_agreed', 'merchant_comment'],
    }),
  }),
  createNode({
    id: 'refund_wait_merchant',
    type: '等待',
    lane: '系统调度',
    title: '等待商家回复',
    subtitle: '24 小时',
    description: '商家提前回复则立即恢复流程，超时进入决策。',
    dayOffset: 1,
    position: { x: 960, y: 70 },
    dependsOn: ['refund_merchant_agent'],
    output: '商家回复状态',
    riskLevel: '低',
    config: createConfig({
      inputVariables: ['refund_task_id', 'merchant_id'],
      outputVariables: ['merchant_reply_status'],
      waitPolicy: '最多等待 24 小时。',
      waitRule: {
        mode: '固定等待',
        amount: 24,
        unit: '小时',
        dateField: 'merchant_contacted_at',
        resumeEvent: 'merchant_reply_received',
        quietHours: '商家回复可随时唤醒，用户触达遵守夜间保护',
        timeoutTarget: '判断退款方式',
      },
      delayProfileId: 'merchant_reply_24h',
      readStateKeys: ['refund_task_id'],
      writeStateKeys: ['merchant_reply_status'],
    }),
  }),
  createNode({
    id: 'refund_risk_decision',
    type: '条件',
    lane: '风控决策 Agent',
    title: '判断退款方式',
    subtitle: '规则决策',
    description: '根据金额、证据和商家反馈判断自动处理或人工审核。',
    dayOffset: 1,
    position: { x: 1260, y: 430 },
    dependsOn: ['refund_wait_merchant'],
    output: '退款决策',
    riskLevel: '高',
    config: createConfig({
      owner: '风控决策 Agent',
      inputVariables: ['refund_amount', 'evidence_level', 'merchant_agreed', 'customer_risk_level'],
      outputVariables: ['refund_decision', 'review_reason'],
      condition: 'refund_amount <= 50 && evidence_level = high',
      conditionRule: {
        field: 'refund_amount',
        operator: '小于等于',
        value: '50 且 evidence_level = high',
        defaultTarget: '转人工审核',
        description: '低金额且证据完整时自动退款，其余进入人工审核。',
      },
      transitionFunctionIds: ['goto_auto_refund', 'goto_manual_review'],
      readStateKeys: ['evidence_level', 'merchant_agreed'],
      writeStateKeys: ['refund_decision', 'review_reason'],
    }),
  }),
  createNode({
    id: 'refund_auto_pay',
    type: '动作',
    lane: '系统调度',
    title: '自动退款',
    subtitle: '低风险处理',
    description: '发起退款并通知用户。',
    dayOffset: 1,
    position: { x: 1560, y: 70 },
    dependsOn: ['refund_risk_decision'],
    output: '退款流水号',
    riskLevel: '中',
    config: createConfig({
      inputVariables: ['refund_task_id', 'refund_amount'],
      outputVariables: ['refund_transaction_id', 'notify_status'],
      toolName: '退款接口',
      toolCall: {
        toolId: 'create_refund',
        toolName: '退款接口',
        parameterMappings: ['refund_task_id -> refundTaskId', 'refund_amount -> amount'],
        timeoutSeconds: 30,
        idempotencyKey: 'refund_task_id',
        permissionScope: '退款发起',
      },
      primaryFunctionId: 'create_refund',
      readStateKeys: ['refund_decision'],
      writeStateKeys: ['refund_transaction_id'],
    }),
  }),
  createNode({
    id: 'refund_manual_review',
    type: '动作',
    lane: '人工处理',
    title: '转人工审核',
    subtitle: '争议订单',
    description: '生成审核工单并附带三方摘要。',
    dayOffset: 1,
    position: { x: 1560, y: 550 },
    dependsOn: ['refund_risk_decision'],
    output: '审核工单',
    riskLevel: '高',
    config: createConfig({
      owner: '退款审核专员',
      inputVariables: ['user_summary', 'merchant_comment', 'review_reason'],
      outputVariables: ['review_ticket_id', 'priority'],
      toolName: '审核工单创建接口',
      toolCall: {
        toolId: 'create_refund_review_ticket',
        toolName: '审核工单创建接口',
        parameterMappings: ['order_id -> orderId', 'review_reason -> reason', 'merchant_comment -> merchantComment'],
        timeoutSeconds: 30,
        idempotencyKey: 'refund_task_id',
        permissionScope: '退款审核工单创建',
      },
      primaryFunctionId: 'create_refund_review_ticket',
      handoffSummaryTemplate: '订单 {{order_id}}；用户诉求：{{user_summary}}；商家反馈：{{merchant_comment}}；原因：{{review_reason}}。',
      readStateKeys: ['refund_decision', 'review_reason'],
      writeStateKeys: ['review_ticket_id'],
    }),
  }),
  createNode({
    id: 'refund_done',
    type: '结束',
    lane: '系统调度',
    title: '退款任务结束',
    subtitle: '关闭任务',
    description: '回写订单、用户和商家侧处理结果。',
    dayOffset: 2,
    position: { x: 1880, y: 70 },
    dependsOn: ['refund_auto_pay', 'refund_manual_review'],
    output: '订单状态',
    riskLevel: '低',
    config: createConfig({
      inputVariables: ['refund_decision', 'process_result'],
      outputVariables: ['order_status', 'customer_notify_status'],
      toolName: '订单结果回写接口',
      toolCall: {
        toolId: 'update_order_result',
        toolName: '订单结果回写接口',
        parameterMappings: ['order_id -> orderId', 'order_status -> status'],
        timeoutSeconds: 20,
        idempotencyKey: 'refund_task_id',
        permissionScope: '订单状态写入',
      },
      primaryFunctionId: 'update_order_result',
      writeStateKeys: ['order_status'],
    }),
  }),
];

const refundEdges: LongTermFlowEdge[] = [
  { id: 'edge_refund_1', source: 'refund_request', target: 'refund_user_agent', label: '收集诉求', edgeType: '固定流转', condition: '订单存在', priority: 1 },
  { id: 'edge_refund_2', source: 'refund_user_agent', target: 'refund_merchant_agent', label: '联系商家', edgeType: '固定流转', condition: '用户诉求完整', priority: 1 },
  { id: 'edge_refund_3', source: 'refund_merchant_agent', target: 'refund_wait_merchant', label: '等待回复', edgeType: '超时流转', condition: 'merchant_contacted', priority: 1 },
  { id: 'edge_refund_4', source: 'refund_wait_merchant', target: 'refund_risk_decision', label: '进入决策', edgeType: '固定流转', condition: 'merchant replied or timeout', priority: 1 },
  { id: 'edge_refund_5', source: 'refund_risk_decision', target: 'refund_auto_pay', label: '自动退款', edgeType: '条件分支', condition: 'low_risk = true', priority: 1 },
  { id: 'edge_refund_6', source: 'refund_risk_decision', target: 'refund_manual_review', label: '人工审核', edgeType: '人工兜底', condition: 'low_risk = false', priority: 2 },
  { id: 'edge_refund_7', source: 'refund_auto_pay', target: 'refund_done', label: '完成', edgeType: '固定流转', condition: 'refund_transaction_id exists', priority: 1 },
  { id: 'edge_refund_8', source: 'refund_manual_review', target: 'refund_done', label: '接管', edgeType: '固定流转', condition: 'review_ticket_id exists', priority: 1 },
];

const collectionRuns: LongTermFlowRun[] = [
  {
    id: 'RUN-COL-001',
    flowId: 'collection-three-rounds',
    customer: '张先生 / 逾期 1,280 元',
    status: '运行中',
    currentNode: '等待 3 天',
    nextTriggerAt: '2026-06-08 09:30',
    owner: '催收外呼 Agent',
    events: [
      { id: 'e1', time: '06-05 09:00', title: '导入逾期名单', detail: '进入首呼批次 A-06。', status: '成功', nodeId: 'collection_import' },
      { id: 'e2', time: '06-05 09:16', title: '首次外呼成功', detail: '用户承诺 3 天后还款。', status: '成功', nodeId: 'collection_first_call' },
      { id: 'e3', time: '06-08 09:30', title: '等待到期', detail: '将检查支付状态。', status: '等待', nodeId: 'collection_wait_3_days' },
    ],
  },
  {
    id: 'RUN-COL-002',
    flowId: 'collection-three-rounds',
    customer: '李女士 / 逾期 3,460 元',
    status: '异常',
    currentNode: '第三次外呼 / 转人工',
    nextTriggerAt: '2026-06-05 15:00',
    owner: '催收主管',
    exceptionReason: '用户拒绝继续机器人沟通',
    events: [
      { id: 'e1', time: '05-26 10:20', title: '首次外呼', detail: '用户确认延期。', status: '成功', nodeId: 'collection_first_call' },
      { id: 'e2', time: '05-29 10:20', title: '检查未还款', detail: '触发第二次外呼。', status: '成功', nodeId: 'collection_check_payment' },
      { id: 'e3', time: '06-05 14:32', title: '升级人工', detail: '用户拒绝继续机器人沟通。', status: '人工', nodeId: 'collection_manual' },
    ],
  },
];

const refundRuns: LongTermFlowRun[] = [
  {
    id: 'RUN-REF-001',
    flowId: 'takeout-refund-negotiation',
    customer: '订单 #FD2391 / 用户王同学',
    status: '等待中',
    currentNode: '等待商家回复',
    nextTriggerAt: '2026-06-06 11:10',
    owner: '商家协商 Agent',
    events: [
      { id: 'e1', time: '06-05 11:02', title: '用户发起退款', detail: '反馈餐品洒漏。', status: '成功', nodeId: 'refund_request' },
      { id: 'e2', time: '06-05 11:05', title: '完成用户信息收集', detail: '证据完整度高。', status: '成功', nodeId: 'refund_user_agent' },
      { id: 'e3', time: '06-05 11:10', title: '等待商家回复', detail: '商家最长 24 小时内回复。', status: '等待', nodeId: 'refund_wait_merchant' },
    ],
  },
  {
    id: 'RUN-REF-002',
    flowId: 'takeout-refund-negotiation',
    customer: '订单 #FD2417 / 用户陈先生',
    status: '需人工',
    currentNode: '转人工审核',
    nextTriggerAt: '2026-06-05 16:30',
    owner: '退款审核专员',
    exceptionReason: '商家拒绝退款且金额超过自动阈值',
    events: [
      { id: 'e1', time: '06-05 12:15', title: '用户发起退款', detail: '反馈未收到餐品。', status: '成功', nodeId: 'refund_request' },
      { id: 'e2', time: '06-05 12:40', title: '商家拒绝退款', detail: '商家认为骑手已送达。', status: '异常', nodeId: 'refund_merchant_agent' },
      { id: 'e3', time: '06-05 12:45', title: '转人工审核', detail: '金额 86 元，超过自动阈值。', status: '人工', nodeId: 'refund_manual_review' },
    ],
  },
];

export const LONG_TERM_FLOW_RUNS_BY_FLOW_ID: LongTermFlowRunStore = {
  'collection-three-rounds': collectionRuns,
  'takeout-refund-negotiation': refundRuns,
  'renewal-callback': [],
  'after-sale-repair': [],
};

export const LONG_TERM_FLOW_DEFINITIONS: LongTermFlowDefinition[] = [
  {
    id: 'collection-three-rounds',
    name: '催收三轮跟进',
    scenarioType: '催收',
    status: '运行中',
    owner: '催收运营组',
    description: '按账期、支付状态和外呼结果推进多轮触达。',
    agentCount: 2,
    runningTasks: 128,
    todayTriggers: 42,
    exceptionTasks: 9,
    updatedAt: '2026-06-05 10:30',
    lanes: BASE_LANES,
    nodes: collectionNodes,
    edges: collectionEdges,
  },
  {
    id: 'takeout-refund-negotiation',
    name: '外卖退款协商',
    scenarioType: '退款',
    status: '已发布',
    owner: '售后体验组',
    description: '用户、商家和风控协同处理退款争议。',
    agentCount: 3,
    runningTasks: 86,
    todayTriggers: 31,
    exceptionTasks: 6,
    updatedAt: '2026-06-04 18:20',
    lanes: BASE_LANES,
    nodes: refundNodes,
    edges: refundEdges,
  },
  {
    id: 'renewal-callback',
    name: '会员到期回访',
    scenarioType: '回访',
    status: '草稿',
    owner: '会员运营组',
    description: '会员到期前后按确认状态触发回访和提醒。',
    agentCount: 1,
    runningTasks: 0,
    todayTriggers: 0,
    exceptionTasks: 0,
    updatedAt: '2026-06-03 16:45',
    lanes: BASE_LANES,
    nodes: collectionNodes.map((node) => ({ ...node, id: `renewal_${node.id}`, title: node.title.replace('还款', '续费') })),
    edges: collectionEdges.map((edge) => ({ ...edge, id: `renewal_${edge.id}`, source: `renewal_${edge.source}`, target: `renewal_${edge.target}` })),
  },
  {
    id: 'after-sale-repair',
    name: '售后维修预约跟进',
    scenarioType: '售后',
    status: '已停用',
    owner: '售后服务组',
    description: '维修预约后按确认状态、上门时间和异常结果推进。',
    agentCount: 2,
    runningTasks: 12,
    todayTriggers: 5,
    exceptionTasks: 1,
    updatedAt: '2026-06-01 09:12',
    lanes: BASE_LANES,
    nodes: refundNodes.map((node) => ({ ...node, id: `repair_${node.id}` })),
    edges: refundEdges.map((edge) => ({ ...edge, id: `repair_${edge.id}`, source: `repair_${edge.source}`, target: `repair_${edge.target}` })),
  },
];

export const FLOW_STATUS_OPTIONS: Array<LongTermFlowStatus | '全部状态'> = ['全部状态', '草稿', '已发布', '运行中', '已停用'];
export const FLOW_SCENARIO_OPTIONS: Array<LongTermFlowScenarioType | '全部场景'> = ['全部场景', '催收', '退款', '回访', '售后'];

export function getFlowSummary(flows: LongTermFlowDefinition[]): LongTermFlowSummary {
  return flows.reduce<LongTermFlowSummary>(
    (summary, flow) => ({
      totalFlows: summary.totalFlows + 1,
      runningTasks: summary.runningTasks + flow.runningTasks,
      todayTriggers: summary.todayTriggers + flow.todayTriggers,
      exceptionTasks: summary.exceptionTasks + flow.exceptionTasks,
    }),
    { totalFlows: 0, runningTasks: 0, todayTriggers: 0, exceptionTasks: 0 },
  );
}

export function filterLongTermFlows(
  flows: LongTermFlowDefinition[],
  { searchTerm, statusFilter, scenarioFilter }: LongTermFlowFilter,
): LongTermFlowDefinition[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  return flows.filter((flow) => {
    const matchesSearch = normalizedSearchTerm
      ? [flow.name, flow.description, flow.owner, flow.scenarioType].some((value) => value.toLowerCase().includes(normalizedSearchTerm))
      : true;
    const matchesStatus = statusFilter === '全部状态' || flow.status === statusFilter;
    const matchesScenario = scenarioFilter === '全部场景' || flow.scenarioType === scenarioFilter;
    return matchesSearch && matchesStatus && matchesScenario;
  });
}

export function sortLongTermFlows(
  flows: LongTermFlowDefinition[],
  sortConfig: LongTermFlowSortConfig,
): LongTermFlowDefinition[] {
  return [...flows].sort((left, right) => {
    const leftValue = left[sortConfig.key];
    const rightValue = right[sortConfig.key];
    const result = typeof leftValue === 'number' && typeof rightValue === 'number'
      ? leftValue - rightValue
      : String(leftValue).localeCompare(String(rightValue), 'zh-Hans-CN');
    return sortConfig.direction === 'asc' ? result : -result;
  });
}

export function paginateLongTermFlows<T>(items: T[], currentPage: number, pageSize: number): T[] {
  const start = (currentPage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function validateFlowDefinition(flow: LongTermFlowDefinition): string[] {
  const issues: string[] = [];
  const triggerNodes = flow.nodes.filter((node) => node.type === '触发器');
  const endNodes = flow.nodes.filter((node) => node.type === '结束');
  if (triggerNodes.length !== 1) issues.push('流程完整性校验：必须且只能有一个触发器。');
  if (endNodes.length < 1) issues.push('流程完整性校验：至少需要一个结束节点。');
  flow.edges.forEach((edge) => {
    const hasSource = flow.nodes.some((node) => node.id === edge.source);
    const hasTarget = flow.nodes.some((node) => node.id === edge.target);
    if (!hasSource || !hasTarget) issues.push(`流程完整性校验：连线「${edge.label}」缺少有效起点或终点。`);
  });
  return issues;
}
