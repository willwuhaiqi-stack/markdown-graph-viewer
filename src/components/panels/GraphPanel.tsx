import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { eventBus } from '../../core/EventBus';
import { Block } from '../../core/types';

interface GraphPanelProps {
  blocks?: Block[];
}

export const GraphPanel: React.FC<GraphPanelProps> = ({ blocks = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [activeAnchor, setActiveAnchor] = useState('');

  // 1. Initialize Cytoscape and update elements when blocks change
  useEffect(() => {
    if (!containerRef.current) return;

    const elements: cytoscape.ElementDefinition[] = [];

    // Map headings by lowercased text for link resolution
    const headingMap = new Map<string, string>();
    blocks.forEach(b => {
      if (b.type === 'heading') {
        const normalized = b.textPlain.toLowerCase().trim().replace(/\s+/g, '-');
        headingMap.set(normalized, b.id);
      }
    });

    blocks.forEach(block => {
      // Add Node
      const label = block.type === 'heading' ? block.textPlain : `${block.type} ${block.orderIndex}`;
      elements.push({
        data: {
          id: block.id,
          label: label.substring(0, 30) + (label.length > 30 ? '...' : ''),
          type: block.type,
        }
      });

      // Add hierarchy edge
      if (block.parentHeadingId) {
        elements.push({
          data: {
            id: `edge-${block.parentHeadingId}-${block.id}`,
            source: block.parentHeadingId,
            target: block.id,
            type: 'hierarchy'
          }
        });
      }

      // Add link edges
      block.links.forEach((link, idx) => {
        let targetId: string | undefined = undefined;

        if (link.targetPath.startsWith('#')) {
          const targetSlug = link.targetPath.substring(1).toLowerCase();
          targetId = headingMap.get(targetSlug);
        }

        if (targetId) {
          elements.push({
            data: {
              id: `link-${block.id}-${targetId}-${idx}`,
              source: block.id,
              target: targetId,
              type: 'link'
            }
          });
        }
      });
    });

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'font-size': '10px',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': '#93c5fd', // blue-300
            'color': '#1e3a8a', // blue-900
            'width': 'label',
            'height': 'label',
            'padding': '10px',
            'shape': 'round-rectangle'
          }
        },
        {
          selector: 'node[type = "heading"]',
          style: {
            'background-color': '#fca5a5', // red-300
            'color': '#7f1d1d', // red-900
            'font-weight': 'bold',
            'font-size': '12px',
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#cbd5e1', // slate-300
            'target-arrow-color': '#cbd5e1',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        },
        {
          selector: 'edge[type = "link"]',
          style: {
            'line-color': '#f59e0b', // amber-500
            'target-arrow-color': '#f59e0b',
            'line-style': 'dashed'
          }
        },
        // Highlight styles
        {
          selector: 'node.highlight',
          style: {
            'border-width': 3,
            'border-color': '#2563eb', // blue-600
            'background-color': '#bfdbfe', // blue-200
          }
        },
        {
          selector: 'node[type = "heading"].highlight',
          style: {
            'border-width': 3,
            'border-color': '#dc2626', // red-600
            'background-color': '#fecaca', // red-200
          }
        },
        {
          selector: 'edge.highlight',
          style: {
            'line-color': '#2563eb',
            'target-arrow-color': '#2563eb',
            'width': 3
          }
        },
        {
          selector: 'edge[type = "link"].highlight',
          style: {
            'line-color': '#d97706', // amber-600
            'target-arrow-color': '#d97706',
          }
        }
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        padding: 30,
        spacingFactor: 1.2,
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [blocks]);

  // 2. Listen to active-block-changed
  useEffect(() => {
    const handleActiveBlockChanged = (data: { anchorId: string }) => {
      setActiveAnchor(data.anchorId);
      
      const cy = cyRef.current;
      if (!cy) return;

      // Remove all highlights
      cy.elements().removeClass('highlight');

      if (data.anchorId) {
        const node = cy.getElementById(data.anchorId);
        if (node.length > 0) {
          node.addClass('highlight');
          node.connectedEdges().addClass('highlight');
          node.connectedEdges().connectedNodes().addClass('highlight');
          
          // Center on the active node
          cy.animate({
            center: { eles: node },
            duration: 300
          });
        }
      }
    };

    eventBus.on('active-block-changed', handleActiveBlockChanged);
    return () => {
      eventBus.off('active-block-changed', handleActiveBlockChanged);
    };
  }, []);

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Knowledge Graph</h3>
        <span className="text-xs font-mono bg-blue-100 px-3 py-1 rounded-full text-blue-700 border border-blue-200">
          Active: {activeAnchor || 'None'}
        </span>
      </div>
      <div 
        ref={containerRef}
        className="flex-1 border-2 border-dashed border-gray-300 rounded-lg bg-white overflow-hidden"
      />
    </div>
  );
};
