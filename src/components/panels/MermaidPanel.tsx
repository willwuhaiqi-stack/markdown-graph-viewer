import React, { useEffect, useState } from 'react';
import { eventBus } from '../../core/EventBus';
import { Block } from '../../core/types';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

const MermaidChart: React.FC<{ chart: string; id: string }> = ({ chart, id }) => {
  const [svg, setSvg] = useState('');

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      try {
        const { svg: renderedSvg } = await mermaid.render(`mermaid-svg-${id}`, chart);
        if (isMounted) {
          setSvg(renderedSvg);
        }
      } catch (err) {
        console.error('Mermaid render error', err);
        if (isMounted) {
          setSvg(`<div class="text-red-500">Failed to render Mermaid diagram</div>`);
        }
      }
    };
    renderChart();
    return () => {
      isMounted = false;
    };
  }, [chart, id]);

  return <div dangerouslySetInnerHTML={{ __html: svg }} className="flex justify-center" />;
};

interface MermaidPanelProps {
  blocks?: Block[];
}

export const MermaidPanel: React.FC<MermaidPanelProps> = ({ blocks = [] }) => {
  const [activeAnchor, setActiveAnchor] = useState('');

  useEffect(() => {
    const handleActiveBlockChanged = (data: { anchorId: string }) => {
      setActiveAnchor(data.anchorId);
    };

    eventBus.on('active-block-changed', handleActiveBlockChanged);
    return () => {
      eventBus.off('active-block-changed', handleActiveBlockChanged);
    };
  }, []);

  const mermaidBlocks = blocks.filter(b => b.type === 'mermaid');

  const getHighlightClass = (block: Block) => {
    if (!activeAnchor) return 'border-gray-200 bg-white';
    if (block.id === activeAnchor) return 'ring-4 ring-blue-500 bg-blue-50 border-blue-300';
    
    const activeBlock = blocks.find(b => b.id === activeAnchor);
    if (!activeBlock) return 'border-gray-200 bg-white opacity-50';

    if (activeBlock.type === 'heading' && block.parentHeadingId === activeBlock.id) {
      return 'ring-4 ring-blue-500 bg-blue-50 border-blue-300';
    }

    if (activeBlock.parentHeadingId && block.parentHeadingId === activeBlock.parentHeadingId) {
      return 'ring-4 ring-blue-500 bg-blue-50 border-blue-300';
    }

    return 'border-gray-200 bg-white opacity-50';
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Mermaid View</h3>
        <span className="text-xs font-mono bg-blue-100 px-3 py-1 rounded-full text-blue-700 border border-blue-200">
          Active: {activeAnchor || 'None'}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {mermaidBlocks.length === 0 ? (
          <div className="h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            <p className="text-gray-500">No Mermaid diagrams found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {mermaidBlocks.map((block) => (
              <div 
                key={block.id} 
                className={`p-4 rounded-xl transition-all duration-300 border shadow-sm ${getHighlightClass(block)}`}
              >
                <div className="flex justify-between items-center text-xs text-gray-500 mb-3 pb-2 border-b border-gray-100">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">Diagram {block.id}</span>
                  <span className="text-blue-500 font-medium">Mermaid</span>
                </div>
                <div className="bg-white rounded p-2">
                  <MermaidChart chart={block.textPlain} id={block.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
