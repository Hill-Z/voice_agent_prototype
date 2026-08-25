
import React, { useState } from 'react';
import InterfaceConfig from './components/extraction/InterfaceConfig';
import AuthenticationManager from './components/extraction/AuthenticationManager';
import ExtractionWorkflowManager from './components/extraction/ExtractionWorkflowManager';
import { ExtractionConfig, BotVariable, AuthenticationConfig, ExtractionWorkflow } from './types';

const INITIAL_AUTHENTICATIONS: AuthenticationConfig[] = [
  { id: 'auth_crm_oauth', name: 'CRM 生产环境', description: 'CRM 接口统一鉴权', provider: '自定义 API', type: 'oauth2_client_credentials', status: 'available', lastUpdated: Date.now(), oauth2ClientCredentials: { clientId: 'crm-client', clientSecret: '••••••••', tokenUrl: 'https://api.example.com/oauth/token', scopes: 'customer.read order.read', clientAuthMethod: 'basic' } },
  { id: 'auth_ticket_basic', name: '工单系统', description: '工单接口账号', provider: 'Udesk', type: 'basic', status: 'available', lastUpdated: Date.now(), basic: { username: 'service-account', password: '••••••••' } },
  { id: 'auth_partner_bearer', name: '合作方访问令牌', description: '合作方开放接口', provider: '自定义 API', type: 'bearer', status: 'unchecked', lastUpdated: Date.now(), bearer: { token: '••••••••' } },
];

const INITIAL_WORKFLOWS: ExtractionWorkflow[] = [
  { id: 'workflow_order_check', name: '订单查询与路线检测', description: '先查询客户最近订单，再检测订单路线是否异常。', serviceKey: 'order_route_check', status: 'published', lastUpdated: Date.now(), publication: { enabled: true, method: 'POST', version: 'v1', accessMode: 'platform_token', credentialName: '企业默认调用凭证', responseMode: 'sync', timeoutSeconds: 30 }, inputs: [{ id: 'input_customer', key: 'user_phone', description: '客户手机号', required: true }], outputs: [{ id: 'output_result', key: 'route_status', description: '路线检测结果', required: true, sourceStepId: 'step_check_route', sourceValue: 'route_status' }], steps: [
    { id: 'step_query_order', name: '查询最近订单', interfaceId: 'get_last_order', inputMappings: [{ id: 'map_customer', targetKey: 'user_phone', source: 'workflow_input', sourceValue: 'user_phone' }], outputMappings: [{ id: 'out_order', outputKey: 'order_id', sourcePath: 'current_order_id' }], failureAction: 'stop', retryCount: 0, timeoutSeconds: 10 },
    { id: 'step_check_route', name: '检测路线偏移', interfaceId: 'check_route', inputMappings: [{ id: 'map_order', targetKey: 'order_id', source: 'step_output', sourceStepId: 'step_query_order', sourceValue: 'order_id' }], outputMappings: [{ id: 'out_route', outputKey: 'route_status', sourcePath: 'route_status' }], failureAction: 'retry', retryCount: 1, timeoutSeconds: 10 },
  ] },
];

interface InformationExtractionProps {
  configs: ExtractionConfig[];
  onUpdateConfigs: (configs: ExtractionConfig[]) => void;
  availableVariables?: BotVariable[];
}

export default function InformationExtraction({ configs, onUpdateConfigs, availableVariables = [] }: InformationExtractionProps) {
  const [activeTab, setActiveTab] = useState<'INTERFACE' | 'AUTH' | 'WORKFLOW'>('INTERFACE');
  const [authentications, setAuthentications] = useState<AuthenticationConfig[]>(INITIAL_AUTHENTICATIONS);
  const [workflows, setWorkflows] = useState<ExtractionWorkflow[]>(INITIAL_WORKFLOWS);

  const tabs: Array<{ id: typeof activeTab; label: string }> = [
    { id: 'INTERFACE', label: '接口管理' },
    { id: 'AUTH', label: '鉴权管理' },
    { id: 'WORKFLOW', label: '接口工作流' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Sub-Navigation for Extraction Module */}
      <div className="px-8 pt-6 border-b border-gray-200 bg-white">
        <div className="flex space-x-8">{tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`pb-3 text-sm font-medium transition-all relative ${activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}>{tab.label}</button>)}</div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        {activeTab === 'INTERFACE' && (
          <InterfaceConfig 
            configs={configs}
            onUpdateConfigs={onUpdateConfigs}
            availableVariables={availableVariables}
            authentications={authentications}
          />
        )}
        {activeTab === 'AUTH' && <AuthenticationManager authentications={authentications} onUpdate={setAuthentications} interfaces={configs} />}
        {activeTab === 'WORKFLOW' && <ExtractionWorkflowManager workflows={workflows} onUpdate={setWorkflows} interfaces={configs} />}
      </div>
    </div>
  );
}
