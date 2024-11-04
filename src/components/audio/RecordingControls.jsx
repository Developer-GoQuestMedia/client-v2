import React  from "react";
import { Button } from "@/components/ui/button";
import { 
  Mic, 
  Square, 
  Trash2,   // For delete
  RotateCcw, // For re-record
  Play,      // For play
  Pause      // For pause
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
    videoNotRequired

  } = useRecording();



  const handleStartRecording = async () => {
    try {
      const maxDuration = calculateMaxDuration(currentDialogue) * 1000;
      const recordingTimeout = setTimeout(() => {
        handleStopRecording();
      }, maxDuration);

      await startRecording(maxDuration);
      
      return () => clearTimeout(recordingTimeout);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    setIsPlaying(false);
    if (audioElement) {
      audioElement.pause();
    }
  };

  const handleDeleteRecording = () => {
    if (window.confirm('Are you sure you want to delete this recording?')) {
      updateDialogue(currentIndex, {
        audioURL: null,
        status: 'pending'
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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-4">
      {/* Audio Visualization */}
      {isRecording && audioStream && (
        <>
          <AudioVisualizer audioStream={audioStream} maxDuration={calculateMaxDuration(currentDialogue)} />
          <RecordingTimer
            isRecording={isRecording}
            maxDuration={calculateMaxDuration(currentDialogue)}
          />
        </>
      )}

      {/* Control Buttons */}
      <div className="flex gap-4 max-w-lg mx-auto">
        {/* Record/Stop Button */}
        <Button
          className="flex-1"
          variant={isRecording ? "destructive" : "default"}
          onClick={() => isRecording ? handleStopRecording() : handleStartRecording()}
          disabled={!currentDialogue || isPlaying}
        >
          {isRecording ? (
            <><Square className="mr-2 h-4 w-4" /> Stop</>
          ) : (
            <><Mic className="mr-2 h-4 w-4" /> Record</>
          )}
        </Button>

        {/* Play/Pause Button */}
        <Button
          variant="outline"
          onClick={handlePlayback}
          disabled={!currentDialogue?.audioURL || isRecording}
          className="w-24"
        >
          {isPlaying ? (
            <><Pause className="mr-2 h-4 w-4" /> Pause</>
          ) : (
            <><Play className="mr-2 h-4 w-4" /> Play</>
          )}
        </Button>

        {/* Re-record Button */}
        <Button
          variant="outline"
          onClick={handleReRecord}
          disabled={isPlaying || (!currentDialogue?.audioURL && !isRecording)}
          title="Re-record"
          className="w-24"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Retry
        </Button>

        {/* Delete Button */}
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

      {/* Current Dialogue Info */}
      {currentDialogue && (
        <div className="text-xs text-gray-500 text-center mt-2">
          Recording time limit: {calculateMaxDuration(currentDialogue)} seconds
        </div>
      )}
    </div>
  );
};

export default RecordingControls;