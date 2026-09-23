import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { BlogContentBlock } from '../../types/blog';

interface ArticleContentProps {
  blocks: BlogContentBlock[];
}

/**
 * Renders the article body from structured content blocks, keeping proper
 * heading hierarchy (h2) and semantic markup for SEO and accessibility.
 */
export const ArticleContent: React.FC<ArticleContentProps> = ({ blocks }) => {
  if (!blocks || !Array.isArray(blocks)) {
    if (typeof blocks === 'string') {
      return (
        <div className="space-y-4">
          <p className="text-sm sm:text-base text-gangchill-ink/85 leading-relaxed sm:leading-[1.9] font-light">
            {blocks}
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-5">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading':
            return (
              <h2
                key={idx}
                className="text-xl sm:text-2xl font-bold font-serifBangla text-gangchill-ink pt-4"
              >
                {block.text}
              </h2>
            );
          case 'paragraph':
            return (
              <p key={idx} className="text-sm sm:text-base text-gangchill-ink/85 leading-relaxed sm:leading-[1.9] font-light">
                {block.text}
              </p>
            );
          case 'list':
            return (
              <ul key={idx} className="space-y-2 pl-1 list-none">
                {block.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm sm:text-base text-gangchill-ink/85 leading-relaxed font-light">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gangchill-cyan shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          case 'quote':
            return (
              <blockquote
                key={idx}
                className="border-l-4 border-gangchill-cyan pl-4 sm:pl-5 py-1 italic text-gangchill-ink/80 text-sm sm:text-lg font-serifBangla leading-relaxed"
              >
                {block.text}
              </blockquote>
            );
          case 'link':
            return (
              <Link
                key={idx}
                to={block.href}
                className="group flex items-start justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gangchill-blue/5 border border-gangchill-blue/15 hover:border-gangchill-blue/30 hover:bg-gangchill-blue/10 transition-all duration-200 not-italic no-underline"
              >
                <div>
                  <div className="text-sm sm:text-base font-bold text-gangchill-blue">{block.label}</div>
                  <div className="text-xs sm:text-sm text-gangchill-ink-muted mt-1 font-light">{block.description}</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gangchill-blue shrink-0 mt-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};
