// 音色市场的原型数据与筛选选项，供 VoiceMarket 页面统一使用。
import {VoiceProduct} from '../../types';

export interface VoiceFilterOption {
  value: string;
  label: string;
}

export const VOICE_PROVIDERS: VoiceFilterOption[] = [
  {value: 'ALL', label: '全部品牌'},
  {value: '自研音色', label: '自研音色'},
  {value: 'MiniMax', label: 'MiniMax'},
  {value: '豆包', label: '豆包'},
  {value: 'Google', label: 'Google'},
  {value: 'ElevenLabs', label: 'ElevenLabs'},
];

export const VOICE_LANGUAGES: VoiceFilterOption[] = [
  {value: 'ALL', label: '全部语种'},
  {value: '中文', label: '中文'},
  {value: '英文', label: '英文 English'},
  {value: '阿拉伯语', label: '阿拉伯语 العربية'},
  {value: '印尼语', label: '印尼语 Bahasa Indonesia'},
  {value: '泰语', label: '泰语 ไทย'},
  {value: '马来西亚语', label: '马来西亚语 Bahasa Melayu'},
];

export const VOICE_GENDERS: VoiceFilterOption[] = [
  {value: 'ALL', label: '全部性别'},
  {value: 'Female', label: '女声'},
  {value: 'Male', label: '男声'},
  {value: 'Neutral', label: '中性'},
];

export const LANGUAGE_PREVIEW_TEXT: Record<string, string> = {
  中文: '您好，很高兴为您服务。请告诉我您今天需要办理的业务。',
  英文: 'Hello, it is a pleasure to assist you. How can I help you today?',
  阿拉伯语: 'مرحباً، يسعدني خدمتك. كيف يمكنني مساعدتك اليوم؟',
  印尼语: 'Halo, senang dapat membantu Anda. Apa yang bisa saya bantu hari ini?',
  泰语: 'สวัสดีค่ะ ยินดีให้บริการ วันนี้มีอะไรให้ช่วยไหมคะ',
  马来西亚语: 'Helo, saya gembira dapat membantu anda. Apakah yang boleh saya bantu hari ini?',
};

export const MOCK_VOICES: VoiceProduct[] = [
  {
    id: 'self-haitang', name: '海棠', voiceId: 'self_haitang_v2', provider: '自研音色', gender: 'Female',
    language: '中文', languages: ['中文'], tags: ['温暖', '自然', '客服'],
    description: '亲和自然的年轻女声，吐字清晰，长时间对话不易产生机械感。', scenario: '客户服务、业务咨询',
    previewText: LANGUAGE_PREVIEW_TEXT.中文, isVip: false,
  },
  {
    id: 'self-qingchuan', name: '青川', voiceId: 'self_qingchuan_v1', provider: '自研音色', gender: 'Male',
    language: '中文', languages: ['中文'], tags: ['沉稳', '可信', '商务'],
    description: '成熟稳重的男声，节奏从容，适合需要建立信任感的业务场景。', scenario: '金融服务、重要通知',
    previewText: LANGUAGE_PREVIEW_TEXT.中文, isVip: false,
  },
  {
    id: 'self-maya', name: 'Maya', voiceId: 'self_maya_en_v1', provider: '自研音色', gender: 'Female',
    language: '英文', languages: ['英文'], tags: ['Friendly', 'Clear', 'Support'],
    description: '清晰友好的英文女声，语速自然，适合国际客户服务。', scenario: '海外客服、预约确认',
    previewText: LANGUAGE_PREVIEW_TEXT.英文, isVip: false,
  },
  {
    id: 'self-noura', name: 'Noura', voiceId: 'self_noura_ar_v1', provider: '自研音色', gender: 'Female',
    language: '阿拉伯语', languages: ['阿拉伯语'], tags: ['Warm', 'Professional'],
    description: '温和专业的阿拉伯语女声，适合标准服务与信息确认。', scenario: '客户服务、通知提醒',
    previewText: LANGUAGE_PREVIEW_TEXT.阿拉伯语, isVip: false,
  },
  {
    id: 'minimax-xiaochen', name: '晓晨', voiceId: 'minimax_xiaochen', provider: 'MiniMax', gender: 'Female',
    language: '中文', languages: ['中文', '英文'], tags: ['轻快', '年轻', '亲切'],
    description: '轻快有活力的年轻女声，中英文切换自然，适合互动型服务。', scenario: '营销外呼、活动邀约',
    previewText: LANGUAGE_PREVIEW_TEXT.中文, isVip: false,
  },
  {
    id: 'minimax-ethan', name: 'Ethan', voiceId: 'minimax_ethan', provider: 'MiniMax', gender: 'Male',
    language: '英文', languages: ['英文'], tags: ['Calm', 'Conversational'],
    description: '自然克制的英文男声，具有真实对话感，适合持续交流。', scenario: '客户回访、业务咨询',
    previewText: LANGUAGE_PREVIEW_TEXT.英文, isVip: false,
  },
  {
    id: 'minimax-putri', name: 'Putri', voiceId: 'minimax_putri_id', provider: 'MiniMax', gender: 'Female',
    language: '印尼语', languages: ['印尼语'], tags: ['Natural', 'Friendly'],
    description: '亲切自然的印尼语女声，适合客服问候与业务说明。', scenario: '海外客服、订单通知',
    previewText: LANGUAGE_PREVIEW_TEXT.印尼语, isVip: false,
  },
  {
    id: 'minimax-mali', name: 'Mali', voiceId: 'minimax_mali_th', provider: 'MiniMax', gender: 'Female',
    language: '泰语', languages: ['泰语'], tags: ['Bright', 'Clear'],
    description: '明亮清晰的泰语女声，信息传达直接，听感轻松。', scenario: '预约提醒、客户服务',
    previewText: LANGUAGE_PREVIEW_TEXT.泰语, isVip: false,
  },
  {
    id: 'doubao-cancan', name: '灿灿', voiceId: 'doubao_cancan_2', provider: '豆包', gender: 'Female',
    language: '中文', languages: ['中文', '英文'], tags: ['活力', '自然', '情感'],
    description: '富有活力和表现力的年轻女声，适合需要情绪感染力的沟通。', scenario: '营销活动、用户激活',
    previewText: LANGUAGE_PREVIEW_TEXT.中文, isVip: true,
  },
  {
    id: 'doubao-yunzhou', name: '云舟', voiceId: 'doubao_yunzhou_2', provider: '豆包', gender: 'Male',
    language: '中文', languages: ['中文', '英文'], tags: ['稳重', '磁性', '专业'],
    description: '沉稳有磁性的专业男声，在正式场景中具有较强的信息可信度。', scenario: '金融通知、售后回访',
    previewText: LANGUAGE_PREVIEW_TEXT.中文, isVip: true,
  },
  {
    id: 'doubao-arif', name: 'Arif', voiceId: 'doubao_arif_id', provider: '豆包', gender: 'Male',
    language: '印尼语', languages: ['印尼语'], tags: ['Steady', 'Service'],
    description: '稳健清晰的印尼语男声，适合标准客服与服务通知。', scenario: '业务办理、账单提醒',
    previewText: LANGUAGE_PREVIEW_TEXT.印尼语, isVip: true,
  },
  {
    id: 'doubao-aisyah', name: 'Aisyah', voiceId: 'doubao_aisyah_ms', provider: '豆包', gender: 'Female',
    language: '马来西亚语', languages: ['马来西亚语'], tags: ['Warm', 'Clear'],
    description: '温暖清晰的马来西亚语女声，语气礼貌，适合服务沟通。', scenario: '客户服务、活动通知',
    previewText: LANGUAGE_PREVIEW_TEXT.马来西亚语, isVip: true,
  },
  {
    id: 'google-aoede', name: 'Aoede', voiceId: 'cmn-CN-Chirp3-HD-Aoede', provider: 'Google', gender: 'Female',
    language: '中文', languages: ['中文'], tags: ['HD', '清晰', '通用'],
    description: '高清晰度中文女声，发音稳定，适合通用型机器人播报。', scenario: '综合客服、信息查询',
    previewText: LANGUAGE_PREVIEW_TEXT.中文, isVip: false,
  },
  {
    id: 'google-charon', name: 'Charon', voiceId: 'en-US-Chirp3-HD-Charon', provider: 'Google', gender: 'Male',
    language: '英文', languages: ['英文'], tags: ['HD', 'Neutral', 'Clear'],
    description: '中性稳健的美式英文男声，发音清楚，适合标准化服务。', scenario: '海外客服、信息播报',
    previewText: LANGUAGE_PREVIEW_TEXT.英文, isVip: false,
  },
  {
    id: 'google-ar-xa', name: 'Wavenet B', voiceId: 'ar-XA-Wavenet-B', provider: 'Google', gender: 'Male',
    language: '阿拉伯语', languages: ['阿拉伯语'], tags: ['Wavenet', 'Formal'],
    description: '正式清晰的阿拉伯语男声，适合标准通知和业务说明。', scenario: '服务通知、身份确认',
    previewText: LANGUAGE_PREVIEW_TEXT.阿拉伯语, isVip: false,
  },
  {
    id: 'google-th-neural', name: 'Neural C', voiceId: 'th-TH-Neural2-C', provider: 'Google', gender: 'Female',
    language: '泰语', languages: ['泰语'], tags: ['Neural', 'Natural'],
    description: '自然流畅的泰语女声，在中长句播报中保持稳定节奏。', scenario: '售后服务、提醒通知',
    previewText: LANGUAGE_PREVIEW_TEXT.泰语, isVip: false,
  },
  {
    id: 'eleven-serena', name: 'Serena', voiceId: 'eleven_serena', provider: 'ElevenLabs', gender: 'Female',
    language: '英文', languages: ['英文', '中文'], tags: ['Warm', 'Calm', 'Premium'],
    description: '温暖平静的叙述型女声，具有明显的真人感和自然停顿。', scenario: '高端客服、关怀回访',
    previewText: LANGUAGE_PREVIEW_TEXT.英文, isVip: true,
  },
  {
    id: 'eleven-adam', name: 'Adam', voiceId: 'eleven_adam', provider: 'ElevenLabs', gender: 'Male',
    language: '英文', languages: ['英文'], tags: ['Deep', 'Confident'],
    description: '低沉自信的英文男声，信息表达有力量，适合正式沟通。', scenario: '商务服务、重要通知',
    previewText: LANGUAGE_PREVIEW_TEXT.英文, isVip: true,
  },
  {
    id: 'eleven-nadira', name: 'Nadira', voiceId: 'eleven_nadira_ar', provider: 'ElevenLabs', gender: 'Female',
    language: '阿拉伯语', languages: ['阿拉伯语', '英文'], tags: ['Expressive', 'Warm'],
    description: '富有表现力的阿拉伯语女声，适合更具温度的客户沟通。', scenario: '客户关怀、满意度回访',
    previewText: LANGUAGE_PREVIEW_TEXT.阿拉伯语, isVip: true,
  },
  {
    id: 'eleven-fahmi', name: 'Fahmi', voiceId: 'eleven_fahmi_ms', provider: 'ElevenLabs', gender: 'Male',
    language: '马来西亚语', languages: ['马来西亚语', '英文'], tags: ['Conversational', 'Friendly'],
    description: '友好自然的马来西亚语男声，适合日常对话式的服务场景。', scenario: '业务咨询、客户回访',
    previewText: LANGUAGE_PREVIEW_TEXT.马来西亚语, isVip: true,
  },
];
