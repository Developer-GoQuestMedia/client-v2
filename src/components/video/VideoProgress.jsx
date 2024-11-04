import React from 'react';
import { useRecording } from '../../context/RecordingContext';

const VideoProgress = ({ videoRef }) => {
  const { currentDialogue } = useRecording();
  
  const formatTime = (timeString) => {
    const [hours, minutes, seconds, frames] = timeString.split(':');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
      <div className="flex items-center gap-2 text-white">
        <span>{formatTime(currentDialogue.time_start)}</span>
        <div className="flex-1 h-1 bg-white/30 rounded-full">
          <div className="h-full bg-white rounded-full w-1/3" />
        </div>
        <span>{formatTime(currentDialogue.time_end)}</span>
      </div>
    </div>
  );
};

export default VideoProgress;