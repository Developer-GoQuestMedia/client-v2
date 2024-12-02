import React, { useRef, useEffect, useState } from "react";
import { useRecording } from "../../context/RecordingContext";
import VideoProgress from "./VideoProgress";
import "../../styles/globals.css";

const VideoPlayer = () => {
  const {
    currentDialogue,
    isRecording,
    audioRef: contextAudioRef,
  } = useRecording();
  const videoRef = useRef(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const localAudioRef = useRef(null); // Local backup audio ref
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (videoRef.current && currentDialogue?.videoUrl) {
      // Directly set the video source
      videoRef.current.src = currentDialogue.videoUrl;
      videoRef.current.load();
    }
  }, [currentDialogue?.videoUrl]);

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
      return;
    }

    try {
      videoRef.current.muted = false;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Error playing video:", error);
        });
      }
    } catch (error) {
      console.error("Error in handlePlay:", error);
    }
  };

  const handleStop = () => {
    if (!videoRef.current) {
      return;
    }

    try {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;

      if (audioRef?.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch (error) {
      console.error("Error in handleStop:", error);
    }
  };

  const handlePlayWithRecordedAudio = () => {
    if (!videoRef.current) {
      return;
    }

    if (!audioRef?.current) {
      return;
    }

    

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
          .catch((error) => {
            console.error("Error playing media:", error);
          });
      }
    } catch (error) {
      console.error("Error in handlePlayWithRecordedAudio:", error);
    }
  };

  const handleMetadataLoaded = (e) => {
    if (!videoRef.current) {
      return;
    }
    setIsVideoReady(true);
  };


  return (
    <div className="relative w-full text-yellow-500 ">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="w-full rounded-t-lg"
        style={{ width: "100%", height: "60%" }} // Set height for the video
        preload="auto"
        playsInline
        onLoadedMetadata={handleMetadataLoaded}
        onError={(e) => {
          console.error("Video error:", e);
          setIsVideoReady(false);
        }}
      >
        <source
          src={`${process.env.PUBLIC_URL || "/client-v2/"}${
            currentDialogue?.videoUrl || "https://pub-ca2dd6ef0390446c8dda16e228d97cf6.r2.dev/Kuma%20Ep%2001/videos/Kuma%20Ep%2001_Clip_01.mp4"
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
            console.error("Audio error:", e);
          }}
        />
      )}

      <VideoProgress videoRef={videoRef} isReady={isVideoReady}/>

      {/* Controls positioned at the bottom of the video */}
      <div className="controls flex gap-3 h-20 w-full justify-center content-center text-black absolute bottom-0 left-0 right-0 z-10  border-t-0"   >
        <button
          className="bg-slate-60 text-white px-5 mb-8 text-sm sm:text-base sm:px-6 hover:bg-fuchsia-600"
          onClick={handlePlay}
          disabled={!isVideoReady}
        >
          Play
        </button>
        <button
          className="bg-slate-60 text-white px-5 mb-8 text-sm sm:text-base sm:px-6 hover:bg-fuchsia-600"
          onClick={handleStop}
          disabled={!isVideoReady}
        >
          Stop
        </button>
        <button
          className={`bg-slate-60 text-white px-5 mb-8 text-sm sm:text-base sm:px-6 hover:bg-fuchsia-600 ${!isVideoReady || !currentDialogue?.audioURL ? 'opacity-50 cursor-not-allowed' : ''}`}
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
