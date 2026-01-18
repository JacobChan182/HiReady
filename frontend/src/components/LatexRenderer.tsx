import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface LatexRendererProps {
  text: string;
}

export const LatexRenderer = ({ text }: LatexRendererProps) => {
  // Regex to find \( ... \) for inline and \[ ... \] for block math
  const parts = text.split(/(\\\(.*?\\\)|\\\[.*?\\\])/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          const math = part.substring(2, part.length - 2);
          return <InlineMath key={index} math={math} />;
        }
        if (part.startsWith('\\[') && part.endsWith('\\]')) {
          const math = part.substring(2, part.length - 2);
          return <BlockMath key={index} math={math} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};