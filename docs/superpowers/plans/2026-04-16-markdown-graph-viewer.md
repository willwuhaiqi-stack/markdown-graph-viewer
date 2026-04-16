# Markdown 图形化查看器 (V1: 段落级联动版) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个支持大工作区的 Windows 桌面查看器，核心体验是“阅读器滚动段落时，右侧思维导图、Mermaid、知识图谱自动高亮相关的节点”。

**Architecture:** 采用 Electron + React 架构。前端负责 Markdown 渲染（通过 `remark` 解析并注入段落级锚点）和基于 `IntersectionObserver` 的滚动事件派发。右侧面板监听 `ActiveBlockChanged` 事件，动态更新图形的高亮状态。V1 阶段，使用内存结构维护当前文档的 Block/Anchor 索引，验证联动体验。

**Tech Stack:** Electron, React, TypeScript, Tailwind CSS, remark/rehype, Mermaid, markmap, cytoscape.

---

### Task 1: 初始化 Electron + React 基础框架

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `index.html`

- [ ] **Step 1: 安装依赖并初始化项目结构**

```bash
npm init -y
npm install react react-dom
npm install -D electron vite @vitejs/plugin-react typescript electron-builder
```

- [ ] **Step 2: 编写 Vite 和 Electron 基础配置**
在 `vite.config.ts` 中配置 React 插件，在 `electron/main.ts` 中编写创建窗口的逻辑。

- [ ] **Step 3: 编写前端入口文件**
在 `src/App.tsx` 中编写一个简单的“Hello World”组件。

- [ ] **Step 4: 运行应用测试**
运行 `npm run dev` 确保 Electron 窗口成功加载了 React 页面。

- [ ] **Step 5: 提交代码**

```bash
git add .
git commit -m "chore: init electron + react + vite boilerplate"
```

---

### Task 2: 定义 Block 与 Anchor 的数据模型与事件总线

**Files:**
- Create: `src/core/types.ts`
- Create: `src/core/EventBus.ts`

- [ ] **Step 1: 定义核心数据接口**

```typescript
// src/core/types.ts
export interface Link {
  type: 'wikilink' | 'markdown';
  targetPath: string;
  displayText: string;
}

export interface Block {
  id: string; // anchor ID
  fileId: string;
  type: 'heading' | 'paragraph' | 'code' | 'mermaid' | 'list';
  orderIndex: number;
  textPlain: string;
  parentHeadingId?: string;
  headingLevel?: number;
  links: Link[];
}
```

- [ ] **Step 2: 实现简单的事件发布/订阅系统**

```typescript
// src/core/EventBus.ts
type Listener = (data: any) => void;

class EventBus {
  private listeners: Record<string, Listener[]> = {};

  on(event: string, listener: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
  }

  emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((l) => l(data));
    }
  }
}
export const eventBus = new EventBus();
```

- [ ] **Step 3: 提交代码**

```bash
git add src/core
git commit -m "feat: define block interfaces and event bus"
```

---

### Task 3: 实现注入 data-anchor 的 Markdown 渲染器

**Files:**
- Create: `src/components/MarkdownReader.tsx`
- Create: `src/core/markdownParser.ts`

- [ ] **Step 1: 安装 remark 及其相关插件**

```bash
npm install remark remark-parse remark-html unified unist-util-visit
```

- [ ] **Step 2: 编写自定义 remark 插件，遍历 AST 注入属性**

```typescript
// src/core/markdownParser.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import { visit } from 'unist-util-visit';
import { Block } from './types';

// 此处需要实现遍历 AST，生成 Block 列表，并给对应的 HTML 节点打上 data-anchor 和 data-block-id 属性的逻辑。
```

- [ ] **Step 3: 编写阅读器组件展示渲染结果**

```tsx
// src/components/MarkdownReader.tsx
import React, { useEffect, useState } from 'react';
import { parseMarkdown } from '../core/markdownParser';

// 渲染 HTML，并应用样式
```

- [ ] **Step 4: 提交代码**

```bash
git add src/components src/core
git commit -m "feat: implement markdown renderer with injected anchors"
```

---

### Task 4: 实现基于 IntersectionObserver 的 Active Block 计算

**Files:**
- Modify: `src/components/MarkdownReader.tsx`

- [ ] **Step 1: 在 MarkdownReader 中引入 IntersectionObserver**

```typescript
// 在组件挂载后，监听所有带有 [data-anchor] 属性的元素
useEffect(() => {
  const options = { rootMargin: '-10% 0px -80% 0px', threshold: 0 };
  const observer = new IntersectionObserver((entries) => {
    const visibleEntries = entries.filter(e => e.isIntersecting);
    if (visibleEntries.length > 0) {
      // 简单取第一个作为 active block
      const activeElement = visibleEntries[0].target;
      const anchorId = activeElement.getAttribute('data-anchor');
      eventBus.emit('active-block-changed', { anchorId });
    }
  }, options);
  
  document.querySelectorAll('[data-anchor]').forEach(el => observer.observe(el));
  return () => observer.disconnect();
}, [htmlContent]);
```

- [ ] **Step 2: 验证滚动事件触发**
在页面中加入长文本进行测试，确认控制台能打印出正确的 active-block-changed 事件。

- [ ] **Step 3: 提交代码**

```bash
git add src/components/MarkdownReader.tsx
git commit -m "feat: implement intersection observer for scroll sync"
```

---

### Task 5: 搭建 UI 布局与联动面板骨架

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/panels/GraphPanel.tsx`
- Create: `src/components/panels/MindmapPanel.tsx`
- Create: `src/components/panels/MermaidPanel.tsx`

- [ ] **Step 1: 实现左中右三栏布局**
左侧为文件树（Mock 数据），中间为 `MarkdownReader`，右侧为包含 Tab 的面板区域。

- [ ] **Step 2: 在各个面板中监听 ActiveBlockChanged 事件**

```tsx
// src/components/panels/GraphPanel.tsx 示例
import React, { useEffect, useState } from 'react';
import { eventBus } from '../../core/EventBus';

export const GraphPanel = () => {
  const [activeAnchor, setActiveAnchor] = useState('');

  useEffect(() => {
    eventBus.on('active-block-changed', (data: { anchorId: string }) => {
      setActiveAnchor(data.anchorId);
      // 后续在这里调用 Cytoscape 的高亮 API
    });
  }, []);

  return <div>Graph View (Active: {activeAnchor})</div>;
};
```

- [ ] **Step 3: 运行并验证联动效果**
滚动中间的 Markdown 阅读器，观察右侧面板的状态是否随着滚动同步变化。

- [ ] **Step 4: 提交代码**

```bash
git add src
git commit -m "feat: build main UI layout and panel skeletons listening to scroll events"
```

---
（注：Task 6 之后为具体的图形渲染库集成（Cytoscape, Markmap），在此计划文档中略去详细实现，重点跑通核心联动机制。）
