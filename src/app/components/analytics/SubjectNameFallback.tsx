import React from 'react';

interface SubjectNameFallbackProps {
  subjectId: string;
}

export const SubjectNameFallback: React.FC<SubjectNameFallbackProps> = ({ subjectId }) => {
  // Take first 8 characters of the ID for brevity
  const shortId = subjectId.substring(0, 8);
  
  return (
    <div className="inline-flex items-center group">
      <span>Subject {shortId}</span>
      <span className="text-xs text-gray-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {subjectId}
      </span>
    </div>
  );
}; 