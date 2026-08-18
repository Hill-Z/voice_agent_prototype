import { ModelType } from '../types';

export interface QAWithCategory {
  question: string;
  answer: string;
  category: string;
  confidence: number;
}

export class CategoryExtractionService {
  private apiKey: string;
  private model: ModelType;

  constructor(apiKey: string, model: ModelType = ModelType.GEMINI_FLASH) {
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * 从对话中提取带分类的问答对
   */
  async extractQAWithCategory(
    conversation: string,
    availableCategories: string[]
  ): Promise<QAWithCategory[]> {
    const prompt = this.buildExtractionPrompt(conversation, availableCategories);
    
    try {
      const response = await this.callLLM(prompt);
      return this.parseExtractionResponse(response);
    } catch (error) {
      console.error('提取问答对失败:', error);
      return [];
    }
  }

  /**
   * 为单个问答对推荐分类
   */
  async suggestCategory(
    question: string,
    answer: string,
    availableCategories: string[]
  ): Promise<{ category: string; confidence: number }> {
    const prompt = this.buildCategoryPrompt(question, answer, availableCategories);
    
    try {
      const response = await this.callLLM(prompt);
      return this.parseCategoryResponse(response);
    } catch (error) {
      console.error('推荐分类失败:', error);
      return { category: '未分类', confidence: 0 };
    }
  }

  /**
   * 批量推荐分类
   */
  async suggestCategoriesBatch(
    items: Array<{ question: string; answer: string }>,
    availableCategories: string[]
  ): Promise<Array<{ category: string; confidence: number }>> {
    const results: Array<{ category: string; confidence: number }> = [];
    
    // 串行处理避免并发限制
    for (const item of items) {
      const result = await this.suggestCategory(
        item.question,
        item.answer,
        availableCategories
      );
      results.push(result);
    }
    
    return results;
  }

  private buildExtractionPrompt(conversation: string, categories: string[]): string {
    return `请分析以下对话内容，提取用户咨询的高频业务问题及对应的标准回答，并自动分类。

可用分类列表：
${categories.map(c => `- ${c}`).join('\n')}

对话内容：
${conversation}

请输出JSON格式：
{
  "qa_pairs": [
    {
      "question": "用户问题",
      "answer": "答案内容",
      "category": "最匹配的分类名称",
      "confidence": 0.95
    }
  ]
}

注意：
1. 如果无法确定分类，category设为"未分类"
2. confidence范围0-1，表示分类确定性
3. 只从提供的分类列表中选择
4. 提取的问题应该是通用的，不要包含特定订单号等个性化信息`;
  }

  private buildCategoryPrompt(
    question: string,
    answer: string,
    categories: string[]
  ): string {
    return `请为以下问答对选择最合适的分类。

可用分类列表：
${categories.map(c => `- ${c}`).join('\n')}

问题：${question}
答案：${answer}

请输出JSON格式：
{
  "category": "分类名称",
  "confidence": 0.95,
  "reason": "选择理由"
}

注意：
1. 只从提供的分类列表中选择
2. 如果都不匹配，category设为"未分类"
3. confidence范围0-1`;
  }

  private async callLLM(prompt: string): Promise<string> {
    // 这里应该调用实际的LLM API
    // 目前使用模拟实现
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟响应
    return JSON.stringify({
      qa_pairs: [
        {
          question: "示例问题",
          answer: "示例答案",
          category: "售后服务",
          confidence: 0.92
        }
      ]
    });
  }

  private parseExtractionResponse(response: string): QAWithCategory[] {
    try {
      const data = JSON.parse(response);
      if (data.qa_pairs && Array.isArray(data.qa_pairs)) {
        return data.qa_pairs.map((item: any) => ({
          question: item.question || '',
          answer: item.answer || '',
          category: item.category || '未分类',
          confidence: item.confidence || 0
        }));
      }
    } catch (error) {
      console.error('解析提取响应失败:', error);
    }
    return [];
  }

  private parseCategoryResponse(response: string): { category: string; confidence: number } {
    try {
      const data = JSON.parse(response);
      return {
        category: data.category || '未分类',
        confidence: data.confidence || 0
      };
    } catch (error) {
      console.error('解析分类响应失败:', error);
      return { category: '未分类', confidence: 0 };
    }
  }
}

// 导出单例实例
export const categoryExtractionService = new CategoryExtractionService(
  process.env.REACT_APP_LLM_API_KEY || ''
);
