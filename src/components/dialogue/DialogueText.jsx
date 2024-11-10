// src/components/dialogue/DialogueText.jsx
import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Input } from '../ui/input';

const DialogueText = forwardRef(({ dialogue }, ref) => {
  const [original, setOriginal] = useState(dialogue.original);
  const [translated, setTranslated] = useState(dialogue.translated);
  const [adapted, setAdapted] = useState(dialogue.adapted || '');

  // Update local state when dialogue changes
  useEffect(() => {
    setOriginal(dialogue.original);
    setTranslated(dialogue.translated);
    setAdapted(dialogue.adapted || '');
  }, [dialogue]);

  // Expose methods to parent through ref
  useImperativeHandle(ref, () => ({
    getTextValues: () => ({
      original,
      translated,
      adapted
    })
  }));

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Original Text:</label>
        <Input 
          value={original}
          onChange={(e) => setOriginal(e.target.value)}
          className="bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Literal Translation:</label>
        <Input 
          value={translated}
          onChange={(e) => setTranslated(e.target.value)}
          className="bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Adapted Translation:</label>
        <Input 
          value={adapted}
          onChange={(e) => setAdapted(e.target.value)}
          className="bg-gray-50"
        />
      </div>
    </div>
  );
});

// Add display name for debugging
DialogueText.displayName = 'DialogueText';

export default DialogueText;