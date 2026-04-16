import React, { useEffect, useState, useRef } from 'react';
import { parseMarkdown } from '../core/markdownParser';
import { Block } from '../core/types';
import { eventBus } from '../core/EventBus';

interface MarkdownReaderProps {
  content: string;
  fileId?: string;
  onParsed?: (blocks: Block[]) => void;
}

export const MarkdownReader: React.FC<MarkdownReaderProps> = ({ content, fileId = 'default', onParsed }) => {
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    
    const parse = async () => {
      try {
        const { html, blocks } = await parseMarkdown(content, fileId);
        if (isMounted) {
          setHtmlContent(html);
          if (onParsed) {
            onParsed(blocks);
          }
        }
      } catch (err) {
        console.error('Failed to parse markdown:', err);
      }
    };

    parse();

    return () => {
      isMounted = false;
    };
  }, [content, fileId, onParsed]);

  useEffect(() => {
    const options = { rootMargin: '-10% 0px -80% 0px', threshold: 0 };
    const observer = new IntersectionObserver((entries) => {
      const visibleEntries = entries.filter(e => e.isIntersecting);
      if (visibleEntries.length > 0) {
        // 取第一个作为 active block
        const activeElement = visibleEntries[0].target;
        const anchorId = activeElement.getAttribute('data-anchor');
        if (anchorId) {
          console.log(`[IntersectionObserver] Active block changed: ${anchorId}`);
          eventBus.emit('active-block-changed', { anchorId });
        }
      }
    }, options);
    
    // 我们需要在内容渲染后获取 DOM 元素
    // 使用 setTimeout 或者 requestAnimationFrame 确保 DOM 已更新
    const timeoutId = setTimeout(() => {
      document.querySelectorAll('[data-anchor]').forEach(el => observer.observe(el));
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [htmlContent]);

  return (
    <div
      className="markdown-reader prose prose-stone max-w-3xl w-full mx-auto py-8 px-4 prose-headings:font-semibold prose-a:text-blue-600 hover:prose-a:text-blue-500"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
