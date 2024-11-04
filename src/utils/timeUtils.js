export const calculateMaxDuration = (currentDialogue) => {
  if (currentDialogue?.time_start && currentDialogue?.time_end) {
    const [startH, startM, startS] = currentDialogue.time_start.split(':').map(Number);
    const [endH, endM, endS] = currentDialogue.time_end.split(':').map(Number);

    const startSeconds = startH * 3600 + startM * 60 + startS;
    const endSeconds = endH * 3600 + endM * 60 + endS;

    return endSeconds - startSeconds;
  }
  return 5; // Default duration if times aren't available
};
