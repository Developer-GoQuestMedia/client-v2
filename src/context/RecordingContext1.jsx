// src/context/RecordingContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import "../styles/globals.css";
import { createWorker } from "../utils/audioWorker";
import { ElevenLabsClient } from "elevenlabs";
import axios from "axios";

// Add this at the top of your file, before the component
const initializeMediaDevices = () => {
  // Legacy browser support
  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {};
  }

  // Some browsers partially implement mediaDevices. We can't just assign an object
  // with getUserMedia as it would overwrite existing properties.
  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      // First get ahold of the legacy getUserMedia, if present
      const getUserMedia =
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      // Some browsers just don't implement it - return a rejected promise with an error
      if (!getUserMedia) {
        return Promise.reject(
          new Error("getUserMedia is not implemented in this browser")
        );
      }

      // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }
};

// const defaultDialogues = require('../data/Sample.json');

const projectId = "672b48ef936eaa6e6710fa6e";
const fetchDialogues = async () => {
  try {
    const response = await axios.get(
      `https://server-v2-akga.onrender.com/api/dialogues/list/${projectId}`
    );
    return response.data; // Assuming the response data is in the expected format
  } catch (error) {
    console.error("Error fetching dialogues:", error);
    return []; // Return an empty array or handle the error as needed
  }
};
// Replace defaultDialogues with the fetched data
const defaultDialogues = await fetchDialogues();

const RecordingContext = createContext(null);

// Add this function before createWavBlob
const audioIsolation = async (audioBlob) => {
  try {
    console.log("Audio isolation started");
    const client = new ElevenLabsClient({ 
      apiKey: "eeff688eea60a16d86ead08dfa33e336" 
    });

    // Convert Blob to ReadableStream
    const stream = audioBlob.stream();
    
    // Perform audio isolation
    const isolatedAudio = await client.audioIsolation.audioIsolationStream({
      audio: stream
    });

    // Convert the response to a Blob
    return new Blob([isolatedAudio], { type: 'audio/wav' });
  } catch (error) {
    console.error("Audio isolation failed:", error);
    return audioBlob; // Return original blob if isolation fails
  }
};

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
  const currentDialogue = useMemo(
    () => dialogues[currentIndex] || null,
    [dialogues, currentIndex]
  );

  // Helper function to create audio processor
  const createAudioProcessor = async (audioContext) => {
    await audioContext.audioWorklet.addModule(
      URL.createObjectURL(
        new Blob(
          [
            `
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
    `,
          ],
          { type: "application/javascript" }
        )
      )
    );

    const processor = new AudioWorkletNode(audioContext, "recorder-processor");

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
        stream.getTracks().forEach((track) => track.stop());
      }
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close();
      }
    }
    setIsRecording(false);
    setAudioStream(null);
    mediaRecorder.current = null;
  }, []);

  // Move updateDialogue definition before functions that depend on it
  const updateDialogue = useCallback((index, updates) => {
    setDialogues((prev) =>
      prev.map((dialogue, i) =>
        i === index ? { ...dialogue, ...updates } : dialogue
      )
    );
  }, []);

  const stopRecording = useCallback(() => {
    console.log("Stop recording called");

    if (!mediaRecorder.current || !mediaRecorder.current.isRecording) {
      console.log("No active recording found");
      return;
    }

    try {
      console.log("Stopping recording...");
      mediaRecorder.current.stop();

      // Stop all tracks
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }

      console.log("Recording stopped successfully");
      setIsRecording(false);
      setAudioStream(null);

      // Upload the recorded audio
      // uploadRecordedAudio();
    } catch (error) {
      console.error("Error stopping recording:", error);
      setError("Failed to stop recording");
      cleanup();
    }
  }, [audioStream, setError, setIsRecording, setAudioStream, cleanup]);

  const checkMediaSupport = useCallback(async () => {
    console.log("Checking media support...");

    try {
      // Initialize media devices
      initializeMediaDevices();
      console.log("Media devices initialized");

      // Only check for secure context in production
      if (!window.isSecureContext && process.env.NODE_ENV === "production") {
        const msg =
          "Audio recording requires a secure (HTTPS) connection. Please contact the administrator.";
        console.error("Not in a secure context - HTTPS required");
        setError(msg);
        return false;
      }

      // Now check if mediaDevices is available
      if (!navigator.mediaDevices) {
        console.error(
          "navigator.mediaDevices is still not available after initialization"
        );
        setError(
          "Your browser doesn't support audio recording. Please use a modern browser."
        );
        return false;
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices.getUserMedia) {
        console.error("getUserMedia is not available");
        setError(
          "Your browser doesn't support audio recording. Please use a modern browser."
        );
        return false;
      }

      console.log("Requesting audio permissions...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
      });

      console.log("Audio permissions granted");
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      console.error("Media support check failed:", err);
      if (err.name === "NotAllowedError") {
        setError("Please allow microphone access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setError("No microphone found. Please connect a microphone.");
      } else {
        setError(`Microphone access failed: ${err.message}`);
      }
      return false;
    }
  }, []);

  const startRecording = useCallback(
    async (maxDuration) => {
      console.log("Starting recording process...");
      let stream;
      let audioContext;
      let workletNode;

      try {
        const isSupported = await checkMediaSupport();
        if (!isSupported) return;

        console.log("Media support confirmed, proceeding with recording setup");

        // Request high-quality audio stream
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
          },
        });

        console.log("Audio stream obtained");

        // Create Audio Context and Source
        audioContext = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 48000,
          channelCount: 2,
        });
        const source = audioContext.createMediaStreamSource(stream);

        // Create and connect the worker
        workletNode = await createWorker(audioContext);

        // Connect the nodes properly
        source.connect(workletNode);
        // Remove the connection to destination to prevent echo
        // workletNode.connect(audioContext.destination);

        const recordedChunks = [];

        workletNode.port.onmessage = (event) => {
          if (event.data.audioData) {
            recordedChunks.push(event.data.audioData);
          }
        };

        // Store recorder state
        mediaRecorder.current = {
          stream,
          audioContext,
          workletNode,
          isRecording: true,
          stop: async () => {
            console.log("Stopping media recorder...");
            mediaRecorder.current.isRecording = false;
            source.disconnect(workletNode);
            workletNode.disconnect();

            if (recordedChunks.length === 0) {
              throw new Error("No audio data recorded");
            }

            // Combine all chunks into continuous arrays per channel
            const numChannels = recordedChunks[0].length;
            const combinedChannels = Array(numChannels)
              .fill()
              .map(() => []);

            for (const chunk of recordedChunks) {
              for (let channel = 0; channel < numChannels; channel++) {
                combinedChannels[channel].push(...chunk[channel]);
              }
            }

            const wavBlob = createWavBlob(
              combinedChannels.map((channel) => new Float32Array(channel)),
              numChannels,
              audioContext.sampleRate
            );

            // Add audio isolation step
            // const processedBlob = await audioIsolation(wavBlob);
            const processedBlob = wavBlob;
            
            // Log the recorded audio type
            const reader = new FileReader();
            reader.onloadend = () => {
              localStorage.setItem('recording', reader.result);
              console.log("WAV Blob stored in localStorage under 'recording'");
            };
            reader.readAsDataURL(processedBlob);
            console.log("Recorded audio type:", processedBlob.type);

            if (dialogues[currentIndex]?.audioURL) {
              URL.revokeObjectURL(dialogues[currentIndex].audioURL);
            }

            const audioUrl = URL.createObjectURL(processedBlob);
            const duration =
              combinedChannels[0].length / audioContext.sampleRate;

            setDialogues((prev) =>
              prev.map((dialogue, index) => {
                if (index === currentIndex) {
                  return {
                    ...dialogue,
                    audioURL: audioUrl,
                    recordingStatus: "recorded",
                    duration: duration,
                    mimeType: "audio/wav",
                  };
                }
                return dialogue;
              })
            );
            console.log("Media recorder stopped");
          },
        };

        setIsRecording(true);
        setAudioStream(stream);
        setError(null);
        console.log("Recording started successfully");
      } catch (error) {
        console.error("Recording setup failed:", error);
        setError(`Recording failed: ${error.message}`);
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        if (audioContext) {
          audioContext.close();
        }
        cleanup();
      }
    },
    [
      currentIndex,
      cleanup,
      setError,
      setIsRecording,
      setAudioStream,
      setDialogues,
    ]
  );

  // Navigation functions
  const moveToNext = useCallback(() => {
    if (currentIndex < dialogues.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, dialogues.length]);

  const moveToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const jumpToScene = useCallback(
    (index) => {
      if (index >= 0 && index < dialogues.length) {
        setCurrentIndex(index);
      }
    },
    [dialogues.length]
  );

  // Dialogue management
  const approveDialogue = useCallback(() => {
    updateDialogue(currentIndex, {
      status: "approved",
      isCompleted: true,
    });
    moveToNext();
  }, [currentIndex, updateDialogue, moveToNext]);

  const rejectDialogue = useCallback(() => {
    updateDialogue(currentIndex, {
      status: "rejected",
      isCompleted: false,
      audioURL: null,
    });
  }, [currentIndex, updateDialogue]);

  // Video sync functions
  const syncVideoTime = useCallback((timeString) => {
    if (videoRef.current) {
      const [hours, minutes, seconds, frames] = timeString
        .split(":")
        .map(Number);
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
      status: "pending",
      duration: null,
    });
  }, [currentIndex, currentDialogue, updateDialogue]);

  // Add handleReRecord function
  const handleReRecord = useCallback(() => {
    if (!currentDialogue) return;

    handleDeleteRecording();
    startRecording();
  }, [currentDialogue, handleDeleteRecording, startRecording]);

  // const uploadRecordedAudio = useCallback(async () => {
  //   console.log("Uploading recorded audio");
  //   // if (!dialogues[currentIndex]?.audioURL) {
  //   //   console.error('No audio URL found for current dialogue');
  //   //   return;
  //   // }

  //   try {
  //     const response = await fetch(dialogues[currentIndex].audioURL);
  //     const audioBlob = await response.blob();

  //     const formData = new FormData();
  //     formData.append('audio', audioBlob, 'recording.wav');
  //     formData.append('dialogueId', dialogues[currentIndex].id);

  //     const uploadResponse = await axios.post(
  //       'https://server-v2-akga.onrender.com/api/dialogues',
  //       formData,
  //       {
  //         headers: {
  //           'Content-Type': 'multipart/form-data',
  //         },
  //       }
  //     );

  //     if (uploadResponse.data.success) {
  //       console.log('Audio uploaded successfully');
  //       updateDialogue(currentIndex, {
  //         serverAudioUrl: uploadResponse.data.audioUrl,
  //         uploadStatus: 'success'
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error uploading audio:', error);
  //     setError('Failed to upload audio');
  //     updateDialogue(currentIndex, {
  //       uploadStatus: 'failed'
  //     });
  //   }
  // }, [dialogues, currentIndex, updateDialogue, setError]);

  const handleSuccessfulUpload = useCallback(async () => {
    try {
      if (!currentDialogue) {
        throw new Error("No current dialogue found");
      } 

      const fileName = `recording_${currentDialogue.videoUrl.replace(
        ".mp4",
        ""
      )}.wav`;
      const audioData = localStorage.getItem("recording");
      // console.log("fileName:", fileName);
      console.log("audioData found:", !!audioData);

      if (!audioData) {
        throw new Error("No audio data found");
      }

      // Convert base64 to blob
      const base64Response = await fetch(audioData);
      const blob = await base64Response.blob();

      const formData = new FormData();
      formData.append("audio", blob, fileName);
      formData.append("dialogueId", currentDialogue._id);

      const response = await axios.post(
        "https://server-v2-akga.onrender.com/api/audio/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Upload response:", response.data);

      if (response.data.audioUrl) {
        console.log("Updating dialogue with new audio URL and recordingStatus");
        updateDialogue(currentIndex, {
          audioURL: response.data.audioUrl,
          recordingStatus: "recorded",
        });
        console.log("Dialogue updated with new audio URL and recordingStatus");
      }

      // Clean up localStorage
      localStorage.removeItem(fileName);
    } catch (error) {
      console.error("Error uploading audio:", error);
      throw error;
    }
  }, [currentIndex, currentDialogue, updateDialogue]);

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
    handleSuccessfulUpload,
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
    throw new Error("useRecording must be used within a RecordingProvider");
  }
  return context;
};

// Update the WAV creation functions
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

function createWavBlob(audioData, numChannels, sampleRate) {
  const bytesPerSample = 2;
  const frameLength = audioData[0].length;
  const numberOfFrames = frameLength * numChannels;
  const headerLength = 44;
  const dataLength = numberOfFrames * bytesPerSample;
  const bufferLength = headerLength + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // RIFF chunk descriptor
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");

  // FMT sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // subchunk1size
  view.setUint16(20, 1, true); // audio format (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // byte rate
  view.setUint16(32, numChannels * bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // Data sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Write the PCM samples
  const offset = 44;
  for (let i = 0; i < frameLength; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = audioData[channel][i];
      floatTo16BitPCM(
        view,
        offset + (i * numChannels + channel) * bytesPerSample,
        [sample]
      );
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}
