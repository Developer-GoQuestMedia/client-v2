import React, { useRef, useEffect, useState } from 'react';
import { useRecording } from '../../context/RecordingContext';
import VideoProgress from './VideoProgress';
import '../../styles/globals.css';

const VideoPlayer = () => {
  const { currentDialogue, isRecording, audioRef: contextAudioRef } = useRecording();
  const videoRef = useRef(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const localAudioRef = useRef(null); // Local backup audio ref

  // Use either context audio ref or local ref
  const audioRef = contextAudioRef || localAudioRef;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      
      if (isRecording) {
        videoRef.current.currentTime = 0;
        setIsVideoReady(true);
      } else {
        videoRef.current.pause();
        setIsVideoReady(false);
      }
    }
  }, [currentDialogue, isRecording]);

  const handlePlay = () => {
    if (!videoRef.current) {
      console.log('Video ref not available');
      return;
    }

    try {
      console.log('Playing video');
      videoRef.current.muted = false;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error playing video:', error);
        });
      }
    } catch (error) {
      console.error('Error in handlePlay:', error);
    }
  };

  const handleStop = () => {
    if (!videoRef.current) {
      console.log('Video ref not available');
      return;
    }

    try {
      console.log('Stopping playback');
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      
      if (audioRef?.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch (error) {
      console.error('Error in handleStop:', error);
    }
  };

  const handlePlayWithRecordedAudio = () => {
    if (!videoRef.current) {
      console.log('Video ref not available');
      return;
    }

    if (!audioRef?.current) {
      console.log('Audio ref not available');
      return;
    }

    console.log('Playing with recorded audio');
    console.log('Audio state:', {
      duration: audioRef.current.duration,
      src: audioRef.current.src,
      readyState: audioRef.current.readyState
    });

    try {
      videoRef.current.muted = true;
      videoRef.current.currentTime = 0;
      audioRef.current.currentTime = 0;
      
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (audioRef.current) {
              return audioRef.current.play();
            }
          })
          .catch(error => {
            console.error('Error playing media:', error);
          });
      }
    } catch (error) {
      console.error('Error in handlePlayWithRecordedAudio:', error);
    }
  };

  const handleMetadataLoaded = (e) => {
    if (!videoRef.current) {
      console.log('Video ref not available for metadata');
      return;
    }

    // console.log('Video metadata loaded:', {
    //   duration: e.target.duration,
    //   videoWidth: e.target.videoWidth,
    //   videoHeight: e.target.videoHeight
    // });
    setIsVideoReady(true);
  };

  return (
    <div className="relative w-full">
      <video
        ref={videoRef}
        className="w-full rounded-t-lg"
        style={{ width: '100%', height: '40%' }}
        preload="auto"
        playsInline
        onLoadedMetadata={handleMetadataLoaded}
        // onLoadStart={() => console.log('Video load started')}
        // onCanPlay={() => console.log('Video can play')}
        onError={(e) => {
          console.error('Video error:', e);
          setIsVideoReady(false);
        }}
      >
        <source 
          src={`${process.env.PUBLIC_URL || '/client-v2'}${
            currentDialogue?.videoURL || '/Kuma/Kuma%20Clip%2001.mp4'
          }`}
          type="video/mp4" 
        />
        Your browser does not support the video tag.
      </video>
      
      {/* Add audio element with error handling */}
      {currentDialogue?.audioURL && (
        <audio 
          ref={audioRef}
          src={currentDialogue.audioURL}
          onError={(e) => {
            console.error('Audio error:', e);
            console.log('Audio state:', {
              error: e.target.error,
              src: e.target.src
            });
          }}
          onLoadedMetadata={() => {
            console.log('Audio metadata loaded:', {
              duration: audioRef.current?.duration,
              src: audioRef.current?.src
            });
          }}
        />
      )}

      <VideoProgress videoRef={videoRef} isReady={isVideoReady} />
      <div className="controls">
        <button 
          onClick={handlePlay}
          disabled={!isVideoReady}
        >
          Play
        </button>
        <button 
          onClick={handleStop}
          disabled={!isVideoReady}
        >
          Stop
        </button>
        <button 
          onClick={handlePlayWithRecordedAudio}
          disabled={!isVideoReady || !currentDialogue?.audioURL}
        >
          Play with Recorded Audio
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;