
import React, { useState, useRef } from 'react';
import { 
  X, Sparkles, Upload, Image as ImageIcon, FileText, 
  ArrowRight, Loader2, Wand2, Check, RefreshCw 
} from 'lucide-react';
import { generateAdvancedBotPrompt } from '../../services/geminiService';
import { BotVariable } from '../../types';
import { Select, Label } from '../ui/FormComponents';

interface PromptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (description: string, prompt: string) => void;
  existingVariables: BotVariable[];
}

const INDUSTRIES = ['金融信贷', '教育培训', '电商零售', '政务服务', '医疗健康', '企业服务', '通用场景'];
const SCENARIOS = ['客户接待/咨询', '销售外呼/邀约', '回访/通知', '催收/提醒', '信息核实', '投诉处理'];

const PromptGeneratorModal: React.FC<PromptGeneratorModalProps> = ({ 
  isOpen, onClose, onApply, existingVariables 
}) => {
  // State
  const [industry, setIndustry] = useState('金融信贷');
  const [scenario, setScenario] = useState('催收/提醒');
  const [inputType, setInputType] = useState<'TEXT' | 'IMAGE'>('TEXT');
  const [userText, setUserText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ description: string; systemPrompt: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!userText && !selectedImage) {
      alert("请至少提供文本描述或上传一张图片素材");
      return;
    }

    setIsGenerating(true);
    try {
      let imageBase64 = undefined;
      
      if (selectedImage && imagePreview) {
        // Remove data URL header (e.g., "data:image/png;base64,")
        imageBase64 = imagePreview.split(',')[1];
      }

      const response = await generateAdvancedBotPrompt({
        industry,
        scenario,
        userText: userText || "请根据提供的图片内容分析业务流程。",
        imageBase64,
        variables: existingVariables
      });

      setResult(response);
    } catch (error) {
      console.error(error);
      alert("生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-6xl h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-md">
               <Sparkles size={20} />
             </div>
             <div>
               <h2 className="text-lg font-bold text-slate-800">AI 智能提示词工坊</h2>
               <p className="text-xs text-slate-500">上传业务文档截图或描述，自动生成专业话术与流程配置</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Configuration & Input */}
          <div className="w-1/3 min-w-[350px] border-r border-gray-200 bg-white flex flex-col overflow-y-auto">
             <div className="p-6 space-y-8">
                
                {/* Section 1: Context */}
                <div>
                   <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                     <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs mr-2">1</span>
                     业务场景定义
                   </h3>
                   <div className="space-y-4 pl-8">
                      <Select 
                        label="所属行业" 
                        options={INDUSTRIES} 
                        value={industry} 
                        onChange={(e) => setIndustry(e.target.value)} 
                      />
                      <Select 
                        label="应用场景" 
                        options={SCENARIOS} 
                        value={scenario} 
                        onChange={(e) => setScenario(e.target.value)} 
                      />
                      
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                         <div className="text-xs font-bold text-slate-500 mb-2 flex justify-between">
                            <span>可用变量 ({existingVariables.length})</span>
                            <span className="text-[10px] bg-slate-200 px-1 rounded">Auto-Inject</span>
                         </div>
                         <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                            {existingVariables.map(v => (
                              <span key={v.id} className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-mono" title={v.description}>
                                {`{{${v.name}}}`}
                              </span>
                            ))}
                            {existingVariables.length === 0 && <span className="text-[10px] text-slate-400">无变量</span>}
                         </div>
                      </div>
                   </div>
                </div>

                {/* Section 2: Input */}
                <div className="flex-1 flex flex-col">
                   <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                     <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs mr-2">2</span>
                     素材导入
                   </h3>
                   
                   <div className="pl-8 flex-1 flex flex-col">
                      <div className="flex border-b border-gray-200 mb-3">
                         <button 
                           onClick={() => setInputType('TEXT')}
                           className={`pb-2 px-4 text-xs font-bold transition-colors flex items-center ${inputType === 'TEXT' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                           <FileText size={14} className="mr-2" /> 文本描述
                         </button>
                         <button 
                           onClick={() => setInputType('IMAGE')}
                           className={`pb-2 px-4 text-xs font-bold transition-colors flex items-center ${inputType === 'IMAGE' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                           <ImageIcon size={14} className="mr-2" /> 图片/截图
                         </button>
                      </div>

                      {inputType === 'TEXT' ? (
                        <textarea 
                          className="w-full flex-1 min-h-[150px] p-3 text-sm border border-gray-200 rounded-lg focus:border-primary outline-none resize-none bg-slate-50"
                          placeholder="请粘贴您的业务话术SOP，或直接描述需求。例如：'这是一个催收机器人，开场需要核实身份，如果用户承认是本人，则告知欠款金额{{amount}}...'"
                          value={userText}
                          onChange={(e) => setUserText(e.target.value)}
                        />
                      ) : (
                        <div className="flex-1 border-2 border-dashed border-gray-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center relative hover:bg-slate-100 transition-colors">
                           {!imagePreview ? (
                             <div 
                               className="flex flex-col items-center justify-center cursor-pointer absolute inset-0"
                               onClick={() => fileInputRef.current?.click()}
                             >
                               <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                                  <Upload size={24} className="text-primary" />
                               </div>
                               <p className="text-sm font-medium text-slate-600">点击上传 SOP 流程图 / 话术截图</p>
                               <p className="text-xs text-slate-400 mt-1">支持 PNG, JPG</p>
                             </div>
                           ) : (
                             <div className="relative w-full h-full p-2 group">
                               <img src={imagePreview} className="w-full h-full object-contain rounded" alt="Preview" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button onClick={() => { setSelectedImage(null); setImagePreview(null); }} className="px-4 py-2 bg-white rounded-full text-xs font-bold text-red-500">移除图片</button>
                               </div>
                             </div>
                           )}
                           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </div>
                      )}
                      
                      {inputType === 'IMAGE' && (
                         <div className="mt-3">
                           <label className="text-xs font-bold text-slate-500 mb-1 block">补充说明 (可选)</label>
                           <input 
                             className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-primary"
                             placeholder="例如：请重点关注图片中的红色分支流程..."
                             value={userText}
                             onChange={(e) => setUserText(e.target.value)}
                           />
                         </div>
                      )}
                   </div>
                </div>

                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center disabled:opacity-70 disabled:hover:scale-100"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className="animate-spin mr-2" /> AI 正在解析素材并生成...
                    </>
                  ) : (
                    <>
                      <Wand2 size={18} className="mr-2" /> 开始生成配置
                    </>
                  )}
                </button>
             </div>
          </div>

          {/* Right: Preview & Action */}
          <div className="flex-1 bg-slate-50 flex flex-col min-w-0">
             {!result ? (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                    <Sparkles size={40} className="text-indigo-200" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-600 mb-2">等待生成</h3>
                  <p className="text-sm text-center max-w-md">
                    请在左侧配置场景并导入素材，AI 将为您自动提取业务逻辑，生成符合标准的机器人角色设定与系统提示词。
                  </p>
               </div>
             ) : (
               <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
                     <div className="flex items-center text-green-600 text-sm font-bold">
                       <Check size={16} className="mr-1.5" /> 生成成功
                     </div>
                     <div className="flex space-x-3">
                        <button onClick={handleGenerate} className="px-3 py-1.5 text-xs text-slate-500 hover:text-primary flex items-center bg-slate-50 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all">
                          <RefreshCw size={12} className="mr-1" /> 重新生成
                        </button>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-6">
                     {/* Description Preview */}
                     <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <Label label="生成的机器人描述" />
                        <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">
                           {result.description}
                        </div>
                     </div>

                     {/* System Prompt Preview */}
                     <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                           <Label label="生成的 System Prompt" />
                           <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Markdown 格式</span>
                        </div>
                        <textarea 
                          className="w-full h-[400px] p-4 text-sm font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-primary resize-y leading-relaxed"
                          value={result.systemPrompt}
                          onChange={(e) => setResult({ ...result, systemPrompt: e.target.value })}
                        />
                     </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-6 bg-white border-t border-gray-200 flex justify-end space-x-4">
                     <button onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                       放弃
                     </button>
                     <button 
                       onClick={() => onApply(result.description, result.systemPrompt)}
                       className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold shadow-lg shadow-sky-100 hover:bg-sky-600 transition-all flex items-center"
                     >
                       应用到配置 <ArrowRight size={16} className="ml-2" />
                     </button>
                  </div>
               </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PromptGeneratorModal;
