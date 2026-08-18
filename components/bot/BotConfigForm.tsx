
import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Workflow, Bot, Plus, Edit2, Trash2, History, X } from 'lucide-react';
import { BotConfiguration, ExtractionConfig, MarketingCampaign, FlowConfig, FlowDefinition, FlowNodeType, ExitNodeType } from '../../types';
import { generateBotPrompt } from '../../services/geminiService';
import BotBasicConfig from './BotBasicConfig';
import BotStrategyConfig from './BotStrategyConfig';
import BotBusinessConfig from './BotBusinessConfig';
import BotVariableConfig from './BotVariableConfig';
import BotDebugConfig from './BotDebugConfig';
import BotTestConfig from './BotTestConfig';
import BotIntentConfig from './intent/BotIntentConfig';
import BotMarketingConfig from './BotMarketingConfig';

import BotKnowledgeConfig from './BotKnowledgeConfig';
import BotTopicManager from './BotTopicManager';
import BotTriggerManager from './BotTriggerManager';
import AgentOrchestrationConfig from './AgentOrchestrationConfig';
import FlowStudio from '../flow/FlowStudio';

interface BotConfigFormProps {
  initialData: BotConfiguration;
  onSave: (data: BotConfiguration) => void;
  onCancel: () => void;
  extractionConfigs: ExtractionConfig[];
  campaigns: MarketingCampaign[]; 
}

const DEMO_FLOW_CONFIG: FlowConfig = {
  id: 'polyai_flow_workbench',
  name: 'PolyAI Flow Workbench',
  entryFlowId: 'main',
  functions: [
    {
      id: 'code_normalize_phone',
      name: 'normalize_phone_digits',
      description: '清洗手机号中的空格、短横线和口语化停顿，生成标准手机号。',
      parameters: [{ name: 'phone_number', type: 'string', description: '用户输入的手机号', required: true }],
      code: `def normalize_phone_digits(conv, flow, phone_number):
    digits = ''.join(ch for ch in phone_number if ch.isdigit())
    conv.state['normalized_phone_number'] = digits
    return`,
      scope: 'global',
      isBuiltIn: false,
      category: 'global',
      globalConfig: {
        executionStrategy: 'sync',
        playFiller: false,
      },
    },
    {
      id: 'code_verify_sms',
      name: 'verify_sms_code',
      description: '根据验证码和用户手机号校验当前会话是否通过验证。',
      parameters: [
        { name: 'phone_number', type: 'string', description: '手机号', required: true },
        { name: 'verification_code', type: 'string', description: '验证码', required: true },
      ],
      code: `def verify_sms_code(conv, flow, phone_number, verification_code):
    conv.state['isVerified'] = verification_code == '9988'
    return`,
      scope: 'flow',
      flowId: 'verification',
      isBuiltIn: false,
      category: 'transition',
      transitionConfig: {
        canGotoStep: true,
        canGotoFlow: true,
        canModifyState: true,
      },
    },
    {
      id: 'code_prepare_handoff',
      name: 'prepare_handoff_summary',
      description: '整理重试过程和失败原因，供转人工时透传。',
      parameters: [{ name: 'retryCount', type: 'number', description: '当前重试次数', required: true }],
      code: `def prepare_handoff_summary(conv, flow, retryCount):
    conv.state['handoff_summary'] = f'验证码校验失败，已重试 {retryCount} 次'
    return`,
      scope: 'global',
      isBuiltIn: false,
      category: 'global',
      globalConfig: {
        executionStrategy: 'sync',
        playFiller: false,
      },
    },
  ],
  flows: [
    {
      id: 'main',
      name: '主入口 Flow',
      isEntry: true,
      nodes: [
        {
          id: 'main_start',
          type: FlowNodeType.START,
          position: { x: 80, y: 220 },
          data: { name: '开始', description: '机器人默认入口。' }
        },
        {
          id: 'collect_phone',
          type: FlowNodeType.DEFAULT,
          position: { x: 320, y: 190 },
          data: {
            name: '收集手机号',
            description: '收集并确认用户手机号，用于进入身份验证子 Flow。',
            stepType: 'collect',
            stepPrompt: {
              prompt: '请礼貌收集用户手机号，并调用 /normalize_phone_digits 进行清洗。在手机号有效后进入身份验证子流程。',
              visibleFunctionIds: [],
              transitionFunctionIds: ['builtin_goto_flow'],
              codeBlockIds: ['code_normalize_phone']
            },
            codeBlockIds: ['code_normalize_phone'],
            entityConfig: {
              enabled: true,
              entityName: 'phone_number',
              entityType: 'phone',
              prompt: '请说一下您下单时使用的手机号。',
              asrBiasing: 'number',
              required: true
            },
            retryConfig: {
              enabled: true,
              maxAttempts: 3,
              noInputPrompt: '我还没有听到手机号，请再说一遍。',
              noMatchPrompt: '手机号没有听清，请重新说一遍。'
            },
            fewShotExamples: [
              { input: '13800138000', output: '已收集手机号并准备进入身份验证流程。' }
            ],
            gotoFlowId: 'verification'
          }
        },
        {
          id: 'main_exit',
          type: FlowNodeType.EXIT,
          position: { x: 600, y: 215 },
          data: {
            name: '主流程出口',
            description: '主入口 Flow 的自然结束点。',
            stepType: 'exit',
            exitType: ExitNodeType.FINISH
          }
        }
      ],
      edges: [
        { id: 'main_edge_1', source: 'main_start', target: 'collect_phone', label: '进入收集', edgeType: 'normal' },
        { id: 'main_edge_2', source: 'collect_phone', target: 'main_exit', label: '收集完成', edgeType: 'goto_flow', conditionSummary: '调用 goto_flow 跳转后返回主流程结束' }
      ]
    },
    {
      id: 'verification',
      name: '身份验证 Flow',
      nodes: [
        {
          id: 'verification_start',
          type: FlowNodeType.START,
          position: { x: 80, y: 220 },
          data: { name: '进入身份验证', description: '从主入口 Flow 跳转而来。' }
        },
        {
          id: 'collect_code',
          type: FlowNodeType.DEFAULT,
          position: { x: 320, y: 190 },
          data: {
            name: '收集验证码',
            description: '模拟验证码采集、DTMF 输入和重试策略。',
            stepType: 'advanced',
            stepPrompt: {
              prompt: '请收集用户收到的验证码。支持用户直接说出验证码，也支持按键输入。如果校验失败，继续留在当前 Flow 并触发重试。',
              visibleFunctionIds: [],
              transitionFunctionIds: ['builtin_check_verification', 'builtin_goto_flow', 'code_verify_sms'],
              codeBlockIds: ['code_verify_sms']
            },
            codeBlockIds: ['code_verify_sms'],
            entityConfig: {
              enabled: true,
              entityName: 'verification_code',
              entityType: 'alphanumeric',
              prompt: '请说出您收到的验证码。',
              asrBiasing: 'alphanumeric',
              required: true,
              inputMode: 'speech_or_dtmf',
              dtmfMaxDigits: 6,
              dtmfTerminator: '#',
              dtmfFirstDigitTimeoutMs: 5000,
              dtmfInterDigitTimeoutMs: 2200,
              collectWhileSpeaking: true,
              validationPattern: '^[A-Za-z0-9]{4,6}$',
            },
            retryConfig: {
              enabled: true,
              maxAttempts: 3,
              noInputPrompt: '我还没有听到验证码，请再说一遍。',
              noMatchPrompt: '验证码没有听清，请重新说一遍。',
              confirmationPrompt: '我再确认一次，如果还不对我会帮您转人工处理。',
              fallbackAction: 'handoff',
              fallbackTargetId: 'verification_handoff',
              handoffTargetId: 'handoff_human_service',
            }
          }
        },
        {
          id: 'verify_result',
          type: FlowNodeType.DEFAULT,
          position: { x: 590, y: 120 },
          data: {
            name: '验证结果判断',
            description: '模拟 function step，根据 state 决定继续查询订单或转人工。',
            stepType: 'function',
            stepPrompt: {
              prompt: '根据当前 state 判断用户是否验证通过；如果失败，先整理 /prepare_handoff_summary 再升级到人工。',
              visibleFunctionIds: [],
              transitionFunctionIds: ['builtin_goto_flow', 'builtin_save_state', 'code_verify_sms'],
              codeBlockIds: ['code_prepare_handoff']
            },
            codeBlockIds: ['code_prepare_handoff']
          }
        },
        {
          id: 'verification_lookup',
          type: FlowNodeType.EXIT,
          position: { x: 860, y: 90 },
          data: {
            name: '进入订单查询 Flow',
            description: '验证成功后切换到订单查询子 Flow。',
            stepType: 'exit',
            exitType: ExitNodeType.FINISH,
            gotoFlowId: 'lookup'
          }
        },
        {
          id: 'verification_handoff',
          type: FlowNodeType.EXIT,
          position: { x: 860, y: 260 },
          data: {
            name: '验证失败转人工',
            description: '超过重试次数后结束当前 Flow 并转人工。',
            stepType: 'exit',
            exitType: ExitNodeType.HANDOFF,
            gotoFlowId: 'handoff'
          }
        }
      ],
      edges: [
        { id: 'verification_edge_1', source: 'verification_start', target: 'collect_code', label: '开始验证', edgeType: 'normal' },
        { id: 'verification_edge_2', source: 'collect_code', target: 'verify_result', label: '收到验证码', edgeType: 'normal' },
        { id: 'verification_edge_3', source: 'verify_result', target: 'verification_lookup', label: '验证成功', edgeType: 'conditional', conditionSummary: 'isVerified === true', priority: 1 },
        { id: 'verification_edge_4', source: 'verify_result', target: 'verification_handoff', label: '验证失败', edgeType: 'fallback', conditionSummary: 'retryCount >= 3', priority: 2 }
      ]
    },
    {
      id: 'lookup',
      name: '订单查询 Flow',
      nodes: [
        {
          id: 'lookup_start',
          type: FlowNodeType.START,
          position: { x: 80, y: 220 },
          data: { name: '进入订单查询', description: '身份验证通过后的子 Flow。' }
        },
        {
          id: 'lookup_order',
          type: FlowNodeType.DEFAULT,
          position: { x: 320, y: 190 },
          data: {
            name: '查询订单',
            description: '展示 visible function、few-shot 和业务说明。',
            stepType: 'advanced',
            stepPrompt: {
              prompt: '根据已验证的手机号查询订单摘要，必要时调用 /prepare_handoff_summary 拼接上下文，查询完成后向用户复述结果。',
              visibleFunctionIds: ['builtin_confirm_reservation', 'builtin_send_sms'],
              transitionFunctionIds: ['builtin_goto_step'],
              codeBlockIds: ['code_prepare_handoff']
            },
            codeBlockIds: ['code_prepare_handoff'],
            fewShotExamples: [
              { input: '帮我查订单', output: '调用查询订单能力并向用户复述订单摘要。' }
            ],
            handoffTargetId: 'handoff_vip_service',
          }
        },
        {
          id: 'lookup_finish',
          type: FlowNodeType.EXIT,
          position: { x: 620, y: 215 },
          data: {
            name: '查询结束',
            description: '订单查询成功后的自然结束。',
            stepType: 'exit',
            exitType: ExitNodeType.FINISH
          }
        }
      ],
      edges: [
        { id: 'lookup_edge_1', source: 'lookup_start', target: 'lookup_order', label: '开始查询', edgeType: 'normal' },
        { id: 'lookup_edge_2', source: 'lookup_order', target: 'lookup_finish', label: '查询完成', edgeType: 'normal' }
      ]
    },
    {
      id: 'handoff',
      name: '转人工 Flow',
      nodes: [
        {
          id: 'handoff_start',
          type: FlowNodeType.START,
          position: { x: 80, y: 220 },
          data: { name: '进入转人工', description: '失败兜底 Flow。' }
        },
        {
          id: 'handoff_step',
          type: FlowNodeType.DEFAULT,
          position: { x: 320, y: 190 },
          data: {
            name: '转人工说明',
            description: '说明已超过重试上限，将升级到人工。',
            stepType: 'default',
            stepPrompt: {
              prompt: '向用户说明当前将升级到人工客服，并保持安抚性语气。',
              visibleFunctionIds: ['builtin_transfer'],
              transitionFunctionIds: []
            }
          }
        },
        {
          id: 'handoff_exit',
          type: FlowNodeType.EXIT,
          position: { x: 620, y: 215 },
          data: {
            name: '人工接管',
            description: '结束机器人流程并转人工。',
            stepType: 'exit',
            exitType: ExitNodeType.HANDOFF,
            handoffTargetId: 'handoff_human_service',
            handoffReason: '验证码校验多次失败，需要人工继续处理。'
          }
        }
      ],
      edges: [
        { id: 'handoff_edge_1', source: 'handoff_start', target: 'handoff_step', label: '开始升级', edgeType: 'normal' },
        { id: 'handoff_edge_2', source: 'handoff_step', target: 'handoff_exit', label: '完成转接', edgeType: 'normal' }
      ]
    }
  ],
  annotations: [],
  debugScenarios: [
    {
      id: 'scenario_verify_retry',
      name: '验证失败后重试并转人工',
      initialState: { retryCount: 0, isVerified: false, phone_number: '' },
      mockInputs: ['13800138000', '12A4', '验证码还是不对', '继续失败'],
      expectedPath: ['collect_phone', 'collect_code', 'verify_result', 'verification_handoff', 'handoff_exit'],
      expectedExitType: ExitNodeType.HANDOFF,
    }
  ],
  metadata: {
    description: '内部评审用 PolyAI Flow Workbench 原型数据。',
    updatedAt: Date.now()
  }
};

const BotConfigForm: React.FC<BotConfigFormProps> = ({ initialData, onSave, onCancel, extractionConfigs, campaigns }) => {
  const [config, setConfig] = useState<BotConfiguration>({ 
    ...initialData,
    orchestrationType: initialData.orchestrationType || 'WORKFLOW' 
  });
  
  const [activeTab, setActiveTab] = useState<'BASIC' | 'FLOW' | 'TOOLS' | 'STRATEGY' | 'BUSINESS' | 'VARIABLES' | 'DEBUG' | 'TEST' | 'MARKETING' | 'KNOWLEDGE' | 'FLOW_CONFIG' | 'TOPIC' | 'TRIGGER' | 'ORCHESTRATION'>('BASIC');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  // Flow 列表页状态
  const [flowEditMode, setFlowEditMode] = useState(false);
  const [flowSearchQuery, setFlowSearchQuery] = useState('');
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [flowInfoMode, setFlowInfoMode] = useState<'CREATE' | 'EDIT' | null>(null);
  const [flowInfoDraft, setFlowInfoDraft] = useState({ id: '', name: '', description: '' });
  const [isVersionDrawerOpen, setIsVersionDrawerOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishNote, setPublishNote] = useState('优化预约咨询话术，调整售后投诉转人工策略。');

  useEffect(() => {
    if (isMoreOpen && moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isMoreOpen]);

  const updateField = <K extends keyof BotConfiguration>(key: K, value: BotConfiguration[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const flowConfig = config.flowConfig || DEMO_FLOW_CONFIG;
  const visibleFlows = (flowConfig.flows || []).filter((flow) => {
    const query = flowSearchQuery.trim().toLowerCase();
    if (!query) return true;
    return `${flow.name} ${flow.metadata?.description || ''}`.toLowerCase().includes(query);
  });

  const handleSmartGenerate = async () => {
    if (!config.name) return alert("请先填写配置模板名称");
    setIsGenerating(true);
    try {
      const result = await generateBotPrompt(config.name, 'General', config.description);
      setConfig(prev => ({ ...prev, description: result.description, systemPrompt: result.systemPrompt }));
    } catch (error) {
      console.error(error);
      alert("AI 生成失败，请稍后重试。");
    } finally { setIsGenerating(false); }
  };


  // 根据当前配置计算版本展示文案。
  const getCurrentVersionLabel = () => {
    if (config.currentVersionType === 'draft') return '草稿';
    if (config.currentVersionType === 'published') return `${config.onlineVersion || config.currentVersion || '-'} 已发布`;
    return '—';
  };

  // 生成下一个版本号，供发布弹窗默认展示。
  const getNextVersion = () => {
    const source = config.onlineVersion || 'V1.0';
    const [major, minor] = source.replace('V', '').split('.');
    return `V${major || '1'}.${Number(minor || 0) + 1}`;
  };

  // 保存草稿只更新当前配置状态，不影响已发布版本。
  const handleSaveDraft = (overrides: Partial<BotConfiguration> = {}) => {
    const draftConfig = {
      ...config,
      ...overrides,
      currentVersion: '草稿',
      currentVersionType: 'draft' as const,
      versionUpdatedAt: Date.now(),
      versionChangeSummary: ['提示词', '流程', '对话策略'],
    };
    setConfig(draftConfig);
    onSave(draftConfig);
  };

  // 发布生成不可变版本，并更新正式通话使用的已发布版本。
  const handlePublishVersion = () => {
    const version = getNextVersion();
    const nextConfig = {
      ...config,
      currentVersion: version,
      currentVersionType: 'published' as const,
      onlineVersion: version,
      versionUpdatedAt: Date.now(),
      versionChangeSummary: ['提示词', '流程', '对话策略'],
    };
    setConfig(nextConfig);
    onSave(nextConfig);
    setIsPublishModalOpen(false);
    setIsVersionDrawerOpen(false);
  };

  const handleSave = () => {
    handleSaveDraft();
    
    // Create and show success toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 right-8 bg-green-50 text-green-700 border border-green-200 px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-in fade-in slide-in-from-right-5 duration-300';
    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><path d="M22 4L12 14.01l-3-3"></path></svg>
      <div>
        <h4 class="font-bold text-sm">保存成功</h4>
        <p class="text-xs text-green-600 mt-0.5">配置已更新</p>
      </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => toast.remove(), 500);
    }, 2000);
  };

  const openCreateFlowInfo = () => {
    setFlowInfoDraft({
      id: '',
      name: `新建 Flow ${(flowConfig.flows || []).length + 1}`,
      description: '',
    });
    setFlowInfoMode('CREATE');
  };

  const openEditFlowInfo = (flow: FlowDefinition) => {
    setFlowInfoDraft({
      id: flow.id,
      name: flow.name,
      description: flow.metadata?.description || '',
    });
    setFlowInfoMode('EDIT');
  };

  const closeFlowInfo = () => {
    setFlowInfoMode(null);
    setFlowInfoDraft({ id: '', name: '', description: '' });
  };

  const saveFlowInfo = () => {
    const nextName = flowInfoDraft.name.trim();
    const nextDescription = flowInfoDraft.description.trim();

    if (!nextName) {
      alert('请填写 Flow 名称');
      return;
    }

    if (flowInfoMode === 'CREATE') {
      const stamp = Date.now();
      const newFlow: FlowDefinition = {
        id: `flow_${stamp}`,
        name: nextName,
        metadata: {
          description: nextDescription,
          createdAt: stamp,
          updatedAt: stamp,
        },
        nodes: [{
          id: `start_${stamp}`,
          type: FlowNodeType.START,
          position: { x: 80, y: 220 },
          data: {
            name: '开始',
            description: 'Flow 入口节点',
            stepType: 'default',
            stepPrompt: { prompt: '', visibleFunctionIds: [], transitionFunctionIds: [] },
          },
        }],
        edges: [],
      };

      updateField('flowConfig', {
        ...flowConfig,
        flows: [...(flowConfig.flows || []), newFlow],
        entryFlowId: flowConfig.entryFlowId || newFlow.id,
      });
      closeFlowInfo();
      return;
    }

    if (flowInfoMode === 'EDIT') {
      updateField('flowConfig', {
        ...flowConfig,
        flows: (flowConfig.flows || []).map((flow) => (
          flow.id === flowInfoDraft.id
            ? {
                ...flow,
                name: nextName,
                metadata: {
                  ...(flow.metadata || {}),
                  description: nextDescription,
                  updatedAt: Date.now(),
                },
              }
            : flow
        )),
      });
      closeFlowInfo();
    }
  };

  return (
    <div className="px-[var(--layout-content-padding-x)] py-[var(--layout-content-padding-y)] max-w-[var(--layout-panel-max-width)] mx-auto w-full pb-20">
      {/* Form Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-5 gap-4">
        <div>
          <button onClick={onCancel} className="text-xs text-[var(--color-semantic-text-tertiary)] hover:text-[var(--color-semantic-primary)] mb-2 flex items-center transition-colors">
            <ArrowRight size={12} className="rotate-180 mr-1" /> 返回列表
          </button>
          <h1 className="text-[var(--typography-size-headline)] font-bold text-[var(--color-semantic-text-primary)] tracking-tight">
            {initialData.id ? '编辑机器人配置' : '新建机器人配置'}
          </h1>
        </div>
        {/* Switch removed here as requested */}
      </div>

      <div className="mb-5 rounded-[var(--component-card-radius)] border border-[var(--color-semantic-border-default)] bg-[var(--color-semantic-bg-surface)] p-4 shadow-[var(--shadow-xs)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-bold text-[var(--color-semantic-text-primary)]">当前版本：{getCurrentVersionLabel()}</span>
            <span className="font-bold text-[var(--color-semantic-text-primary)]">已发布版本：{config.onlineVersion || '未发布'}</span>
          </div>
          {(config.currentVersionType === 'draft' || !config.currentVersionType) && (
            <p className="text-xs text-[var(--color-semantic-text-tertiary)]">本次修改涉及：提示词、流程、对话策略</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsVersionDrawerOpen(true)} className="h-[var(--component-button-height-md)] px-3 border border-[var(--color-semantic-border-default)] rounded-[var(--component-button-radius)] text-sm text-[var(--color-semantic-text-secondary)] hover:bg-[var(--state-hover-bg)] flex items-center gap-2 transition-colors">
            <History size={15} /> 版本记录
          </button>
          {(config.currentVersionType === 'draft' || !config.currentVersionType) && (
            <button onClick={() => setIsPublishModalOpen(true)} className="h-[var(--component-button-height-md)] px-4 bg-[var(--color-semantic-primary)] text-[var(--color-semantic-text-inverse)] rounded-[var(--component-button-radius)] text-sm font-semibold hover:bg-[var(--color-semantic-primary-hover)] transition-colors">
              发布
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="mb-6 rounded-[var(--component-tabs-radius)] bg-[var(--color-semantic-bg-subtle)] p-1 overflow-x-auto">
        <div className="flex gap-[var(--component-tabs-gap)] min-w-max">
          {[
            { id: 'BASIC', label: '基础配置' },
            { id: 'FLOW_CONFIG', label: '流程配置' },
            { id: 'ORCHESTRATION', label: 'Agent 编排' },
            { id: 'TOPIC', label: '主题管理' },
            { id: 'TRIGGER', label: '触发器' },
            { id: 'STRATEGY', label: '对话策略' },
            { id: 'VARIABLES', label: '变量配置' },
            { id: 'DEBUG', label: '模型调试' },
            { id: 'KNOWLEDGE', label: '知识检索配置' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`h-[var(--component-tabs-item-height)] px-3 rounded-[var(--component-tabs-radius)] text-sm font-semibold transition-all relative whitespace-nowrap ${
                activeTab === tab.id ? 'bg-[var(--color-semantic-bg-surface)] text-[var(--color-semantic-primary)] shadow-[var(--shadow-xs)]' : 'text-[var(--color-semantic-text-tertiary)] hover:text-[var(--color-semantic-text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
          
          {/* 更多配置下拉菜单 */}
          <div className="relative">
            <button
              ref={moreButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                setIsMoreOpen(!isMoreOpen);
              }}
              className={`h-[var(--component-tabs-item-height)] px-3 rounded-[var(--component-tabs-radius)] text-sm font-semibold transition-all relative whitespace-nowrap flex items-center gap-1 ${
                ['FLOW', 'BUSINESS', 'MARKETING', 'TEST'].includes(activeTab) ? 'bg-[var(--color-semantic-bg-surface)] text-[var(--color-semantic-primary)] shadow-[var(--shadow-xs)]' : 'text-[var(--color-semantic-text-tertiary)] hover:text-[var(--color-semantic-text-primary)]'
              }`}
            >
              更多配置
              <svg className={`w-4 h-4 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isMoreOpen && (
              <div 
                className="fixed bg-[var(--color-semantic-bg-surface)] border border-[var(--color-semantic-border-default)] rounded-[var(--component-dropdown-menu-radius)] shadow-[var(--component-popover-shadow)] z-[100] p-1"
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  minWidth: '50px'
                }}
              >
                {[
                  { id: 'FLOW', label: '意图技能' },
                  { id: 'BUSINESS', label: '业务分析' },
                  { id: 'MARKETING', label: '营销与跟进', isPrimaryAction: true },
                  { id: 'TEST', label: '批量评测' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setIsMoreOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      activeTab === tab.id 
                        ? 'bg-[var(--color-semantic-primary-soft)] text-[var(--color-semantic-primary)] font-medium' 
                        : tab.isPrimaryAction
                          ? 'text-[var(--color-semantic-primary)] font-semibold bg-[var(--color-semantic-primary-soft)] hover:bg-[var(--color-blue-100)]'
                          : 'text-[var(--color-semantic-text-secondary)] hover:bg-[var(--state-hover-bg)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'BASIC' && (
          <BotBasicConfig 
            config={config} 
            updateField={updateField} 
            isGenerating={isGenerating} 
            handleSmartGenerate={handleSmartGenerate} 
            onSave={handleSave}
            onCancel={onCancel}
          />
        )}

        {/* Workflow Canvas */}
        {activeTab === 'FLOW' && (
           <div className="animate-in fade-in duration-500">
             <BotIntentConfig
               config={config}
               updateField={updateField}
               extractionConfigs={extractionConfigs}
             />
             <div className="flex justify-start space-x-4 pt-4 border-t border-gray-100 mt-6">
               <button onClick={handleSave} className="px-6 py-2 bg-primary text-white rounded hover:bg-sky-600 text-sm font-medium shadow-sm transition-all">
                 保存草稿
               </button>
               <button onClick={onCancel} className="px-6 py-2 border border-gray-200 text-slate-600 rounded hover:bg-slate-50 text-sm font-medium transition-all">
                 取消
               </button>
             </div>
           </div>
        )}

        {/* PolyAI Flow Editor */}
        {activeTab === 'FLOW_CONFIG' && !flowEditMode && (
           <div className="animate-in fade-in duration-500">
             <div className="flex items-center justify-between mb-6">
               <div>
                 <h3 className="text-sm font-bold text-slate-800">流程列表</h3>
                 <p className="text-xs text-slate-400 mt-1">先维护 Flow 名称和给大模型的提示词，再点击“编辑流程”进入流程图编辑器</p>
               </div>
               <button 
                 onClick={openCreateFlowInfo}
                 className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-sky-600 shadow-sm flex items-center gap-1"
               >
                 <Plus size={14} /> 新建 Flow
               </button>
             </div>

             <div className="mb-4 flex items-center gap-3">
               <input
                 type="search"
                 aria-label="搜索流程"
                 value={flowSearchQuery}
                 onChange={(event) => setFlowSearchQuery(event.target.value)}
                 placeholder="搜索流程名称或描述"
                 className="w-full max-w-sm rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
               />
               {flowSearchQuery && (
                 <button
                   type="button"
                   onClick={() => setFlowSearchQuery('')}
                   className="shrink-0 text-xs text-slate-500 hover:text-primary"
                 >
                   清空
                 </button>
               )}
             </div>

             <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
               {visibleFlows.length === 0 ? (
                 <div className="text-center py-12">
                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <span className="text-2xl">🔄</span>
                   </div>
                   <p className="text-sm text-slate-500">{flowSearchQuery ? '未找到匹配的 Flow' : '暂无 Flow'}</p>
                   <p className="text-xs text-slate-400 mt-1">{flowSearchQuery ? '尝试调整搜索条件' : '点击"新建 Flow"开始创建'}</p>
                 </div>
               ) : (
                 <div className="divide-y divide-gray-100">
                   {visibleFlows.map((flow) => (
                     <div key={flow.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
                           <span className="text-lg">🔄</span>
                         </div>
                         <div>
                           <div className="flex items-center gap-2">
                             <h4 className="text-sm font-bold text-slate-800">{flow.name}</h4>
                             {flow.id === flowConfig.entryFlowId && (
                               <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">入口</span>
                             )}
                           </div>
                           <p className="text-xs text-slate-500 mt-0.5">{flow.metadata?.description || '无描述'}</p>
                           <p className="text-[10px] text-slate-400 mt-0.5">{flow.nodes?.length || 0} 节点 · {flow.edges?.length || 0} 连线</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-2">
                         <button 
                           onClick={() => openEditFlowInfo(flow)}
                           className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                         >
                           <Edit2 size={12} /> 编辑
                         </button>
                         <button 
                           onClick={() => {
                             setEditingFlowId(flow.id);
                             setFlowEditMode(true);
                           }}
                           className="px-3 py-1.5 rounded-lg text-xs font-bold border border-sky-100 text-primary hover:bg-sky-50 flex items-center gap-1"
                         >
                           <Workflow size={12} /> 编辑流程
                         </button>
                         <button 
                           onClick={() => {
                             if (confirm('确定删除此 Flow 吗？')) {
                               const newFlows = (flowConfig.flows || []).filter(f => f.id !== flow.id);
                               updateField('flowConfig', {
                                 ...flowConfig,
                                 flows: newFlows,
                                 entryFlowId: flowConfig.entryFlowId === flow.id ? (newFlows[0]?.id || '') : flowConfig.entryFlowId,
                               });
                             }
                           }}
                           className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 text-red-500 hover:bg-red-50 flex items-center gap-1"
                         >
                           <Trash2 size={12} /> 删除
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>

             {flowInfoMode && (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4">
                 <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200">
                   <div className="px-6 py-5 border-b border-slate-100">
                     <h3 className="text-base font-bold text-slate-900">
                       {flowInfoMode === 'CREATE' ? '新建 Flow' : '编辑 Flow 信息'}
                     </h3>
                     <p className="text-xs text-slate-400 mt-1">
                       这里编辑 Flow 的名称和描述；描述会作为给大模型理解这个 Flow 用途的提示词。
                     </p>
                   </div>
                   <div className="p-6 space-y-5">
                     <div>
                       <label className="block text-xs font-bold text-slate-600 mb-2">Flow 名称</label>
                       <input
                         value={flowInfoDraft.name}
                         onChange={(event) => setFlowInfoDraft(prev => ({ ...prev, name: event.target.value }))}
                         className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                         placeholder="例如：身份验证 Flow"
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-600 mb-2">Flow 描述 / 大模型提示词</label>
                       <textarea
                         value={flowInfoDraft.description}
                         onChange={(event) => setFlowInfoDraft(prev => ({ ...prev, description: event.target.value }))}
                         className="h-36 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                         placeholder="说明这个 Flow 负责什么、什么时候进入、要收集哪些信息、成功和失败时如何流转。"
                       />
                       <p className="text-[11px] text-slate-400 mt-2">
                         示例：用于核验用户手机号和验证码。若验证通过，进入订单查询；若多次失败，转人工处理。
                       </p>
                     </div>
                   </div>
                   <div className="px-6 py-4 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                     <button
                       onClick={closeFlowInfo}
                       className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-white"
                     >
                       取消
                     </button>
                     <button
                       onClick={saveFlowInfo}
                       className="px-4 py-2 rounded-lg bg-primary text-sm font-bold text-white hover:bg-sky-600"
                     >
                       保存
                     </button>
                   </div>
                 </div>
               </div>
             )}
             
             <div className="flex justify-start space-x-4 pt-4 border-t border-gray-100 mt-6">
               <button onClick={handleSave} className="px-6 py-2 bg-primary text-white rounded hover:bg-sky-600 text-sm font-medium shadow-sm transition-all">
                 保存草稿
               </button>
               <button onClick={onCancel} className="px-6 py-2 border border-gray-200 text-slate-600 rounded hover:bg-slate-50 text-sm font-medium transition-all">
                 取消
               </button>
             </div>
           </div>
        )}

        {/* Flow Studio Editor */}
        {activeTab === 'FLOW_CONFIG' && flowEditMode && editingFlowId && (
           <div className="animate-in fade-in duration-500 flex flex-col h-[calc(100vh-280px)]">
             <div className="flex items-center justify-between mb-4">
               <button 
                 onClick={() => { setFlowEditMode(false); setEditingFlowId(null); }}
                 className="text-xs text-slate-500 hover:text-primary flex items-center gap-1"
               >
                 <ArrowRight size={12} className="rotate-180" /> 返回列表
               </button>
               <span className="text-sm font-bold text-slate-700">
                 编辑：{(flowConfig.flows || []).find(f => f.id === editingFlowId)?.name}
               </span>
             </div>
             <div className="flex-1 min-h-0">
               <FlowStudio
                 initialFlow={flowConfig}
                 initialActiveFlowId={editingFlowId}
                 onSave={(flow: FlowConfig) => {
                   updateField('flowConfig', flow);
                 }}
                 readOnly={false}
                 availableFunctions={flowConfig.functions || []}
                 availableVariables={config.variables || []}
                 availableTools={config.agentConfig?.tools || []}
                 availableDelayProfiles={config.agentConfig?.delayProfiles || []}
               />
             </div>
             <div className="flex justify-start space-x-4 pt-4 border-t border-gray-100 mt-6">
               <button onClick={handleSave} className="px-6 py-2 bg-primary text-white rounded hover:bg-sky-600 text-sm font-medium shadow-sm transition-all">
                 保存草稿
               </button>
               <button onClick={() => { setFlowEditMode(false); setEditingFlowId(null); }} className="px-6 py-2 border border-gray-200 text-slate-600 rounded hover:bg-slate-50 text-sm font-medium transition-all">
                 返回列表
               </button>
             </div>
           </div>
        )}

        {/* Topic Management */}
        {activeTab === 'ORCHESTRATION' && (
          <div className="animate-in fade-in duration-500">
            <AgentOrchestrationConfig
              bot={config}
              value={config.agentOrchestration}
              onChange={(value) => updateField('agentOrchestration', value)}
              onSave={(agentOrchestration) => handleSaveDraft({ agentOrchestration })}
            />
          </div>
        )}

        {/* Topic Management */}
        {activeTab === 'TOPIC' && (
          <div className="animate-in fade-in duration-500">
            <BotTopicManager
              config={config}
              updateField={updateField}
            />
          </div>
        )}

        {/* Trigger Management */}
        {activeTab === 'TRIGGER' && (
          <div className="animate-in fade-in duration-500">
            <BotTriggerManager
              config={config}
              updateField={updateField}
            />
          </div>
        )}

        {activeTab === 'STRATEGY' && (
          <BotStrategyConfig 
            config={config} 
            updateField={updateField} 
            onSave={handleSave}
            onCancel={onCancel}
          />
        )}

        {activeTab === 'VARIABLES' && (
          <BotVariableConfig 
            variables={config.variables || []} 
            onUpdate={(vars) => updateField('variables', vars)} 
            onSave={handleSave}
            onCancel={onCancel}
          />
        )}

        {activeTab === 'BUSINESS' && (
           <div className="animate-in fade-in duration-500">
             <BotBusinessConfig 
              config={config}
              updateField={updateField}
              onSave={handleSave}
              onCancel={onCancel}
              extractionConfigs={extractionConfigs}
            />
           </div>
        )}

        {activeTab === 'MARKETING' && (
           <div className="animate-in fade-in duration-500">
             <BotMarketingConfig 
              config={config}
              updateField={updateField}
              campaigns={campaigns}
            />
             <div className="flex justify-start space-x-4 pt-4 border-t border-gray-100 mt-6">
               <button onClick={handleSave} className="px-6 py-2 bg-primary text-white rounded hover:bg-sky-600 text-sm font-medium shadow-sm transition-all">
                 保存草稿
               </button>
               <button onClick={onCancel} className="px-6 py-2 border border-gray-200 text-slate-600 rounded hover:bg-slate-50 text-sm font-medium transition-all">
                 取消
               </button>
             </div>
           </div>
        )}

        {activeTab === 'DEBUG' && (
          <div className="animate-in fade-in duration-500 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <BotDebugConfig config={config} />
          </div>
        )}

        {activeTab === 'TEST' && (
          <div className="animate-in fade-in duration-500 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <BotTestConfig 
               config={config} 
               updateField={updateField}
             />
          </div>
        )}

        {activeTab === 'KNOWLEDGE' && (
          <div className="animate-in fade-in duration-500 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <BotKnowledgeConfig 
               config={config} 
               updateField={updateField}
             />
          </div>
        )}
      </div>

      {isVersionDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[var(--color-semantic-overlay)]">
          <div className="h-full w-[var(--component-drawer-width-md)] max-w-[96vw] bg-[var(--color-semantic-bg-surface)] shadow-[var(--shadow-lg)] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--color-semantic-bg-surface)] border-b border-[var(--color-semantic-border-subtle)] p-[var(--component-drawer-padding)] flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-semantic-text-primary)]">版本记录</h3>
                <p className="text-sm text-slate-500 mt-1">{config.name || '未命名机器人'}</p>
              </div>
              <button onClick={() => setIsVersionDrawerOpen(false)} className="p-2 hover:bg-[var(--state-hover-bg)] rounded-[var(--radius-control)]" aria-label="关闭版本记录"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {(config.currentVersionType === 'draft' || !config.currentVersionType) && (
                <section className="border border-[var(--color-amber-100)] bg-[var(--color-semantic-warning-soft)] p-4 rounded-[var(--component-card-radius)]">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">当前草稿</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">草稿</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">最后保存：{new Date(config.versionUpdatedAt || config.lastUpdated).toLocaleString()}</p>
                  <ul className="text-sm text-slate-600 mt-3 list-disc pl-5 space-y-1">
                    {(config.versionChangeSummary || ['提示词', '流程', '对话策略']).map(item => <li key={item}>调整{item}</li>)}
                  </ul>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setIsVersionDrawerOpen(false)} className="px-3 py-1.5 border border-slate-200 rounded text-sm">继续编辑</button>
                    <button onClick={() => setIsPublishModalOpen(true)} className="px-3 py-1.5 bg-primary text-white rounded text-sm">发布</button>
                  </div>
                </section>
              )}
              <section className="border border-[var(--color-green-100)] p-4 rounded-[var(--component-card-radius)]">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">{config.onlineVersion || '未发布'} 已发布</h4>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">生效中</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">发布时间：2026-06-23 14:20 · 发布人：张三</p>
                <p className="text-sm text-slate-600 mt-3">优化预约咨询流程，调整售后转人工策略。</p>
                <button className="mt-4 px-3 py-1.5 border border-slate-200 rounded text-sm">查看详情</button>
              </section>
              <section className="border border-[var(--color-semantic-border-default)] p-4 rounded-[var(--component-card-radius)]">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">V1.7 历史</h4>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">历史</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">2026-06-21 18:30 · 发布人：王五</p>
                <p className="text-sm text-slate-600 mt-3">新增用户打断、无应答重试规则。</p>
                <div className="mt-4 flex gap-2">
                  <button className="px-3 py-1.5 border border-slate-200 rounded text-sm">查看详情</button>
                  <button onClick={() => { setConfig(prev => ({ ...prev, currentVersion: '草稿', currentVersionType: 'draft', versionUpdatedAt: Date.now() })); setIsVersionDrawerOpen(false); }} className="px-3 py-1.5 border border-slate-200 rounded text-sm">恢复为草稿</button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-semantic-overlay)] px-4">
          <div className="w-full max-w-xl bg-[var(--color-semantic-bg-surface)] rounded-[var(--component-modal-radius)] shadow-[var(--shadow-lg)] overflow-hidden">
            <div className="p-[var(--component-modal-padding)] border-b border-[var(--color-semantic-border-subtle)] flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">发布新版本</h3>
                <p className="text-sm text-slate-500 mt-1">{config.name || '未命名机器人'}</p>
              </div>
              <button onClick={() => setIsPublishModalOpen(false)} className="p-2 hover:bg-[var(--state-hover-bg)] rounded-[var(--radius-control)]" aria-label="关闭发布弹窗"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">版本号</label>
                <input className="w-full h-[var(--component-field-height-md)] border border-[var(--color-semantic-border-default)] rounded-[var(--component-field-radius)] px-[var(--component-field-padding-x)] text-sm bg-[var(--state-readonly-bg)] text-[var(--state-readonly-text)]" value={getNextVersion()} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">版本说明</label>
                <textarea value={publishNote} onChange={event => setPublishNote(event.target.value)} className="w-full border border-[var(--color-semantic-border-default)] rounded-[var(--component-field-radius)] px-[var(--component-field-padding-x)] py-2 text-sm min-h-[120px] leading-[var(--typography-line-height-relaxed)] focus:border-[var(--color-semantic-border-focus)] outline-none" />
              </div>
            </div>
            <div className="p-[var(--component-modal-padding)] border-t border-[var(--color-semantic-border-subtle)] flex justify-end gap-3">
              <button onClick={() => setIsPublishModalOpen(false)} className="h-[var(--component-button-height-md)] px-4 border border-[var(--color-semantic-border-default)] rounded-[var(--component-button-radius)] text-sm text-[var(--color-semantic-text-secondary)] hover:bg-[var(--state-hover-bg)]">取消</button>
              <button onClick={handlePublishVersion} className="h-[var(--component-button-height-md)] px-4 bg-[var(--color-semantic-primary)] text-[var(--color-semantic-text-inverse)] rounded-[var(--component-button-radius)] text-sm font-semibold hover:bg-[var(--color-semantic-primary-hover)]">确认发布</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotConfigForm;
