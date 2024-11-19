export const calculateMaxDuration = (currentDialogue) => {
  if (currentDialogue?.timeStart && currentDialogue?.timeEnd) {
    const [startH, startM, startS] = currentDialogue.timeStart.split(':').map(Number);
    const [endH, endM, endS] = currentDialogue.timeEnd.split(':').map(Number);

    const startSeconds = startH * 3600 + startM * 60 + startS;
    const endSeconds = endH * 3600 + endM * 60 + endS;

    return endSeconds - startSeconds;
  }
  return 6; // Default duration if times aren't available
};
