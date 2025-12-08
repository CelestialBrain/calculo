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
      className={`prose prose-slate max-w-none ${className || ''}`}
      components={{
        // High line height for readability
        p: ({node, ...props}) => <p className="mb-8 text-lg leading-[1.9] text-slate-700" {...props} />,
        
        // Distinct headers
        h3: ({node, ...props}) => <h3 className="text-xl font-bold text-slate-900 mt-10 mb-5 tracking-tight border-b border-slate-100 pb-2" {...props} />,
        h4: ({node, ...props}) => <h4 className="text-lg font-semibold text-slate-800 mt-6 mb-3" {...props} />,
        
        // Clean lists
        ul: ({node, ...props}) => <ul className="list-disc list-outside space-y-3 mb-8 ml-6 text-lg text-slate-700 leading-relaxed" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal list-outside space-y-4 mb-8 ml-6 text-lg text-slate-700 leading-relaxed" {...props} />,
        li: ({node, ...props}) => <li className="pl-2 marker:text-slate-400" {...props} />,
        
        // Code blocks
        code: ({node, className, children, ...props}) => {
            const match = /language-(\w+)/.exec(className || '')
            return match ? (
                <div className="relative rounded-lg overflow-hidden my-6 border border-slate-200 bg-slate-50 shadow-sm">
                    <div className="px-4 py-2 bg-slate-100/50 text-xs text-slate-500 font-mono border-b border-slate-200 flex justify-between">
                        <span>{match[1]}</span>
                    </div>
                    <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-800 leading-normal">
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