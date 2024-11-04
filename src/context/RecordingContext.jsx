// src/context/RecordingContext.jsx
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import '../styles/globals.css';

// Add this at the top of your file, before the component
const initializeMediaDevices = () => {
  // Legacy browser support
  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {};
  }

  // Some browsers partially implement mediaDevices. We can't just assign an object
  // with getUserMedia as it would overwrite existing properties.
  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      // First get ahold of the legacy getUserMedia, if present
      const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      // Some browsers just don't implement it - return a rejected promise with an error
      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
      }

      // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }
};

const defaultDialogues = require('../data/Sample.json');

const RecordingContext = createContext(null);

export const RecordingProvider = ({ children }) => {
  // State management
  const [dialogues, setDialogues] = useState(defaultDialogues);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const [noVideo, setNoVideo] = useState(true);
  const [error, setError] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioElement, setAudioElement] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const recordingTimer = useRef(null);
  const videoRef = useRef(null);

  // Audio recording functions

  const stopRecording = useCallback(() => {
    console.log('Stop recording called');
    console.log('Recording state:', isRecording);
    console.log('MediaRecorder:', mediaRecorder.current);
    
    if (!mediaRecorder.current) {
      console.log('No MediaRecorder instance found');
      return;
    }

    try {
      if (mediaRecorder.current.state === 'recording') {
        console.log('Stopping active recording');
        mediaRecorder.current.stop();
        
        // Clean up the audio stream
        if (audioStream) {
          audioStream.getTracks().forEach(track => track.stop());
        }
        
        if (recordingTimer.current) {
          clearInterval(recordingTimer.current);
          recordingTimer.current = null;
        }
        
        setIsRecording(false);
        setAudioStream(null);
        setRecordingDuration(0);
      } else {
        console.log('MediaRecorder is not recording. Current state:', mediaRecorder.current.state);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      // Reset state even if there's an error
      setIsRecording(false);
      setAudioStream(null);
      setRecordingDuration(0);
    }
  }, [audioStream]);

  const checkMediaSupport = useCallback(async () => {
    console.log('Checking media support...');
    
    try {
      // Initialize media devices
      initializeMediaDevices();
      
      // Only check for secure context in production
      if (!window.isSecureContext && process.env.NODE_ENV === 'production') {
        const msg = "Audio recording requires a secure (HTTPS) connection. Please contact the administrator.";
        console.error('Not in a secure context - HTTPS required');
        setError(msg);
        return false;
      }

      // Now check if mediaDevices is available
      if (!navigator.mediaDevices) {
        console.error('navigator.mediaDevices is still not available after initialization');
        setError("Your browser doesn't support audio recording. Please use a modern browser.");
        return false;
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia is not available');
        setError("Your browser doesn't support audio recording. Please use a modern browser.");
        return false;
      }

      console.log('Requesting audio permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      console.log('Audio permissions granted');
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error("Media support check failed:", err);
      if (err.name === 'NotAllowedError') {
        setError("Please allow microphone access in your browser settings.");
      } else if (err.name === 'NotFoundError') {
        setError("No microphone found. Please connect a microphone.");
      } else {
        setError(`Microphone access failed: ${err.message}`);
      }
      return false;
    }
  }, []);

  
  const startRecording = useCallback(async (maxDuration) => {
    console.log('Starting recording process...');
    
    // Prevent multiple recordings
    if (isRecording || (mediaRecorder.current && mediaRecorder.current.state === 'recording')) {
      console.log('Recording already in progress');
      return;
    }

    try {
      const isSupported = await checkMediaSupport();
      if (!isSupported) {
        console.log('Media support check failed, cannot proceed');
        return;
      }

      console.log('Media support confirmed, proceeding with recording setup');
      
      // Get the stream again for actual recording
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Check if MediaRecorder is supported
      if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder is not supported in this browser');
      }

      // Create and configure MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      });

      console.log('MediaRecorder created:', recorder.state);

      mediaRecorder.current = recorder;
      audioChunks.current = [];

      // Pause video if playing
      if (videoRef.current) {
        videoRef.current.pause();
      }

      // Setup data handling
      recorder.ondataavailable = (event) => {
        console.log('Data available event:', event.data.size);
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      // Handle recording stop
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setDialogues(prev => prev.map((dialogue, index) => 
          index === currentIndex
            ? { ...dialogue, audioURL: audioUrl, status: 'recorded' }
            : dialogue
        ));

        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setAudioStream(null);
        setRecordingDuration(0);
      };

      // Start recording timer
      let startTime = Date.now();
      recordingTimer.current = setInterval(() => {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        if (duration >= maxDuration) {
          stopRecording();
        } else {
          setRecordingDuration(duration);
        }
      }, 1000);

      recorder.start(100); // Record in 100ms chunks
      console.log('Recording started:', recorder.state);
      
      setIsRecording(true);
      setAudioStream(stream);
      setError(null);

    } catch (error) {
      console.error('Recording setup failed:', error);
      setError(`Recording failed: ${error.message}`);
      setIsRecording(false);
    }
  }, [currentIndex, checkMediaSupport]);

  

  // Navigation functions
  const moveToNext = useCallback(() => {
    if (currentIndex < dialogues.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, dialogues.length]);

  const moveToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const jumpToScene = useCallback((index) => {
    if (index >= 0 && index < dialogues.length) {
      setCurrentIndex(index);
    }
  }, [dialogues.length]);

  // Dialogue management
  const updateDialogue = useCallback((index, updates) => {
    setDialogues(prev => prev.map((dialogue, i) => 
      i === index ? { ...dialogue, ...updates } : dialogue
    ));
  }, []);

  const approveDialogue = useCallback(() => {
    updateDialogue(currentIndex, { 
      status: 'approved',
      isCompleted: true 
    });
    moveToNext();
  }, [currentIndex, updateDialogue, moveToNext]);

  const rejectDialogue = useCallback(() => {
    updateDialogue(currentIndex, { 
      status: 'rejected',
      isCompleted: false,
      audioURL: null 
    });
  }, [currentIndex, updateDialogue]);

  // Video sync functions
  const syncVideoTime = useCallback((timeString) => {
    if (videoRef.current) {
      const [hours, minutes, seconds, frames] = timeString.split(':').map(Number);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds + frames / 30;
      videoRef.current.currentTime = totalSeconds;
    }
  }, []);

  const videoNotRequired = useCallback(() => {
    videoRef.current.pause();

    setNoVideo(true);
  }, []);

  // Context value
  const value = {
    // State
    dialogues,
    currentIndex,
    isRecording,
    audioStream,
    error,
    recordingDuration,
    currentDialogue: dialogues[currentIndex],
    videoRef,
    audioElement,
    isPlaying,
    noVideo,
    // State setters
    setDialogues,
    setCurrentIndex,
    setIsRecording,
    setError,
    setAudioElement,
    setIsPlaying,
    setNoVideo,
    // Recording functions
    startRecording,
    stopRecording,

    // Navigation functions
    moveToNext,
    moveToPrevious,
    jumpToScene,

    // Dialogue management
    updateDialogue,
    approveDialogue,
    rejectDialogue,


    // Video functions
    syncVideoTime,
    videoNotRequired,
  };

  return (
    <RecordingContext.Provider value={value}>
      {children}
    </RecordingContext.Provider>
  );
};

// Custom hook for using the recording context
export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error('useRecording must be used within a RecordingProvider');
  }
  return context;
};