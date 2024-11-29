import React from 'react';
import { useRecording } from '../../context/RecordingContext';

const VideoProgress = ({ videoRef }) => {
  const { currentDialogue } = useRecording();

  // console.log(currentDialogue);
  
  const formatTime = (timeString) => {
    const [hours, minutes, seconds, frames] = timeString.split(':');
    return `${hours}:${minutes}:${seconds}`;
  };
  console.log(formatTime(currentDialogue.timeStart));
  console.log(currentDialogue.timeStart);
  

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-orange-600 p-2">
      <div className="flex items-center gap-2 text-white">
        <span>{formatTime(currentDialogue.timeStart)}</span>
        <div className="flex-1 h-1 bg-white/30 rounded-full">
          <div className="h-full bg-white rounded-full w-1/3" />
        </div>
        <span>{formatTime(currentDialogue.timeEnd)}</span>
      </div>
    </div>
  );
};

export default VideoProgress;