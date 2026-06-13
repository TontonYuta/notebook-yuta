export interface Notebook {
  id: string;
  name: string;
  content: string;
  type?: 'text' | 'pdf';
  lastModified: number;
  stickies: StickyNote[];
  color?: 'pink' | 'green' | 'blue' | 'yellow' | 'default';
}

export interface StickyNote {
  id: string;
  content: string;
  color: 'pink' | 'green' | 'blue' | 'yellow';
  position: { x: number; y: number };
  rotation: number;
}
