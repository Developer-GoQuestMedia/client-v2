import React, { createContext, useContext, useRef, useState, useCallback } from "react";

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const videoRef = useRef(null);
  const [noVideo, setNoVideo] = useState(false);

  const syncVideoTime = useCallback((timeString) => {
    if (videoRef.current) {
      const [hours, minutes, seconds, frames] = timeString.split(":").map(Number);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds + frames / 30;
      videoRef.current.currentTime = totalSeconds;
    }
  }, []);

  const videoNotRequired = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setNoVideo(true);
  }, []);

  return (
    <VideoContext.Provider value={{ videoRef, noVideo, syncVideoTime, videoNotRequired }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error("useVideo must be used within a VideoProvider");
  }
  return context;
};
