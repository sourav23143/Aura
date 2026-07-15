import React from 'react';

export default function FormattedText({ text, className = '' }) {
  if (!text) return null;

  // Split by newlines
  const lines = text.split('\n');

  return (
    <div className={className}>
      {lines.map((line, i) => {
        // Handle bold parsing for each line: split by **
        const parts = line.split(/(\*\*.*?\*\*)/g);
        
        const formattedLine = parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
          }
          return <span key={j}>{part}</span>;
        });

        // Add a bit of space below each line unless it's the last one
        return (
          <p key={i} style={{ minHeight: '1rem', marginBottom: '0.5rem', lineHeight: '1.6', color: 'inherit' }}>
            {formattedLine}
          </p>
        );
      })}
    </div>
  );
}
