
import React from 'react';
import { IntentNode, ExtractionConfig } from '../../../../types';
import { Input, Label, Select } from '../../../ui/FormComponents';
import { KeyValueList } from '../NodeFormHelpers';
import SimpleErrorHandling from './SimpleErrorHandling';

interface Props {
  node: IntentNode;
  onChange: (updates: any) => void;
  extractionConfigs?: ExtractionConfig[];
  availableNodes?: { label: string; value: string }[];
}

const DataConfig: React.FC<Props> = ({ node, onChange, extractionConfigs = [], availableNodes = [] }) => {
  // 7. HTTP Request (Updated)
  if (node.subType === 'http_request') {
    const selectedApi = extractionConfigs.find(c => c.id === node.config?.apiId);

    return (
      <>
        <Label label="选择全局接口" />
        <Select
          options={[
            {label: '请选择...', value: ''},
            ...extractionConfigs.map(c => ({label: c.name, value: c.id}))
          ]}
          value={node.config?.apiId || ''}
          onChange={(e) => onChange({ apiId: e.target.value })}
        />

        {selectedApi ? (
          <div className="p-3 bg-slate-50 border border-slate-100 rounded text-xs text-slate-600 mb-4">
             <div className="font-bold mb-1">{selectedApi.method} {selectedApi.interfaceUrl}</div>
             <div className="text-slate-400">{selectedApi.description}</div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-100 rounded text-xs text-amber-700 mb-4">
             请选择一个预先配置好的接口。如需新增，请前往"信息提取配置"。
          </div>
        )}

        <div className="border-t border-gray-100 pt-3">
          <Label label="参数映射" tooltip="将当前对话变量赋值给接口参数" />
          <KeyValueList
            keyLabel="接口参数"
            valueLabel="机器人变量"
            items={node.config?.paramMapping?.map((m: any) => ({key: m.paramKey, value: m.variableId})) || []}
            onChange={(items) => {
              const paramMapping = items.map(i => ({ paramKey: i.key, variableId: i.value }));
              onChange({ paramMapping });
            }}
          />
        </div>

        <div className="border-t border-gray-100 pt-3">
          <Label label="返回值映射" tooltip="将接口返回字段赋值给机器人变量" />
          <KeyValueList
            keyLabel="JSON路径"
            valueLabel="机器人变量"
            items={node.config?.responseMapping?.map((m: any) => ({key: m.responsePath, value: m.targetVariable})) || []}
            onChange={(items) => {
              const responseMapping = items.map(i => ({ responsePath: i.key, targetVariable: i.value }));
              onChange({ responseMapping });
            }}
          />
        </div>

        {/* 超时时间配置 */}
        <div className="border-t border-gray-100 pt-3">
          <Label label="超时时间" required />
          <div className="flex items-center">
            <input
              type="number"
              min={1}
              max={60}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-l focus:border-primary outline-none"
              value={node.config?.timeoutMs ? Math.round(node.config.timeoutMs / 1000) : 2}
              onChange={(e) => onChange({ timeoutMs: parseInt(e.target.value) * 1000 })}
            />
            <span className="px-3 py-2 bg-slate-100 border border-l-0 border-gray-200 rounded-r text-sm text-slate-600">
              秒
            </span>
          </div>
        </div>

        {/* 多分支结果配置 */}
        <div className="border-t border-gray-100 pt-3 space-y-3">
          <Label label="调用结果分支" tooltip="根据接口调用结果跳转到不同节点" />

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600 w-20">调用成功</span>
              <select
                className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded bg-white outline-none"
                value={node.config?.successTargetId || ''}
                onChange={(e) => onChange({ successTargetId: e.target.value })}
              >
                <option value="">-- 选择节点 --</option>
                {availableNodes.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600 w-20">调用失败</span>
              <select
                className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded bg-white outline-none"
                value={node.config?.errorTargetId || ''}
                onChange={(e) => onChange({ errorTargetId: e.target.value })}
              >
                <option value="">-- 选择节点 --</option>
                {availableNodes.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600 w-20">调用超时</span>
              <select
                className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded bg-white outline-none"
                value={node.config?.timeoutTargetId || ''}
                onChange={(e) => onChange({ timeoutTargetId: e.target.value })}
              >
                <option value="">-- 选择节点 --</option>
                {availableNodes.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600 w-20">未调用</span>
              <select
                className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded bg-white outline-none"
                value={node.config?.notCalledTargetId || ''}
                onChange={(e) => onChange({ notCalledTargetId: e.target.value })}
              >
                <option value="">-- 选择节点 --</option>
                {availableNodes.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </>
    );
  }

  // SMS (New)
  if (node.subType === 'sms') {
    return (
      <>
        <Input
          label="短信模版ID"
          placeholder="SMS_12345678"
          value={node.config?.templateId || ''}
          onChange={(e) => onChange({ templateId: e.target.value })}
        />
        <Input
          label="接收号码变量"
          placeholder="user_phone"
          value={node.config?.phoneNumberVariable || 'user_phone'}
          onChange={(e) => onChange({ phoneNumberVariable: e.target.value })}
        />
        <div className="border-t border-gray-100 pt-3">
          <Label label="模版参数" />
          <KeyValueList
            items={node.config?.params ? Object.entries(node.config.params).map(([k,v]) => ({key:k, value:v as string})) : []}
            onChange={(items) => {
              const params = items.reduce((acc, curr) => ({...acc, [curr.key]: curr.value}), {});
              onChange({ params });
            }}
          />
        </div>

        {/* Error Handling */}
        <div className="pt-4 border-t border-gray-100">
          <SimpleErrorHandling
            label="发送失败时跳转至"
            tooltip="包括手机号格式错误、短信服务商错误等（可选）"
            value={node.config?.onSendErrorNodeId || ''}
            onChange={(value) => onChange({ onSendErrorNodeId: value })}
            availableNodes={availableNodes}
          />
        </div>
      </>
    );
  }

  // 8. Transfer (Updated)
  if (node.subType === 'transfer' || node.subType === 'transfer_pstn') {
    const isPstn = node.subType === 'transfer_pstn';
    return (
      <>
        <Label label="转接目标类型" />
        <div className="flex bg-slate-100 p-1 rounded mb-4">
           <button
             className={`flex-1 py-1 text-xs rounded ${!isPstn ? 'bg-white shadow text-primary' : 'text-slate-500'}`}
             onClick={() => onChange({ transferType: 'queue' })}
           >
             内呼坐席
           </button>
           <button
             className={`flex-1 py-1 text-xs rounded ${isPstn ? 'bg-white shadow text-primary' : 'text-slate-500'}`}
             onClick={() => onChange({ transferType: 'pstn' })}
           >
             外部号码
           </button>
        </div>

        {isPstn ? (
           <Input
             label="外部电话号码"
             placeholder="13800138000"
             value={node.config?.target || ''}
             onChange={(e) => onChange({ target: e.target.value })}
           />
        ) : (
           <Select
             label="技能组队列"
             options={[{label: '通用客服', value: 'queue_general'}, {label: 'VIP专席', value: 'queue_vip'}]}
             value={node.config?.target || 'queue_general'}
             onChange={(e) => onChange({ target: e.target.value })}
           />
        )}

        <Input
          label="转接前播报"
          placeholder="正在为您转接..."
          value={node.config?.playBeforeTransfer || ''}
          onChange={(e) => onChange({ playBeforeTransfer: e.target.value })}
        />

        {/* Error Handling */}
        <div className="pt-4 border-t border-gray-100">
          <SimpleErrorHandling
            label="转接失败时跳转至"
            tooltip="包括目标坐席忙、转接超时、转接被拒绝等"
            value={node.config?.onTransferErrorNodeId || ''}
            onChange={(value) => onChange({ onTransferErrorNodeId: value })}
            availableNodes={availableNodes}
          />
        </div>
      </>
    );
  }

  return null;
};

export default DataConfig;
