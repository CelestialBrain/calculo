import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      // Removed 'prose-invert' (dark mode text)
      // Added 'prose-slate' for nice gray text
      // Added 'prose-headings:text-slate-900' for dark headings
      className={`prose prose-slate max-w-none leading-relaxed ${className || ''}`}
      components={{
        p: ({node, ...props}) => <p className="mb-4 text-slate-700" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3" {...props} />,
        strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
        ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 mb-4 ml-2 text-slate-700" {...props} />,
        li: ({node, ...props}) => <li className="marker:text-slate-400" {...props} />,
        code: ({node, className, children, ...props}) => {
            const match = /language-(\w+)/.exec(className || '')
            return match ? (
                <div className="relative rounded-lg overflow-hidden my-4 border border-slate-200 bg-slate-50 shadow-sm">
                    <div className="px-4 py-2 bg-slate-100/50 text-xs text-slate-500 font-mono border-b border-slate-200 flex justify-between">
                        <span>{match[1]}</span>
                    </div>
                    <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-800">
                         <code className={className} {...props}>
                            {children}
                        </code>
                    </pre>
                </div>
            ) : (
                <code className="bg-slate-100 text-slate-800 border border-slate-200 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                </code>
            )
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;