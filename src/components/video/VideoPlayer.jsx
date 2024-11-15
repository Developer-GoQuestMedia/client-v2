import React, { useRef, useEffect, useState } from "react";
import { useRecording } from "../../context/RecordingContext";
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

  // video API as per current Dialogue
  // console.log(currentDialogue)
  // console.log(currentDialogue.videoUrl)
  // const videoApi = `https://server-v2-akga.onrender.com/api/videos/${currentDialogue.videoUrl}`;

// const projectId = '672b48ef936eaa6e6710fa6e';
// const fetchDialogues = async () => {
//     try {
//         const response = await axios.get(`https://server-v2-akga.onrender.com/api/dialogues/list/${projectId}`);
//         return response.data; // Assuming the response data is in the expected format
//     } catch (error) {
//         console.error('Error fetching dialogues:', error);
//         return []; // Return an empty array or handle the error as needed
//     }
// };
// Replace defaultDialogues with the fetched data
// const defaultDialogues = await fetchDialogues();
// console.log(videoApi.toString())
const videoPath = currentDialogue.videoUrl;
const fetchVideo = async() =>{
  try{
      const response = await axios.get(`https://server-v2-akga.onrender.com/api/videos/${videoPath}`);    
      return response.data
  }catch(e){
    
  }
}

const xyz = fetchVideo()
console.log(xyz);
console.log(fetchVideo());

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

    // console.log('Video metadata loaded:', {
    //   duration: e.target.duration,
    //   videoWidth: e.target.videoWidth,
    //   videoHeight: e.target.videoHeight
    // });
    setIsVideoReady(true);
  }; 


  return (
    <div className="relative w-full text-yellow-500 mt-2">
      <video
        ref={videoRef}
        className="w-full rounded-t-lg"
        style={{ width: "100%", height: "40%" }}
        preload="auto"
        playsInline
        onLoadedMetadata={handleMetadataLoaded}
        // onLoadStart={() => console.log('Video load started')}
        // onCanPlay={() => console.log('Video can play')}
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
            console.log("Audio state:", {
              error: e.target.error,
              src: e.target.src,
            });
          }}
          onLoadedMetadata={() => {
            console.log("Audio metadata loaded:", {
              duration: audioRef.current?.duration,
              src: audioRef.current?.src,
            });
          }}
        />
      )}

      <VideoProgress videoRef={videoRef} isReady={isVideoReady} />
      <div className="controls flex  gap-3 py-2.5 h-24 w-full border-2 justify-center content-center text-black">
        <button className="bg-slate-600 text-white px-5 mb-8 hover:bg-fuchsia-600" onClick={handlePlay} disabled={!isVideoReady}>
          Play
        </button>
        <button
          className="bg-slate-600 text-white px-5 mb-8 hover:bg-fuchsia-600 "
          onClick={handleStop}
          disabled={!isVideoReady}
        >
          Stop
        </button>
        <button
          className={`bg-slate-600 text-white px-5 mb-8 text-sm sm:text-base sm:px-6 hover:bg-fuchsia-600 ${!isVideoReady || !currentDialogue?.audioURL ? 'opacity-50 cursor-not-allowed' : ''}`}
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
