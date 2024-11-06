// src/context/RecordingContext.jsx
import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import '../styles/globals.css';
import { createWorker } from '../utils/audioWorker';

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
  const [error, setError] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioElement, setAudioElement] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [noVideo, setNoVideo] = useState(false);

  // Refs
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const videoRef = useRef(null);
  const recordingTimer = useRef(null);

  // Add currentDialogue computed value
  const currentDialogue = useMemo(() => 
    dialogues[currentIndex] || null
  , [dialogues, currentIndex]);

  // Helper function to create audio processor
  const createAudioProcessor = async (audioContext) => {
    await audioContext.audioWorklet.addModule(URL.createObjectURL(new Blob([`
      class RecorderProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this.chunks = [];
        }

        process(inputs) {
          const input = inputs[0];
          if (input.length > 0) {
            this.chunks.push(input);
            this.port.postMessage({ chunks: input });
          }
          return true;
        }
      }

      registerProcessor('recorder-processor', RecorderProcessor);
    `], { type: 'application/javascript' })));

    const processor = new AudioWorkletNode(audioContext, 'recorder-processor');
    
    processor.port.onmessage = (e) => {
      if (mediaRecorder.current?.isRecording && e.data.chunks) {
        mediaRecorder.current.chunks.push(e.data.chunks);
      }
    };

    return processor;
  };

  // Helper function for cleanup
  const cleanup = useCallback(() => {
    if (mediaRecorder.current) {
      const { stream, audioContext } = mediaRecorder.current;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    }
    setIsRecording(false);
    setAudioStream(null);
    mediaRecorder.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    console.log('Stop recording called');
    
    if (!mediaRecorder.current || mediaRecorder.current.state === 'inactive') {
      console.log('No active recording found');
      return;
    }

    try {
      console.log('Stopping recording...');
      mediaRecorder.current.stop();
      
      // Stop all tracks
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      
      setIsRecording(false);
      setAudioStream(null);
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      setError('Failed to stop recording');
      cleanup();
    }
  }, [audioStream, setError, setIsRecording, setAudioStream, cleanup]);

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
    let stream;
    
    try {
      const isSupported = await checkMediaSupport();
      if (!isSupported) return;

      console.log('Media support confirmed, proceeding with recording setup');
      
      // Request high-quality audio stream
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      // Create MediaRecorder with supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      console.log('Using MIME type:', mimeType);
      
      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      audioChunks.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Received chunk:', event.data.size, 'bytes');
          audioChunks.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          console.log('Processing recorded audio...');
          const audioBlob = new Blob(audioChunks.current, { type: mimeType });
          console.log('Created blob:', audioBlob.size, 'bytes');

          // Revoke any existing URLs
          if (dialogues[currentIndex]?.audioURL) {
            URL.revokeObjectURL(dialogues[currentIndex].audioURL);
          }

          // Create audio element to validate the blob
          const testAudio = new Audio();
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Get duration using Web Audio API
          const duration = await new Promise((resolve) => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const reader = new FileReader();
            
            reader.onload = async (e) => {
              try {
                const audioBuffer = await audioContext.decodeAudioData(e.target.result);
                console.log('Actual duration:', audioBuffer.duration);

                // Validate audio playback
                testAudio.src = audioUrl;
                await new Promise((loadResolve) => {
                  testAudio.onloadedmetadata = () => {
                    console.log('Test audio loaded, duration:', testAudio.duration);
                    loadResolve();
                  };
                });

                resolve(audioBuffer.duration);
                audioContext.close();
              } catch (error) {
                console.error('Error decoding audio:', error);
                resolve(recordingDuration / 1000);
              }
            };
            
            reader.onerror = () => {
              console.error('Error reading file');
              resolve(recordingDuration / 1000);
            };
            
            reader.readAsArrayBuffer(audioBlob);
          });

          console.log('Final duration:', duration);

          // Create a new blob with proper MIME type
          const finalBlob = new Blob([audioBlob], { 
            type: 'audio/webm;codecs=opus' 
          });
          const finalUrl = URL.createObjectURL(finalBlob);

          // Update dialogues with new audio
          setDialogues(prev => prev.map((dialogue, index) => {
            if (index === currentIndex) {
              return {
                ...dialogue,
                audioURL: finalUrl,
                status: 'recorded',
                duration: duration,
                mimeType: 'audio/webm;codecs=opus'
              };
            }
            return dialogue;
          }));

          // Clean up test audio
          testAudio.src = '';
          URL.revokeObjectURL(audioUrl);

        } catch (error) {
          console.error('Error processing audio:', error);
          setError('Failed to process recording');
        }
      };

      // Store recorder reference
      mediaRecorder.current = recorder;
      
      // Start recording
      recorder.start(100); // Collect data every 100ms
      console.log('Recording started:', recorder.state);
      
      setIsRecording(true);
      setAudioStream(stream);
      setError(null);

    } catch (error) {
      console.error('Recording setup failed:', error);
      setError(`Recording failed: ${error.message}`);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      cleanup();
    }
  }, [currentIndex, cleanup, setError, setIsRecording, setAudioStream, setDialogues]);

  

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
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setNoVideo(true);
  }, []);

  // Add cleanup effect for recording timer
  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
    };
  }, []);

  // Add handleDeleteRecording function
  const handleDeleteRecording = useCallback(() => {
    if (!currentDialogue) return;
    
    if (currentDialogue.audioURL) {
      URL.revokeObjectURL(currentDialogue.audioURL);
    }
    
    updateDialogue(currentIndex, {
      audioURL: null,
      status: 'pending',
      duration: null
    });
  }, [currentIndex, currentDialogue, updateDialogue]);

  // Add handleReRecord function
  const handleReRecord = useCallback(() => {
    if (!currentDialogue) return;
    
    handleDeleteRecording();
    startRecording();
  }, [currentDialogue, handleDeleteRecording, startRecording]);

  // Context value
  const value = {
    // State
    dialogues,
    currentIndex,
    currentDialogue,
    isRecording,
    audioStream,
    error,
    recordingDuration,
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

    // Video functions
    syncVideoTime,
    videoNotRequired,
    
    // Dialogue management
    updateDialogue,
    approveDialogue,
    rejectDialogue,

    // Delete and re-record functions
    handleDeleteRecording,
    handleReRecord,

    // Navigation functions
    moveToNext,
    moveToPrevious,
    jumpToScene,

    // ... rest of your context value
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

// Helper function to create WAV blob
async function createWavBlob(chunks, sampleRate) {
  // Convert chunks to single buffer
  const audioData = chunks.flat();
  const numChannels = audioData[0].length;
  const length = audioData.length * audioData[0].length;
  const buffer = new Float32Array(length);

  let offset = 0;
  for (const chunk of audioData) {
    for (let channel = 0; channel < numChannels; channel++) {
      buffer.set(chunk[channel], offset);
      offset += chunk[channel].length;
    }
  }

  // Create WAV header
  const wavHeader = createWavHeader(length, numChannels, sampleRate);
  
  // Combine header and audio data
  const wavBlob = new Blob([wavHeader, buffer], { type: 'audio/wav' });
  return wavBlob;
}

// Helper function to create WAV header
function createWavHeader(dataLength, numChannels, sampleRate) {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength * 2, true);

  return buffer;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}