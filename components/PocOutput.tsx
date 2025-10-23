import React, { Suspense, lazy } from 'react';

// Lazy load SyntaxHighlighter for better initial load performance
const SyntaxHighlighter = lazy(() => import('react-syntax-highlighter'));
// Use a light theme for the syntax highlighter to match the new UI
import vs from 'react-syntax-highlighter/dist/esm/styles/hljs/vs';

interface PocOutputProps {
  code: string;
}

export const PocOutput: React.FC<PocOutputProps> = ({ code }) => {
  return (
    <Suspense fallback={<div className="p-4">Loading code viewer...</div>}>
      <SyntaxHighlighter
        language="yaml"
        style={vs}
        customStyle={{
          width: '100%',
          height: '100%',
          margin: 0,
          padding: '1.5rem',
          backgroundColor: '#ffffff', // bg-surface
          fontSize: '0.875rem'
        }}
        showLineNumbers
      >
        {code}
      </SyntaxHighlighter>
    </Suspense>
  );
};