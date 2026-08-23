---
id: doc-guide
title: 文档编写指南
sidebar_label: 编写指南
---

# 文档编写指南

## 文档存放位置

文档正文：主项目的 `manual/docs/` 目录。

文档图片：主项目的 `manual/static/img/` 目录。

左侧目录：主项目的 `manual/sidebars.ts` 文件。

## 创建新文档

在 `manual/docs/` 对应分类目录下创建新的 `.md` 文件，文件名使用英文或拼音。

## 文档头部格式

每个文档开头需要包含 front matter：

```markdown
---
id: doc-id
title: 文档标题
sidebar_label: 侧边栏显示标题
---
```

## 文档内容

使用 Markdown 语法编写内容：

```markdown
# 一级标题

## 二级标题

### 三级标题

- 列表项
- 列表项

**粗体文本**
*斜体文本*

[链接文本](URL)

![图片描述](pathname:///docs/img/图片文件名.png)
```

代码块

```

```

## 更新侧边栏

编辑 `manual/sidebars.ts` 文件，将新文档加入对应分类：

```typescript
{
  type: 'category',
  label: '新分类',
  items: ['新文档-id'],
},
```

## 本地预览

```bash
npm install
npm run dev
```

访问 `http://localhost:8080/docs`，新增或修改的内容需要重新执行 `npm run build:docs` 生成文档与搜索索引。

## 构建生产版本

```bash
npm run build:docs
```
