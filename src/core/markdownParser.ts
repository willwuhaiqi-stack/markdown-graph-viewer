import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import { visit } from 'unist-util-visit';
import { Block, Link } from './types';

export interface ParseResult {
  html: string;
  blocks: Block[];
}

export async function parseMarkdown(content: string, fileId: string = 'default'): Promise<ParseResult> {
  const blocks: Block[] = [];
  
  const processor = unified()
    .use(remarkParse)
    .use(() => (tree: any) => {
      let orderIndex = 0;
      const headingStack: { id: string; level: number }[] = [];
      let currentHeadingId: string | undefined = undefined;

      visit(tree, (node: any) => {
        if (['heading', 'paragraph', 'code', 'list'].includes(node.type)) {
          const id = `block-${orderIndex}`;
          
          // Inject attributes
          node.data = node.data || {};
          node.data.hProperties = node.data.hProperties || {};
          node.data.hProperties['data-anchor'] = id;
          node.data.hProperties['data-block-id'] = id;

          // Extract text and links (simplified)
          let textPlain = '';
          const links: Link[] = [];
          
          if (node.type === 'code') {
            textPlain = node.value || '';
          } else {
            visit(node, (child: any) => {
              if (child.type === 'text' || child.type === 'inlineCode') {
                textPlain += child.value || '';
              }
              if (child.type === 'link') {
                links.push({
                  type: 'markdown',
                  targetPath: child.url,
                  displayText: child.children?.[0]?.value || child.url
                });
              }
            });
          }

          // Identify node type for Block
          let blockType: Block['type'] = 'paragraph';
          if (node.type === 'heading') blockType = 'heading';
          else if (node.type === 'code') blockType = 'code';
          else if (node.type === 'list') blockType = 'list';

          // Mermaid special case for code blocks
          if (node.type === 'code' && node.lang === 'mermaid') {
            blockType = 'mermaid';
          }

          let parentHeadingId: string | undefined = currentHeadingId;

          if (blockType === 'heading') {
            const level = node.depth;
            // Pop stack until we find a heading with a smaller level
            while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
              headingStack.pop();
            }
            parentHeadingId = headingStack.length > 0 ? headingStack[headingStack.length - 1].id : undefined;
            
            headingStack.push({ id, level });
            currentHeadingId = id;
          }

          const block: Block = {
            id,
            fileId,
            type: blockType,
            orderIndex,
            textPlain,
            parentHeadingId,
            headingLevel: node.type === 'heading' ? node.depth : undefined,
            links
          };

          blocks.push(block);
          orderIndex++;
        }
      });
    })
    .use(remarkHtml, { sanitize: false });

  const file = await processor.process(content);
  
  return {
    html: String(file),
    blocks
  };
}
