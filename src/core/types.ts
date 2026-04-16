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
