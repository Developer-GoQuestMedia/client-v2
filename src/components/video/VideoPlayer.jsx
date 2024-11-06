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
      const baseUrl = process.env.PUBLIC_URL || '/client-v2';
      const videoPath = currentDialogue?.videoURL 
        ? `${baseUrl}${encodeURI(currentDialogue.videoURL)}`
        : `${baseUrl}/Kuma/Kuma%20Clip%2001.mp4`;
      
      console.log('File location check:');
      console.log('- Base URL:', baseUrl);
      console.log('- Video path:', videoPath);
      console.log('- Full URL:', window.location.origin + videoPath);
      
      fetch(videoPath)
        .then(async response => {
          console.log('Content-Type:', response.headers.get('content-type'));
          const blob = await response.blob();
          console.log('File size:', blob.size);
          console.log('File type:', blob.type);
        })
        .catch(error => {
          console.error('Fetch error:', error);
        });

      videoRef.current.load();
    }
  }, [currentDialogue, isRecording]);

  // const handleTimeUpdate = () => {
  //   if (videoRef.current) {
  //     const time = videoRef.current.currentTime;
  //     // Add time update logic if needed
  //   }
  // };

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play();
    }
  };

  console.log(videoRef.current === undefined);
  

  const handleStop = () => {
    if(videoRef.current === undefined) {
      return console.log("video is null");
    }
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
  console.log(typeof(currentDialogue?.videoURL));

  
  // require('./Kuma/Kuma Clip 01_x264.mp4');
  

  return (
    <div className="relative w-full">
      <video
        ref={videoRef}
        className="w-full rounded-t-lg"
        style={{ width: '100%', height: '40%' }}
        onError={(e) => {
          console.log('Video error event:', e);
          const video = videoRef.current;
          if (video) {
            console.log('Network state:', video.networkState);
            console.log('Ready state:', video.readyState);
            console.log('Error code:', video.error?.code);
            console.log('Error message:', video.error?.message);
          }
        }}
      >
        <source 
          src={`${process.env.PUBLIC_URL || '/client-v2'}${
            currentDialogue?.videoURL || '/Kuma/Kuma%20Clip%2001.mp4'
          }`}
          type="video/mp4" 
          onError={(e) => {
            console.log('Source error event:', e);
            console.log('Attempted source path:', e.target.src);
          }}
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