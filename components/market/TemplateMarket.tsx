
import React, { useState } from 'react';
import { 
  Box, ArrowRight, Layers, Tag, Star, Download,
  Briefcase, ShoppingCart, Truck, Shield, GraduationCap
} from 'lucide-react';
import { BotTemplate } from '../../types';

// --- MOCK DATA ---
const CATEGORIES = [
  { id: 'ALL', label: '全部', icon: Layers },
  { id: 'FINANCE', label: '金融信贷', icon: Briefcase },
  { id: 'ECOMMERCE', label: '电商零售', icon: ShoppingCart },
  { id: 'LOGISTICS', label: '物流配送', icon: Truck },
  { id: 'GOV', label: '政务服务', icon: Shield },
  { id: 'EDU', label: '教育培训', icon: GraduationCap },
];

const MOCK_TEMPLATES: BotTemplate[] = [
  { id: '1', name: '信用卡逾期催收', category: 'FINANCE', difficulty: 'Complex', usageCount: 2340, description: '专业的银行级催收话术，包含身份核实、还款意愿确认、施压策略及承诺还款跟进。', tags: ['高并发', '合规'] },
  { id: '2', name: '电商大促活动通知', category: 'ECOMMERCE', difficulty: 'Simple', usageCount: 5120, description: '双11/618大促活动通知，引导用户领取优惠券并告知活动时间。', tags: ['营销', '通知'] },
  { id: '3', name: '快递派送前确认', category: 'LOGISTICS', difficulty: 'Simple', usageCount: 8900, description: '快递员派送前自动外呼，确认客户是否在家及放置位置（门卫/驿站）。', tags: ['高频', '实用'] },
  { id: '4', name: '满意度回访调查', category: 'ALL', difficulty: 'Medium', usageCount: 1200, description: '通用的NPS满意度调查模版，支持打分和语音意见收集。', tags: ['回访', '通用'] },
  { id: '5', name: '课程试听邀约', category: 'EDU', difficulty: 'Medium', usageCount: 650, description: '针对K12教育家长的试听课邀约，包含痛点挖掘和利益点引导。', tags: ['销售', '教育'] },
  { id: '6', name: '保险续保提醒', category: 'FINANCE', difficulty: 'Medium', usageCount: 1500, description: '车险/寿险到期前的温馨提醒，引导客户进行续保操作。', tags: ['续保', '提醒'] },
];

export default function TemplateMarket() {
  const [activeCategory, setActiveCategory] = useState('ALL');

  const filteredTemplates = activeCategory === 'ALL' 
    ? MOCK_TEMPLATES 
    : MOCK_TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <div className="flex h-full bg-slate-50">
       {/* Left Sidebar Categories */}
       <div className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0 py-6">
          <div className="px-6 mb-6">
             <h2 className="text-lg font-bold text-slate-900 flex items-center">
               <Box size={20} className="mr-2 text-indigo-600" />
               模版超市
             </h2>
             <p className="text-xs text-slate-500 mt-1">开箱即用的行业最佳实践</p>
          </div>
          <div className="flex-1 space-y-1 px-3">
             {CATEGORIES.map(cat => (
               <button
                 key={cat.id}
                 onClick={() => setActiveCategory(cat.id)}
                 className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeCategory === cat.id 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                 }`}
               >
                 <cat.icon size={16} className={`mr-3 ${activeCategory === cat.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                 {cat.label}
               </button>
             ))}
          </div>
       </div>

       {/* Main Grid */}
       <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
             {filteredTemplates.map(template => (
               <div key={template.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all group flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                     <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                        <Box size={24} />
                     </div>
                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        template.difficulty === 'Complex' ? 'bg-orange-50 text-orange-600' : 
                        template.difficulty === 'Medium' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                     }`}>
                        {template.difficulty}
                     </span>
                  </div>
                  
                  <h3 className="text-base font-bold text-slate-800 mb-2">{template.name}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                     {template.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                     {template.tags.map(tag => (
                        <span key={tag} className="flex items-center px-2 py-1 bg-slate-50 rounded text-xs text-slate-600 border border-slate-100">
                           <Tag size={10} className="mr-1 opacity-50" /> {tag}
                        </span>
                     ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                     <div className="text-xs text-slate-400 flex items-center">
                        <Download size={12} className="mr-1" /> {template.usageCount} 次引用
                     </div>
                     <button className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-indigo-600 transition-colors flex items-center shadow-sm">
                        使用模版 <ArrowRight size={12} className="ml-1" />
                     </button>
                  </div>
               </div>
             ))}
          </div>
       </div>
    </div>
  );
}
