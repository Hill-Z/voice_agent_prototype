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

启动后可访问：

- 主系统：`http://localhost:8080/`
- 操作手册：`http://localhost:8080/docs`

根目录执行 `npm install` 会同时安装主系统与 `manual/` 文档子项目依赖；`npm run dev` 会同时启动主系统与操作手册。编辑 `manual/docs/` 下的 Markdown 文件并保存后，操作手册页面会自动刷新，不需要执行构建命令。

## Build and deploy

- 完整构建：`npm run build`
- 只构建主系统：`npm run build:app`
- 只构建操作手册：`npm run build:docs`

完整构建结果统一输出到 `dist/`，操作手册位于 `dist/docs/`，部署时发布整个 `dist/` 目录即可。

## Test

- 整站构建检查：`npm run build`
- 操作手册融合检查：`node tests/docsIntegration.static.mjs`

## 已完成功能列表

- 预约回呼：平台内置工具只需配置执行机器人、执行时间和客户号码；默认使用当前机器人，也可选择其他已发布机器人。外呼模块独立负责计划的全生命周期、筛选、编辑、人工结束、重新安排、导出和审计。

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
- 主系统内置独立操作手册，侧边栏进入后直接展示“快速开始”正文和完整文档目录；顶部支持中文全文搜索，文档页可返回主系统。
- 音色市场以紧凑列表展示已接入音色，支持按厂商、语种、性别和关键词筛选，并可逐行播放试听。
- 单个机器人的「对话策略」底部新增智能接听识别与处理；语音留言和 AI 助手共用无、有限次数延时重呼、加入指定外呼任务三种后续操作，并限制联系人跨任务流转次数。
- 信息提取配置包含接口、鉴权和接口工作流：接口负责单次上游调用，工作流负责顺序编排并形成统一输入输出；已发布工作流作为完整“调用服务”供机器人或其他功能引用。三类列表均支持查询和分页，线上旧接口继续按原鉴权方式运行。

- 已整理所有静态 HTML 设计稿到 `docs/html-showcase/`，统一入口为 `docs/html-showcase/index.html`，包含 19 个展示页；Clinical Mint 和 Brex Risk 是当前正式展示候选。

## 待办事项

- 将当前前端模拟报表和长期任务流程配置数据替换为真实后端接口。
- 将客户画像、营销活动和自动跟进数据接入真实后端接口。

## 搜索记录

- 预约回呼参考 [Vapi Outbound Calling](https://docs.vapi.ai/calls/outbound-calling)、[Retell Create Batch Call](https://docs.retellai.com/api-references/create-batch-call)、[Genesys Callbacks in Campaigns](https://help.genesys.cloud/articles/callbacks-in-campaigns/)、[Amazon Connect Queued Callback](https://docs.aws.amazon.com/connect/latest/adminguide/setup-queued-cb.html) 和 [ElevenLabs Batch Calling](https://elevenlabs.io/docs/eleven-agents/phone-numbers/batch-calls)：明确区分客户承诺的“回呼计划”和未接通触发的“自动重呼”；回呼作为单客户、定时、可改期和取消的计划记录管理，底层复用现有外呼执行资源，不生成大量批量任务。
- 外呼联系人变量参考 [Retell AI Dynamic Variables](https://docs.retellai.com/build/dynamic-variables)、[Vapi Dynamic Variables](https://docs.vapi.ai/assistants/dynamic-variables)、[Vapi Outbound Campaigns](https://docs.vapi.ai/outbound-campaigns/overview)、[Genesys Contact List Editor](https://help.genesys.cloud/?p=334179) 和 [Amazon Connect 联系属性](https://docs.aws.amazon.com/connect/latest/adminguide/connect-attrib-list.html)：采用“联系单字段—任务映射—机器人输入变量—单次通话值”的分层，机器人不直接依赖联系单列名，任务启动前校验必填映射并固定机器人版本。
- 信息提取鉴权与工作流参考 [n8n 数据映射](https://docs.n8n.io/data/data-mapping/data-mapping-ui/)、[Postman Flows HTTP Request](https://learning.postman.com/flows/reference/blocks/http-request) 和 [Postman 顺序工作流](https://learning.postman.com/docs/tests-and-scripts/running-collections/building-workflows/)：采用“鉴权独立复用、接口仅保存引用、服务输入—步骤输出—服务输出明确映射”的结构；首版使用线性步骤、最多重试 3 次且不引入回环。
- Gemini TTS 接入需求以 Google Cloud 官方 Gemini TTS、配额和价格文档为准：语音机器人选择 Cloud Text-to-Speech API；明确语言代码不等同于自动检测、流式合成需等待 Half-Close、宿务语与菲律宾语为 Preview，并补齐真人盲听、电话链路、容量和降级验收标准。
- 操作手册融合直接基于用户提供的 `Hill-Z/voice_agent_docs` 仓库，保留 Docusaurus 文档结构并以 `/docs` 子路径集成，未进行额外外部方案搜索。
- 文档全文搜索使用 `@easyops-cn/docusaurus-search-local` 生成本地中文索引，不依赖外部搜索服务或账号。
- 本轮未新增外部搜索；监控报表增强基于现有产品方案和本地代码结构实现。
- 已新增 `DESIGN.md` 作为项目级 UI/UX 设计基线，后续报表和前端页面优先沿用其中的交互状态要求。
- 客户运营增强基于已确认的语音机器人场景方案和现有页面结构实施，未新增外部方案依赖。
- 任务流程配置基于本地 `DESIGN.md`、现有流程代码和项目内流程分析图设计，未新增外部搜索；实现时补齐了拖拽、连线、搜索、排序、分页和完整性校验。
- 音色市场参考 ElevenLabs Voice Library 和 Google Cloud Text-to-Speech 音色目录后，最终按产品反馈收敛为厂商/语种/性别筛选、基础标签和逐行试听，不加入详情、购买或音色管理能力。
- 智能接听处理参考 Twilio Answering Machine Detection、Twilio Studio Flow 和 Amazon Connect Call Progress：采用“识别结果—当前通话处理—通话结束后动作”的结构；语音留言等待提示音后播放内容，AI 助手可进入专用 IVR 流程或挂机，再记录结果、重呼或转入其他外呼任务。
