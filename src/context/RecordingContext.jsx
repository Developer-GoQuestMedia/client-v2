import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { createWavBlob } from "../utils/audioWorker";

const RecordingContext = createContext();

export const RecordingProvider = ({ children }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const mediaRecorder = useRef(null);

  
  const stopRecording = useCallback(() => {
    // Logic to stop recording
  }, []);
  
  const startRecording = useCallback(() => {
    // Logic to start recording
  }, []);
  
  const cleanup = useCallback(() => {
    if (mediaRecorder.current) {
      const { stream } = mediaRecorder.current;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
    setIsRecording(false);
    setAudioStream(null);
    mediaRecorder.current = null;
  }, []);

  return (
    <RecordingContext.Provider
      value={{
        isRecording,
        audioStream,
        startRecording,
        stopRecording,
        cleanup,
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
};

export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error("useRecording must be used within a RecordingProvider");
  }
  return context;
};
