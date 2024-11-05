import React, { useRef, useEffect } from 'react';
import { useRecording } from '../../context/RecordingContext';
import VideoProgress from './VideoProgress';
import '../../styles/globals.css';

const VideoPlayer = () => {
  const { currentDialogue, isRecording } = useRecording();
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load(); // Reload the video element to update the source
      if (isRecording) {
        videoRef.current.load();
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentDialogue, isRecording]); // Re-run effect when currentDialogue or isRecording changes

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      // Add time update logic if needed
    }
  };

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play();
    }
  };

  const handleStop = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // Reset to start
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset audio to start
    }
  };

  const handlePlayWithRecordedAudio = () => {
    if (videoRef.current && audioRef.current) {
      videoRef.current.muted = true; // Mute the original video audio
      videoRef.current.play();
      audioRef.current.play(); // Play the recorded audio
    }
  };
  console.log(currentDialogue?.videoURL );
  console.log(videoRef?.current);


  
  // require('./Kuma/Kuma Clip 01_x264.mp4');
  

  return (
    <div className="relative w-full">
      <video
        ref={videoRef}
        className="w-full rounded-t-lg"
        onTimeUpdate={handleTimeUpdate}
        style={{ width: '100%', height: '40%' }}
        // controls
      >
        <source 
          src={currentDialogue.videoURL ? currentDialogue.videoURL : '../data/kuma/Kuma Clip 01.mp4'}
          // src={ './Kuma/Kuma Clip 01_x264.mp4'}
          type="video/mp4" 
        />
        Your browser does not support the video tag.
      </video>
      <audio ref={audioRef} src={currentDialogue.audioURL} />
      <VideoProgress videoRef={videoRef} />
      <div className="controls">
        <button onClick={handlePlay}>Play</button>
        <button onClick={handleStop}>Stop</button>
        <button onClick={handlePlayWithRecordedAudio}>Play with Recorded Audio</button>
      </div>
    </div>
  );
};

export default VideoPlayer;