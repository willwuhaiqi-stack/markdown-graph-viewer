import React, { useEffect, useState } from 'react'
import { MarkdownReader } from './components/MarkdownReader'
import { eventBus } from './core/EventBus'
import { GraphPanel } from './components/panels/GraphPanel'
import { MindmapPanel } from './components/panels/MindmapPanel'
import { MermaidPanel } from './components/panels/MermaidPanel'

const mockMarkdown = `
# Interactive Markdown Graph Viewer

Welcome to the interactive Markdown Graph Viewer. This document is a comprehensive demonstration of the real-time synchronization between the text editor and various visualization panels. The panels include a Knowledge Graph, a Mindmap, and Mermaid diagrams.

## Introduction
The system uses advanced Markdown parsing to build a structured representation (AST) of the document. You can jump to [System Architecture](#system-architecture) for an overview of how components interact.

Our core features are designed to enhance the reading and editing experience for complex documents:
- **Real-time synchronization**: Scroll the document and watch the active block highlight in the panels.
- **Multiple view modes**: Switch between Knowledge Graph, Mindmap, and Mermaid.
- **Extensible architecture**: Easily add new panel types or parsers.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor. Suspendisse dictum feugiat nisl ut dapibus.

## System Architecture

The application is built using React, Vite, and modern web technologies. See [Frontend Components](#frontend-components) for details about the UI layer.

\`\`\`mermaid
graph TD;
    App-->Sidebar[Left Sidebar];
    App-->Editor[Markdown Reader];
    App-->Visualizer[Right Panel];
    Visualizer-->Graph[Knowledge Graph];
    Visualizer-->Mindmap[Mindmap View];
    Visualizer-->MermaidPanel[Mermaid Diagrams];
\`\`\`

Proin aliquam id diam at imperdiet. Nulla in risus ac leo facilisis volutpat id ac libero. Integer tristique in orci in congue. Vivamus a nisi sit amet ante porta dictum. Nam consequat, magna a facilisis aliquet, orci elit dictum magna, at vestibulum justo nibh id nisi.

### Frontend Components

The frontend consists of three main columns. The right column contains tabs for different views. We also have an event bus that handles communication. Read more about it in [Event Bus](#event-bus).

1. **Left Sidebar**: Displays the file tree and workspace information.
2. **Center Editor**: Renders the Markdown content and observes scroll position.
3. **Right Visualization Panel**: Contains the graph, mindmap, and mermaid tabs.

Fusce gravida, arcu et scelerisque pellentesque, nisl justo interdum lorem, quis facilisis magna lorem vel diam. Sed non dui iaculis, placerat urna id, venenatis libero. Nulla facilisi. Sed tincidunt vel orci vel facilisis.

### Event Bus

The event bus uses a simple pub/sub pattern to decouple components. It fires \`active-block-changed\` events when the user scrolls through the document, allowing the visualization panels to highlight the active node without causing a full re-render of the application.

## Data Flow

Data flows from the Markdown source, through the parser, and into the visual components. The parser extracts headings, links, and code blocks to build a rich abstract syntax tree (AST).

\`\`\`mermaid
sequenceDiagram
    participant Editor
    participant Parser
    participant EventBus
    participant Panel
    Editor->>Parser: Raw Markdown Text
    Parser-->>Editor: AST Blocks & HTML
    Editor->>EventBus: Scroll Event (Active Block ID)
    EventBus->>Panel: Highlight Active Block
\`\`\`

Morbi euismod justo quis sapien lacinia, eu elementum neque aliquet. In hac habitasse platea dictumst. Quisque sed hendrerit arcu. Phasellus et est vel sem convallis gravida. Sed vel nunc in ligula hendrerit dictum. In hac habitasse platea dictumst. Nullam nec est id diam tempus sodales.

## Advanced Features

Here are some advanced features you can explore. They rely heavily on the [System Architecture](#system-architecture) and the [Data Flow](#data-flow).

- **Bi-directional sync**: (Planned) Clicking a node in the graph will scroll the editor.
- **Dynamic rendering**: Diagrams update automatically when markdown changes.
- **Markdown parsing**: Unified AST is used to extract headings, links, and structure.

\`\`\`mermaid
pie title Document Block Types
    "Headings" : 25
    "Paragraphs" : 50
    "Mermaid Diagrams" : 15
    "Lists" : 10
\`\`\`

### Performance Optimization

We use \`React.memo\` and debouncing to ensure smooth scrolling even with large documents. The Intersection Observer API is used to detect which block is currently visible in the viewport, which is much more performant than listening to scroll events directly.

### Future Enhancements

The current implementation is a solid foundation. Future work will focus on:
1. Adding support for PlantUML.
2. Improving the Mindmap layout algorithm.
3. Adding interactive editing capabilities directly from the Knowledge Graph.

## Conclusion

This concludes the demonstration document. Scroll up and down to see how the active block highlights change in the Knowledge Graph, Mindmap, and Mermaid panels. 

To review the architecture, go back to [Introduction](#introduction) or [System Architecture](#system-architecture).
`;

const App: React.FC = () => {
  const [activeBlock, setActiveBlock] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'graph' | 'mindmap' | 'mermaid'>('graph')
  const [blocks, setBlocks] = useState<any[]>([])
  const [content, setContent] = useState<string>(mockMarkdown)
  const [filePath, setFilePath] = useState<string>('mock-document.md')

  useEffect(() => {
    const handleActiveBlockChanged = (data: { anchorId: string }) => {
      setActiveBlock(data.anchorId)
    }

    eventBus.on('active-block-changed', handleActiveBlockChanged)

    if (window.electronAPI && window.electronAPI.onFileOpened) {
      window.electronAPI.onFileOpened((data) => {
        setContent(data.content)
        const fileName = data.filePath.split(/[/\\]/).pop() || 'unknown.md'
        setFilePath(fileName)
      })
    }

    return () => {
      eventBus.off('active-block-changed', handleActiveBlockChanged)
    }
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-[#37352f] font-sans selection:bg-[#2383e2]/20 selection:text-[#37352f]">
      {/* Left Column: File Tree */}
      <div className="w-64 border-r border-black/5 bg-[#f7f7f5] flex flex-col transition-all">
        <div className="p-3 pl-4 flex items-center h-12">
          <h2 className="font-semibold text-sm text-[#37352f]/80">Workspace</h2>
        </div>
        <div className="px-2 flex-1 overflow-y-auto custom-scrollbar">
          <ul className="space-y-[2px] text-[13px] font-medium">
            <li className="px-2 py-1.5 bg-black/5 text-[#37352f] rounded-md cursor-pointer flex items-center gap-2">
              <span className="opacity-70 text-base">📄</span> {filePath}
            </li>
            <li className="px-2 py-1.5 text-[#37352f]/70 hover:bg-black/5 rounded-md cursor-pointer flex items-center gap-2 transition-colors">
              <span className="opacity-70 text-base">📄</span> design-notes.md
            </li>
            <li className="px-2 py-1.5 text-[#37352f]/70 hover:bg-black/5 rounded-md cursor-pointer flex items-center gap-2 transition-colors">
              <span className="opacity-70 text-base">📄</span> architecture.md
            </li>
          </ul>
        </div>
      </div>

      {/* Center Column: Markdown Reader */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        <div className="px-6 h-12 flex items-center justify-between sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-black/5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#37352f]/80">{filePath}</span>
          </div>
          <span className="text-[11px] px-2.5 py-1 bg-black/5 rounded-full text-[#37352f]/60 font-medium tracking-wide">
            Active: {activeBlock || 'None'}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <MarkdownReader content={content} onParsed={setBlocks} />
        </div>
      </div>

      {/* Right Column: Graphic Panels */}
      <div className="w-1/3 min-w-[300px] max-w-[500px] border-l border-black/5 bg-[#fbfbfa] flex flex-col">
        {/* Tabs */}
        <div className="flex px-5 pt-3 gap-5 border-b border-black/5 bg-[#fbfbfa]">
          <button
            onClick={() => setActiveTab('graph')}
            className={`pb-2.5 text-[13px] font-medium transition-colors border-b-[2px] ${
              activeTab === 'graph' ? 'border-[#37352f] text-[#37352f]' : 'border-transparent text-[#37352f]/50 hover:text-[#37352f]/80'
            }`}
          >
            Knowledge Graph
          </button>
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`pb-2.5 text-[13px] font-medium transition-colors border-b-[2px] ${
              activeTab === 'mindmap' ? 'border-[#37352f] text-[#37352f]' : 'border-transparent text-[#37352f]/50 hover:text-[#37352f]/80'
            }`}
          >
            Mindmap
          </button>
          <button
            onClick={() => setActiveTab('mermaid')}
            className={`pb-2.5 text-[13px] font-medium transition-colors border-b-[2px] ${
              activeTab === 'mermaid' ? 'border-[#37352f] text-[#37352f]' : 'border-transparent text-[#37352f]/50 hover:text-[#37352f]/80'
            }`}
          >
            Mermaid
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'graph' && <GraphPanel blocks={blocks} />}
          {activeTab === 'mindmap' && <MindmapPanel content={content} blocks={blocks} />}
          {activeTab === 'mermaid' && <MermaidPanel blocks={blocks} />}
        </div>
      </div>
    </div>
  )
}

export default App
