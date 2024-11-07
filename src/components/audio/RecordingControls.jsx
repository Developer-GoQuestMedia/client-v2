import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Mic,
  Square,
  Trash2,
  RotateCcw,
  Play,
  Pause,
} from "lucide-react";
import { useRecording } from "../../context/RecordingContext";
import AudioVisualizer from "./AudioVisualizer";
import RecordingTimer from "./RecordingTimer";
import { calculateMaxDuration } from "../../utils/timeUtils";

const RecordingControls = () => {
  const {
    isRecording,
    currentDialogue,
    audioStream,
    startRecording,
    stopRecording,
    updateDialogue,
    currentIndex,
    audioElement,
    isPlaying,
    setAudioElement,
    setIsPlaying,
    error,
  } = useRecording();

  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const mediaStreamRef = useRef(null);
  const timeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    if (error) {
      console.error("Recording error:", error);
    }
  }, [error]);

  useEffect(() => {
    // Cleanup countdown interval on unmount
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const handleStopRecording = useCallback(() => {
    try {
      console.log('Stopping recording...');
      
      if (timeoutRef.current) {
        console.log('Clearing timeout...');
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      stopRecording();
      console.log('Recording stopped');
      
      if (mediaStreamRef.current) {
        console.log('Cleaning up media stream...');
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      
      setIsPlaying(false);
      if (audioElement) {
        console.log('Pausing audio element...');
        audioElement.pause();
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  }, [stopRecording, setIsPlaying, audioElement]);

  const startCountdown = useCallback(() => {
    setCountdown(3);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleStartRecording = useCallback(async () => {
    if (isProcessing) return;
    
    try {
      console.log('Starting countdown...');
      setIsProcessing(true);
      startCountdown();

      // Wait for countdown
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('Requesting media stream...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Media stream obtained:', stream);
      mediaStreamRef.current = stream;
      
      const maxDuration = calculateMaxDuration(currentDialogue) * 1000;
      console.log('Max duration set to:', maxDuration, 'ms');
      
      timeoutRef.current = setTimeout(() => {
        console.log('Max duration reached, stopping recording...');
        handleStopRecording();
      }, maxDuration);

      console.log('Initiating recording...');
      await startRecording(maxDuration);
      console.log('Recording started successfully');

    } catch (error) {
      console.error("Error starting recording:", error);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    } finally {
      setIsProcessing(false);
    }
  }, [currentDialogue, startRecording, handleStopRecording, isProcessing, startCountdown]);

  const handleDeleteRecording = () => {
    if (window.confirm("Are you sure you want to delete this recording?")) {
      localStorage.removeItem(`recording_${currentIndex}`);
      
      updateDialogue(currentIndex, {
        audioURL: null,
        status: "pending",
      });
      if (audioElement) {
        audioElement.pause();
        setAudioElement(null);
      }
      setIsPlaying(false);
    }
  };

  const handleReRecord = () => {
    if (isRecording) {
      handleStopRecording();
    }
    if (currentDialogue.audioURL) {
      handleDeleteRecording();
    }
    handleStartRecording();
  };

  const handlePlayback = () => {
    if (!currentDialogue.audioURL) return;

    if (!audioElement) {
      const audio = new Audio(currentDialogue.audioURL);
      audio.onended = () => {
        setIsPlaying(false);
      };
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSuccessfulUpload = useCallback(() => {
    localStorage.removeItem(`recording_${currentIndex}`);
  }, [currentIndex]);

  useEffect(() => {
    if (audioElement) {
      setAudioElement(null);
      setIsPlaying(false);
    }
  }, [currentIndex, audioElement]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-4">
      {isRecording && audioStream && (
        <>
          <AudioVisualizer
            audioStream={audioStream}
            maxDuration={calculateMaxDuration(currentDialogue)}
          />
          <RecordingTimer
            isRecording={isRecording}
            maxDuration={calculateMaxDuration(currentDialogue)}
          />
        </>
      )}

      <div className="flex gap-4 max-w-lg mx-auto">
        <Button
          className="flex-1 p-2"
          variant={isRecording ? "destructive" : "default"}
          onClick={() =>
            isRecording ? handleStopRecording() : handleStartRecording()
          }
          disabled={!currentDialogue || isPlaying || isProcessing}
        >
          {isProcessing && countdown > 0 ? (
            <span className="flex items-center">
              <span className="text-lg font-bold mr-2">{countdown}</span>
              Starting...
            </span>
          ) : isRecording ? (
            <>
              <Square className="mr-2 h-4 w-4" /> Stop
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" /> Record
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handlePlayback}
          disabled={!currentDialogue?.audioURL || isRecording}
          className="w-24"
        >
          {isPlaying ? (
            <>
              <Pause className="mr-2 h-4 w-4" /> Pause
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" /> Play
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handleReRecord}
          disabled={isPlaying || (!currentDialogue?.audioURL && !isRecording)}
          title="Re-record"
          className="w-24"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Retry
        </Button>

        <Button
          variant="outline"
          onClick={handleDeleteRecording}
          disabled={!currentDialogue?.audioURL || isRecording}
          title="Delete recording"
          className="w-24"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>

      {currentDialogue && (
        <div className="text-xs text-gray-500 text-center mt-2">
          Recording time limit: {calculateMaxDuration(currentDialogue)} seconds
        </div>
      )}
    </div>
  );
};

export default RecordingControls;