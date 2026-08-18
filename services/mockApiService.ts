/**
 * Mock API 服务 - 用于 Demo 演示
 * 模拟真实的 API 调用，包含延迟和 Mock 数据
 */

// Mock 延迟配置（毫秒）
const MOCK_DELAYS: Record<string, number> = {
  query_order: 2000,
  create_ticket: 1000,
  query_logistics: 3000,
  add_wechat: 2000,
  get_user_info: 1000,
  check_balance: 1000,
  send_sms: 2000,
  transfer_human: 500,
  transfer_pstn: 500
};

// Mock 数据仓库
const MOCK_DATA = {
  orders: {
    '123456': {
      order_id: '123456',
      status: '已发货',
      product_name: 'iPhone 15 Pro',
      order_time: '2026-03-15 14:30',
      logistics_status: '运输中',
      current_location: '杭州转运中心',
      estimated_delivery: '2026-03-18',
      amount: 7999.00
    },
    '789012': {
      order_id: '789012',
      status: '已签收',
      product_name: 'AirPods Pro 2',
      order_time: '2026-03-10 09:15',
      logistics_status: '已签收',
      current_location: '上海浦东新区',
      estimated_delivery: '2026-03-12',
      amount: 1899.00
    }
  },
  
  users: {
    'user_001': {
      user_id: 'user_001',
      name: '张三',
      phone: '138****1234',
      level: 'VIP 会员',
      register_time: '2025-01-15',
      total_orders: 28,
      balance: 520.50,
      points: 3200
    },
    'user_002': {
      user_id: 'user_002',
      name: '李四',
      phone: '139****5678',
      level: '普通会员',
      register_time: '2025-06-20',
      total_orders: 5,
      balance: 100.00,
      points: 500
    }
  },
  
  logistics: {
    '123456': {
      order_id: '123456',
      tracking_number: 'SF1234567890',
      current_status: '运输中',
      current_location: '杭州转运中心',
      estimated_delivery: '2026-03-18',
      history: [
        { time: '2026-03-15 14:30', status: '已打包', location: '上海浦东仓库' },
        { time: '2026-03-15 18:00', status: '上海浦东仓库已发出', location: '上海' },
        { time: '2026-03-16 08:00', status: '到达杭州转运中心', location: '杭州' },
        { time: '2026-03-16 14:00', status: '运输中', location: '杭州转运中心' }
      ]
    }
  },
  
  tickets: [] as Array<{
    ticket_id: string;
    user_id: string;
    issue_type: string;
    description: string;
    status: string;
    created_at: string;
    estimated_resolve: string;
  }>
};

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock API 调用主函数
 */
export async function mockApiCall(toolName: string, params: any): Promise<any> {
  // 模拟网络延迟
  const delayTime = MOCK_DELAYS[toolName] || 1000;
  await delay(delayTime);
  
  // 根据工具名调用不同的 Mock API
  switch (toolName) {
    case 'query_order':
      return mockQueryOrder(params);
    
    case 'create_ticket':
      return mockCreateTicket(params);
    
    case 'query_logistics':
      return mockQueryLogistics(params);
    
    case 'add_wechat':
      return mockAddWechat(params);
    
    case 'get_user_info':
      return mockGetUserInfo(params);
    
    case 'check_balance':
      return mockCheckBalance(params);
    
    case 'send_sms':
      return mockSendSms(params);
    
    case 'transfer_human':
      return mockTransferHuman(params);
    
    case 'transfer_pstn':
      return mockTransferPstn(params);
    
    default:
      return { success: true, message: 'Mock 执行成功' };
  }
}

/**
 * Mock: 查询订单
 */
async function mockQueryOrder(params: any) {
  const { order_id, phone } = params;
  
  if (order_id && MOCK_DATA.orders[order_id]) {
    return {
      success: true,
      data: MOCK_DATA.orders[order_id]
    };
  }
  
  if (phone) {
    // 返回最近订单
    const recentOrder = Object.values(MOCK_DATA.orders)[0];
    return {
      success: true,
      data: recentOrder
    };
  }
  
  return {
    success: false,
    error: '订单不存在，请提供订单号或手机号'
  };
}

/**
 * Mock: 创建工单
 */
async function mockCreateTicket(params: any) {
  const { user_id, issue_type, description } = params;
  
  const ticket = {
    ticket_id: `T${Date.now()}`,
    user_id,
    issue_type,
    description,
    status: '已创建',
    created_at: new Date().toISOString(),
    estimated_resolve: '24 小时内'
  };
  
  MOCK_DATA.tickets.push(ticket);
  
  return {
    success: true,
    data: ticket
  };
}

/**
 * Mock: 查询物流
 */
async function mockQueryLogistics(params: any) {
  const { order_id } = params;
  
  if (order_id && MOCK_DATA.logistics[order_id]) {
    return {
      success: true,
      data: MOCK_DATA.logistics[order_id]
    };
  }
  
  return {
    success: false,
    error: '物流信息不存在'
  };
}

/**
 * Mock: 添加企业微信
 */
async function mockAddWechat(params: any) {
  const { user_phone, employee_id } = params;
  
  return {
    success: true,
    data: {
      user_phone,
      employee_id,
      wechat_id: `WX_${Date.now()}`,
      status: '好友申请已发送',
      message: '企业微信好友申请已发送，请用户留意通过'
    }
  };
}

/**
 * Mock: 查询用户信息
 */
async function mockGetUserInfo(params: any) {
  const { user_id, phone } = params;
  
  if (user_id && MOCK_DATA.users[user_id]) {
    return {
      success: true,
      data: MOCK_DATA.users[user_id]
    };
  }
  
  if (phone) {
    // 返回第一个用户作为匹配
    return {
      success: true,
      data: MOCK_DATA.users['user_001']
    };
  }
  
  return {
    success: false,
    error: '用户不存在'
  };
}

/**
 * Mock: 查询余额
 */
async function mockCheckBalance(params: any) {
  const { user_id } = params;
  
  if (user_id && MOCK_DATA.users[user_id]) {
    const user = MOCK_DATA.users[user_id];
    return {
      success: true,
      data: {
        user_id,
        balance: user.balance,
        frozen_balance: 0,
        coupon_count: 5,
        points: user.points
      }
    };
  }
  
  return {
    success: false,
    error: '用户不存在'
  };
}

/**
 * Mock: 发送短信
 */
async function mockSendSms(params: any) {
  const { phone, template_id, params: smsParams } = params;
  
  return {
    success: true,
    data: {
      message_id: `SMS_${Date.now()}`,
      phone,
      template_id,
      params: smsParams,
      sent_at: new Date().toISOString(),
      status: '已发送'
    }
  };
}

/**
 * Mock: 转人工
 */
async function mockTransferHuman(params: any) {
  const { queue_id, priority } = params;
  
  return {
    success: true,
    data: {
      queue_id,
      priority: priority || 'normal',
      estimated_wait: '2-3 分钟',
      position_in_queue: 3,
      message: '正在为您转接人工坐席，当前排队 3 人，预计等待 2-3 分钟'
    }
  };
}

/**
 * Mock: 转外线
 */
async function mockTransferPstn(params: any) {
  const { phone_number } = params;
  
  return {
    success: true,
    data: {
      phone_number,
      status: '转接中',
      message: `正在为您转接到 ${phone_number}`
    }
  };
}

/**
 * 获取 Mock 数据（用于测试）
 */
export function getMockData(key: keyof typeof MOCK_DATA) {
  return MOCK_DATA[key];
}

/**
 * 清空 Mock 数据（用于重置）
 */
export function clearMockData() {
  MOCK_DATA.tickets = [];
}

/**
 * 添加 Mock 订单（用于测试）
 */
export function addMockOrder(orderId: string, data: any) {
  MOCK_DATA.orders[orderId] = data;
}
