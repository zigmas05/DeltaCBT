import React, { useMemo } from 'react';
import katex from 'katex';

interface KaTeXRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

export const KaTeXRenderer: React.FC<KaTeXRendererProps> = ({ content, className = '', inline = false }) => {
  const htmlContent = useMemo(() => {
    if (!content) return '';

    // Parse text and math segments safely
    const tokens: string[] = [];
    let currentIndex = 0;
    
    // Match $$...$$ or $...$
    const regex = /(\$\$.*?\$\$|\$.*?\$)/gs;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before the math, with newlines replaced
      if (match.index > currentIndex) {
        tokens.push(content.substring(currentIndex, match.index).replace(/\n/g, '<br/>'));
      }
      
      const formulaWithTags = match[0];
      const isBlock = formulaWithTags.startsWith('$$');
      const formula = isBlock ? formulaWithTags.slice(2, -2) : formulaWithTags.slice(1, -1);
      
      try {
        tokens.push(katex.renderToString(formula.trim(), {
          displayMode: isBlock,
          throwOnError: false,
        }));
      } catch (err) {
        tokens.push(`<span class="text-red-500">[Error LaTeX: ${formula}]</span>`);
      }
      
      currentIndex = regex.lastIndex;
    }

    // Add remaining text
    if (currentIndex < content.length) {
      tokens.push(content.substring(currentIndex).replace(/\n/g, '<br/>'));
    }

    return tokens.join('');
  }, [content]);

  return (
    <div
      className={`katex-latex-render ${className} ${inline ? 'inline' : 'block'}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
