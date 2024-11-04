// src/context/RecordingContext.jsx
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import '../styles/globals.css';



// Default dialogues moved directly into the context file
// const defaultDialogues = [
//   {
//     id: 1,
//     time_start: "00:01:38:20",
//     time_end: "00:01:41:05",
//     character: "Narrator",
//     status: "pending",
//     audioURL: null,
//     videoURL: '../data/kuma/Kuma Clip 01_x264.mp4',
//     // videoURL: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',

//     isCompleted: false,
//     dialogue: {
//       original: "Bir varmış bir yokmuş...",
//       translated: "Once upon a time,",
//       adapted: "Once upon a time,"
//     },
//     primary: { emotion: "Nostalgia", intensity: 3 },
//     secondary: { emotion: "Curiosity", intensity: 2 },
//     context: "Beginning of the fairy tale narration",
//     direction: "Spoken softly, with a hint of enchantment",
//     lip_movements: 4,
//     scene_context: "Beginning of the fairy tale narration",
//     technical_notes: "Maintain soft tone throughout",
//     cultural_notes: "Traditional fairy tale opening in Turkish culture"
//   },
//   {
//     id: 2,
//     time_start: "00:01:41:06",
//     time_end: "00:01:45:15",
//     character: "Narrator",
//     status: "pending",
//     audioURL: null,
//     videoURL: '../data/kuma/Kuma Clip 02_x264.mp4',
//     // videoURL: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
//     isCompleted: false,
//     dialogue: {
//       original: "Evvel zaman içinde, kalbur saman içinde...",
//       translated: "In the past times, when the sieve was in the straw...",
//       adapted: "Long, long ago, in a time far away..."
//     },
//     primary: { emotion: "Mystery", intensity: 4 },
//     secondary: { emotion: "Wonder", intensity: 3 },
//     context: "Setting the timeless atmosphere",
//     direction: "Gradually building mystical tone",
//     lip_movements: 6,
//     scene_context: "Continuation of opening sequence",
//     technical_notes: "Slight pause after each phrase",
//     cultural_notes: "Traditional rhythm of storytelling"
//   },
//   {
//     id: 3,
//     time_start: "00:01:45:16",
//     time_end: "00:01:50:00",
//     character: "Old Woman",
//     status: "pending",
//     audioURL: null,
//     videoURL: '../data/kuma/Kuma Clip 03_x264.mp4',
//     isCompleted: false,
//     dialogue: {
//       original: "Develer tellal iken, pireler berber iken...",
//       translated: "When camels were town criers, and fleas were barbers...",
//       adapted: "In a magical time, when anything was possible..."
//     },
//     primary: { emotion: "Whimsy", intensity: 5 },
//     secondary: { emotion: "Amusement", intensity: 3 },
//     context: "Introducing the fantastical elements",
//     direction: "Playful tone with slight chuckle",
//     lip_movements: 5,
//     scene_context: "Close-up of storyteller",
//     technical_notes: "Emphasize the playful rhythm",
//     cultural_notes: "Humorous traditional phrase setting up fairy tale world"
//   }
// ];

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
    console.log('Stopping recording:', isRecording);
    console.log('MediaRecorder state:', mediaRecorder.current?.state);
    
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      clearInterval(recordingTimer.current);
      mediaRecorder.current.stop();
      console.log('Recording stopped.');
    } else {
      console.log('No active recording to stop.');
    }
  }, [mediaRecorder.current]);

  
  const startRecording = useCallback(async (maxDuration) => {
    console.log('startRecording');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      // Pause the video when recording starts
      if (videoRef.current) {
        videoRef.current.pause();
      }

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
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
        setRecordingDuration(duration);
      }, 1000);

      // Stop recording after the specified maxDuration
      setTimeout(() => {
        if (mediaRecorder.current && isRecording) {
          stopRecording();
        }
      }, maxDuration * 1000);

      mediaRecorder.current.start();
      setIsRecording(true);
      setAudioStream(stream);
      setError(null);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Failed to access microphone. Please ensure microphone permissions are granted.');
    }
  }, [currentIndex, stopRecording]);

  

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