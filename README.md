<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1roavSagafxEJgVSbE9FoTxOQjdVY5l6y

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 已完成功能列表

- 机器人配置、流程配置、主题管理、工具配置、坐席管理、通话记录和监控报表演示。
- 流程配置已升级为任务流程配置，支持流程方案列表、空白新建、从模板创建、多 Agent 画布编排、节点拖拽、节点配置、连线配置、模拟运行和运行任务查看。
- 监控报表已调整为一个综合运营报表页，按顶部日期筛选统一统计通话、Topic、Flow 和工具调用。
- 报表支持刷新、导出、加载态、空状态，以及主要表格的搜索、排序、分页和每页条数切换。
- 报表内容支持通话趋势、重复呼入、地域分析、Topic 主题分布、Flow 展开明细和工具调用。
- 客户运营能力已补充客户画像、营销活动、自动跟进及机器人级营销与跟进配置。
- 自动跟进规则已升级为规则画布，支持触发事件、条件判断、时间计算、触达保护、执行动作、重试策略和退出条件的图式查看。
- 语音运行控制已补充安全护栏、工具调用分级与人工审批、机器人全局异常兜底及 Step 级异常覆盖配置。
- 机器人配置支持单 Agent、Supervisor 和 Handoff 三种运行模式，并可在无限画布中组织 Flow、旧版意图流程、主题、静默任务、人工服务和挂机节点；Supervisor 与 Handoff 分别保存画布草稿。
- 单个机器人的主题管理支持折叠式主题匹配设置，可配置最近历史消息条数及是否优先匹配上一轮主题，原主题列表管理保持不变。

- 已整理所有静态 HTML 设计稿到 `docs/html-showcase/`，统一入口为 `docs/html-showcase/index.html`，包含 19 个展示页；Clinical Mint 和 Brex Risk 是当前正式展示候选。

## 待办事项

- 将当前前端模拟报表和长期任务流程配置数据替换为真实后端接口。
- 将客户画像、营销活动和自动跟进数据接入真实后端接口。

## 搜索记录

- 本轮未新增外部搜索；监控报表增强基于现有产品方案和本地代码结构实现。
- 已新增 `DESIGN.md` 作为项目级 UI/UX 设计基线，后续报表和前端页面优先沿用其中的交互状态要求。
- 客户运营增强基于已确认的语音机器人场景方案和现有页面结构实施，未新增外部方案依赖。
- 任务流程配置基于本地 `DESIGN.md`、现有流程代码和项目内流程分析图设计，未新增外部搜索；实现时补齐了拖拽、连线、搜索、排序、分页和完整性校验。
