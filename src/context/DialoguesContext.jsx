import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

const DialoguesContext = createContext();

export const DialoguesProvider = ({ children }) => {
  const [dialogues, setDialogues] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentDialogue = useMemo(
    () => dialogues[currentIndex] || null,
    [dialogues, currentIndex]
  );

  const updateDialogue = useCallback((index, updates) => {
    setDialogues((prev) =>
      prev.map((dialogue, i) => (i === index ? { ...dialogue, ...updates } : dialogue))
    );
  }, []);

  const moveToNext = useCallback(() => {
    if (currentIndex < dialogues.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, dialogues.length]);

  const moveToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const jumpToScene = useCallback(
    (index) => {
      if (index >= 0 && index < dialogues.length) {
        setCurrentIndex(index);
      }
    },
    [dialogues.length]
  );

  return (
    <DialoguesContext.Provider
      value={{
        dialogues,
        currentIndex,
        currentDialogue,
        setDialogues,
        setCurrentIndex,
        updateDialogue,
        moveToNext,
        moveToPrevious,
        jumpToScene,
      }}
    >
      {children}
    </DialoguesContext.Provider>
  );
};

export const useDialogues = () => {
  const context = useContext(DialoguesContext);
  if (!context) {
    throw new Error("useDialogues must be used within a DialoguesProvider");
  }
  return context;
};
