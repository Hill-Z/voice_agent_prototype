import {
  IntentNode,
  IntentEdge,
  NodeExecutionInfo,
  ExecutionStep,
  DebugBreakpoint,
  DebugSession
} from '../types';

export interface ExecutionContext {
  variables: Record<string, any>;
  currentNodeId: string | null;
  history: ExecutionStep[];
}

export interface ExecutionResult {
  success: boolean;
  context: ExecutionContext;
  error?: string;
}

export class MockExecutionEngine {
  private nodes: IntentNode[];
  private edges: IntentEdge[];
  private breakpoints: DebugBreakpoint[];
  private context: ExecutionContext;
  private onStep?: (step: ExecutionStep) => void;
  private onPause?: (nodeId: string) => void;
  private shouldPause: boolean = false;

  constructor(
    nodes: IntentNode[],
    edges: IntentEdge[],
    initialVariables: Record<string, any> = {},
    breakpoints: DebugBreakpoint[] = []
  ) {
    this.nodes = nodes;
    this.edges = edges;
    this.breakpoints = breakpoints;
    this.context = {
      variables: { ...initialVariables },
      currentNodeId: null,
      history: []
    };
  }

  setCallbacks(
    onStep?: (step: ExecutionStep) => void,
    onPause?: (nodeId: string) => void
  ) {
    this.onStep = onStep;
    this.onPause = onPause;
  }

  setBreakpoints(breakpoints: DebugBreakpoint[]) {
    this.breakpoints = breakpoints;
  }

  async execute(startNodeId?: string): Promise<ExecutionResult> {
    try {
      const startNode = startNodeId
        ? this.nodes.find(n => n.id === startNodeId)
        : this.nodes.find(n => n.type === 'START');

      if (!startNode) {
        return {
          success: false,
          context: this.context,
          error: '未找到起始节点'
        };
      }

      await this.executeNode(startNode);

      return {
        success: true,
        context: this.context
      };
    } catch (error) {
      return {
        success: false,
        context: this.context,
        error: error instanceof Error ? error.message : '执行出错'
      };
    }
  }

  private async executeNode(node: IntentNode): Promise<void> {
    // Check if should pause (breakpoint)
    if (this.shouldPause || this.checkBreakpoint(node.id)) {
      this.shouldPause = false;
      this.context.currentNodeId = node.id;
      this.onPause?.(node.id);
      return;
    }

    this.context.currentNodeId = node.id;

    // Create execution info
    const executionInfo = await this.simulateNodeExecution(node);

    // Create execution step
    const step: ExecutionStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nodeId: node.id,
      timestamp: Date.now(),
      executionInfo,
      variablesSnapshot: { ...this.context.variables }
    };

    this.context.history.push(step);
    this.onStep?.(step);

    // Update variables based on node execution
    if (executionInfo.status === 'success') {
      this.updateVariables(node, executionInfo.output);
    }

    // Continue to next node if execution was successful
    if (executionInfo.status === 'success') {
      const nextNodeId = this.getNextNodeId(node);
      if (nextNodeId) {
        const nextNode = this.nodes.find(n => n.id === nextNodeId);
        if (nextNode) {
          await this.executeNode(nextNode);
        }
      }
    }
  }

  private async simulateNodeExecution(node: IntentNode): Promise<NodeExecutionInfo> {
    const startTime = Date.now();

    // Simulate execution delay based on node type
    const delay = this.getExecutionDelay(node);
    await this.sleep(delay);

    // Simulate execution logic based on node type
    const result = await this.executeNodeLogic(node);

    const endTime = Date.now();

    return {
      nodeId: node.id,
      status: result.success ? 'success' : 'error',
      input: { ...this.context.variables },
      output: result.output,
      startTime,
      endTime,
      duration: endTime - startTime,
      error: result.error,
      attemptCount: 1
    };
  }

  private async executeNodeLogic(node: IntentNode): Promise<{ success: boolean; output: Record<string, any>; error?: string }> {
    const output = { ...this.context.variables };

    try {
      switch (node.type) {
        case 'START':
          // Start node just passes through
          break;

        case 'LISTEN':
          // Simulate collecting user input
          if (node.subType === 'collect') {
            const variableName = node.config?.variable || 'user_input';
            output[variableName] = '模拟用户输入';
          }
          break;

        case 'ACTION':
          if (node.subType === 'play_tts') {
            // Simulate TTS playback
            output.last_tts = node.config?.content || 'TTS 内容';
          } else if (node.subType === 'transfer') {
            output.transferred = true;
            output.transfer_target = node.config?.transferType || 'agent';
          } else if (node.subType === 'hangup') {
            output.hung_up = true;
          }
          break;

        case 'LOGIC':
          if (node.subType === 'set_variable' && node.config?.operations) {
            node.config.operations.forEach((op: any) => {
              output[op.variableId] = this.evaluateValue(op.value, op.type);
            });
          } else if (node.subType === 'tag') {
            if (!output.tags) output.tags = [];
            node.config?.tags?.forEach((tag: string) => {
              if (!output.tags.includes(tag)) {
                output.tags.push(tag);
              }
            });
          }
          break;

        case 'BRANCH':
          if (node.subType === 'condition') {
            // Simulate condition evaluation
            const conditions = node.config?.expressions || [];
            for (const condition of conditions) {
              const result = this.evaluateCondition(condition.logic);
              if (result) {
                output.last_condition_result = true;
                output.last_condition_name = condition.name;
                break;
              }
            }
          }
          break;

        case 'DATA':
          if (node.subType === 'http_request') {
            // Simulate HTTP request
            output.api_response = {
              status: 200,
              data: { success: true, message: '模拟 API 响应' }
            };
          }
          break;

        case 'AI_AGENT':
          if (node.subType === 'llm') {
            // Simulate LLM response
            output.llm_response = '这是大模型生成的模拟回复内容';
            output.tokens_used = Math.floor(Math.random() * 500) + 100;
          }
          break;

        default:
          // Default pass-through
          break;
      }

      // Simulate random errors (10% chance)
      if (Math.random() < 0.1) {
        return {
          success: false,
          output,
          error: `节点 ${node.label} 执行失败：模拟错误`
        };
      }

      return { success: true, output };
    } catch (error) {
      return {
        success: false,
        output,
        error: error instanceof Error ? error.message : '执行出错'
      };
    }
  }

  private getExecutionDelay(node: IntentNode): number {
    // Different delays based on node type
    switch (node.type) {
      case 'AI_AGENT':
        return Math.random() * 800 + 400; // 400-1200ms
      case 'DATA':
        return Math.random() * 500 + 200; // 200-700ms
      case 'LISTEN':
        return Math.random() * 1000 + 500; // 500-1500ms (user input simulation)
      case 'ACTION':
        if (node.subType === 'play_tts') {
          const content = node.config?.content || '';
          return content.length * 50; // ~50ms per character
        }
        return 100;
      default:
        return Math.random() * 200 + 50; // 50-250ms
    }
  }

  private getNextNodeId(node: IntentNode): string | null {
    if (node.config?.nextNodeId) {
      return node.config.nextNodeId;
    }

    // For condition nodes, find the matching branch
    if (node.type === 'BRANCH' && node.subType === 'condition') {
      const expressions = node.config?.expressions || [];
      for (const expr of expressions) {
        if (this.evaluateCondition(expr.logic)) {
          return expr.targetNodeId;
        }
      }
      // Return else target if no condition matched
      return node.config?.elseTargetId || null;
    }

    // Find connected edge
    const edge = this.edges.find(e => e.source === node.id);
    return edge?.target || null;
  }

  private evaluateCondition(logic: string): boolean {
    // Simple condition evaluation simulation
    // In real implementation, this would evaluate actual expressions
    try {
      // Replace variables with their values
      let expression = logic;
      Object.entries(this.context.variables).forEach(([key, value]) => {
        expression = expression.replace(new RegExp(`\\b${key}\\b`, 'g'), JSON.stringify(value));
      });

      // Simple evaluation (for demo purposes)
      if (expression.includes('==')) {
        const [left, right] = expression.split('==').map(s => s.trim());
        return left === right;
      }
      if (expression.includes('!=')) {
        const [left, right] = expression.split('!=').map(s => s.trim());
        return left !== right;
      }

      // Default random result for complex expressions
      return Math.random() > 0.5;
    } catch {
      return false;
    }
  }

  private evaluateValue(value: string, type: string): any {
    switch (type) {
      case 'NUMBER':
        return parseFloat(value) || 0;
      case 'BOOLEAN':
        return value === 'true' || value === '1';
      case 'JSON':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  private updateVariables(node: IntentNode, output: Record<string, any>): void {
    this.context.variables = { ...this.context.variables, ...output };
  }

  private checkBreakpoint(nodeId: string): boolean {
    return this.breakpoints.some(bp => bp.nodeId === nodeId && bp.enabled);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for step debugging
  stepOver(): void {
    this.shouldPause = true;
    this.resume();
  }

  stepInto(): void {
    this.shouldPause = true;
    this.resume();
  }

  stepOut(): void {
    this.shouldPause = true;
    this.resume();
  }

  pause(): void {
    this.shouldPause = true;
  }

  resume(): void {
    const currentNode = this.context.currentNodeId
      ? this.nodes.find(n => n.id === this.context.currentNodeId)
      : null;

    if (currentNode) {
      this.executeNode(currentNode);
    }
  }

  reset(): void {
    this.context = {
      variables: {},
      currentNodeId: null,
      history: []
    };
    this.shouldPause = false;
  }

  getContext(): ExecutionContext {
    return { ...this.context };
  }

  jumpToStep(stepIndex: number): void {
    if (stepIndex >= 0 && stepIndex < this.context.history.length) {
      const step = this.context.history[stepIndex];
      this.context.currentNodeId = step.nodeId;
      this.context.variables = { ...step.variablesSnapshot };
    }
  }
}

// Factory function to create execution engine
export function createExecutionEngine(
  nodes: IntentNode[],
  edges: IntentEdge[],
  initialVariables?: Record<string, any>,
  breakpoints?: DebugBreakpoint[]
): MockExecutionEngine {
  return new MockExecutionEngine(nodes, edges, initialVariables, breakpoints);
}
