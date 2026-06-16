import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import remarkBreaks from 'remark-breaks';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

interface Props {
  content: string;
}

const processHighlight = (text: string) => {
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`|\$\$[\s\S]*?\$\$|\$[^$]+\$)/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) return part; // Inside code block or math
    return part.replace(/==([^=]+)==/g, '<mark>$1</mark>');
  }).join('');
};

const customSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'mark', 'details', 'summary', 'iframe'],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] || []), 'style', 'className', 'align'],
    span: ['style'],
    p: ['align'],
    img: ['src', 'alt', 'width', 'height', 'align'],
    iframe: ['src', 'width', 'height', 'allowfullscreen', 'allow', 'frameborder']
  }
};

export function MarkdownPreview({ content }: Props) {
  return (
    <ReactMarkdown 
      remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]} 
      rehypePlugins={[rehypeRaw, [rehypeSanitize, customSchema], rehypeKatex, rehypeSlug, rehypeHighlight]}
    >
      {processHighlight(content || '*Chưa có nội dung...*')}
    </ReactMarkdown>
  );
}
