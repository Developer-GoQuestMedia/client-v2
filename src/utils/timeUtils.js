export const calculateMaxDuration = (currentDialogue) => {

  if (currentDialogue?.timeStart && currentDialogue?.timeEnd) {
    const [startH, startM, startS, startMs] = currentDialogue.timeStart.split(':').map(Number);
    const [endH, endM, endS, endMs] = currentDialogue.timeEnd.split(':').map(Number);

    const startSeconds = startH * 3600 + startM * 60 + startS + startMs / 1000;
    const endSeconds = endH * 3600 + endM * 60 + endS + endMs / 1000;
    

    return Number(Math.abs(endSeconds - startSeconds).toFixed(3));
  }
  return 6; // Default duration if times aren't available
};
