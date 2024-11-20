import React, { useRef, useEffect, useState } from "react";
import { useRecording } from "../../context/RecordingContext1";
import VideoProgress from "./VideoProgress";
import "../../styles/globals.css";
import axios from "axios";

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

  const videoPath = currentDialogue.videoUrl;

  const fetchVideo = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`https://server-v2-akga.onrender.com/api/videos/stream/${videoPath}`, {
        responseType: 'blob'  // Important for video streaming
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching video:', error.message);
      throw new Error('Failed to fetch video');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const videoData = await fetchVideo();
        if (videoRef.current) {
          videoRef.current.src = URL.createObjectURL(videoData);
        }
      } catch (error) {
        console.error('Error loading video:', error);
      }
    };

    if (videoPath) {
      loadVideo();
    }
  }, [videoPath]);

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
      console.log("Video ref not available");
      return;
    }

    try {
      console.log("Playing video");
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
      console.log("Video ref not available");
      return;
    }

    try {
      console.log("Stopping playback");
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
      console.log("Video ref not available");
      return;
    }

    if (!audioRef?.current) {
      console.log("Audio ref not available");
      return;
    }

    console.log("Playing with recorded audio");
    console.log("Audio state:", {
      duration: audioRef.current.duration,
      src: audioRef.current.src,
      readyState: audioRef.current.readyState,
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
      console.log("Video ref not available for metadata");
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
            currentDialogue?.videoUrl || "/Kuma/Kuma%20Clip%2001.mp4"
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
