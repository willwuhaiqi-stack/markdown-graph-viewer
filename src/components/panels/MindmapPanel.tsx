import React, { useEffect, useRef, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import * as d3 from 'd3';
import { eventBus } from '../../core/EventBus';
import { Block } from '../../core/types';

interface MindmapPanelProps {
  content?: string;
  blocks?: Block[];
}

const transformer = new Transformer();

export const MindmapPanel: React.FC<MindmapPanelProps> = ({ content = '', blocks = [] }) => {
  const [activeAnchor, setActiveAnchor] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const markmapRef = useRef<Markmap | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    if (!markmapRef.current) {
      markmapRef.current = Markmap.create(svgRef.current, {
        autoFit: true,
      });
    }
  }, []);

  useEffect(() => {
    if (!markmapRef.current || !content) return;
    const { root } = transformer.transform(content);
    markmapRef.current.setData(root);
    markmapRef.current.fit();
  }, [content]);

  useEffect(() => {
    const handleActiveBlockChanged = (data: { anchorId: string }) => {
      setActiveAnchor(data.anchorId);
    };

    eventBus.on('active-block-changed', handleActiveBlockChanged);
    return () => {
      eventBus.off('active-block-changed', handleActiveBlockChanged);
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current || !activeAnchor || blocks.length === 0) {
      const nodes = d3.select(svgRef.current).selectAll('.markmap-node');
      nodes.style('opacity', 1);
      nodes.select('text').style('font-weight', 'normal').style('fill', '');
      nodes.select('foreignObject div')
        .style('font-weight', 'normal')
        .style('color', '')
        .style('background-color', 'transparent')
        .style('padding', '0');
      return;
    }

    const activeBlock = blocks.find(b => b.id === activeAnchor);
    if (!activeBlock) return;

    let targetHeadingText = '';
    if (activeBlock.type === 'heading') {
      targetHeadingText = activeBlock.textPlain;
    } else if (activeBlock.parentHeadingId) {
      const parent = blocks.find(b => b.id === activeBlock.parentHeadingId);
      if (parent) {
        targetHeadingText = parent.textPlain;
      }
    } else {
      const rootHeading = blocks.find(b => b.type === 'heading' && b.headingLevel === 1);
      if (rootHeading) {
        targetHeadingText = rootHeading.textPlain;
      }
    }

    if (!targetHeadingText) return;

    // Clean up text content (markmap might wrap it in HTML tags if there is markdown formatting)
    // We can create a temporary div to extract plain text
    const extractText = (html: string) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      return tempDiv.textContent || tempDiv.innerText || '';
    };

    const targetPlain = targetHeadingText.trim();

    const nodes = d3.select(svgRef.current).selectAll('.markmap-node');
    
    nodes.each(function(d: any) {
      const node = d3.select(this);
      const nodeText = extractText(d.data.content).trim();
      const isMatch = nodeText === targetPlain;
      
      node.style('opacity', isMatch ? 1 : 0.4);
      
      // Update text style for highlighting
      const textElement = node.select('text');
      const foreignObject = node.select('foreignObject');
      
      if (!textElement.empty()) {
        textElement
          .style('font-weight', isMatch ? 'bold' : 'normal')
          .style('fill', isMatch ? '#2563eb' : '');
      }
      
      if (!foreignObject.empty()) {
        foreignObject.select('div')
          .style('font-weight', isMatch ? 'bold' : 'normal')
          .style('color', isMatch ? '#2563eb' : '')
          .style('background-color', isMatch ? '#eff6ff' : 'transparent')
          .style('border-radius', '4px')
          .style('padding', isMatch ? '2px 4px' : '0');
      }
    });

  }, [activeAnchor, blocks]);

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Mindmap View</h3>
        <span className="text-xs font-mono bg-blue-100 px-3 py-1 rounded-full text-blue-700 border border-blue-200">
          Active: {activeAnchor || 'None'}
        </span>
      </div>
      <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg bg-white overflow-hidden relative">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
};
