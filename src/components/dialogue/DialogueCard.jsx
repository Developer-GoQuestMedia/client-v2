// src/components/dialogue/DialogueCard.jsx
import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useRecording } from '../../context/RecordingContext';
import DialogueText from './DialogueText';
import ContextInfo from './ContextInfo';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

const DialogueCard = () => {
  const { currentDialogue, moveToNext, moveToPrevious, updateDialogue, currentIndex,audioElement,setIsPlaying,
    setAudioElement, } = useRecording();
  const dialogueTextRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSwipeLeft = () => {
    console.log("handleSwipeLeft");
    setIsModalOpen(true);
  };

  const handleConfirm = (isApproved) => {
    if (dialogueTextRef.current) {
      const { original, translated, adapted } = dialogueTextRef.current.getTextValues();
      updateDialogue(currentIndex, {
        dialogue: {
          original,
          translated,
          adapted
        },
        isCompleted: true,
        status: isApproved ? 'approved' : 're-recorded'
      });
    }
    if (isApproved) {
      moveToNext();
    } else {
      if (typeof handleDeleteRecording === 'function') {
        handleDeleteRecording();
      }
    }
    setIsModalOpen(false);
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

  const handleSwipeRight = () => {
    console.log("handleSwipeRight");
    
    // Save current text before moving back
    if (dialogueTextRef.current) {
      const { original, translated, adapted } = dialogueTextRef.current.getTextValues();
      updateDialogue(currentIndex, {
        dialogue: {
          original,
          translated,
          adapted
        }
      });
    }
    moveToPrevious();
  };

  const { handleTouchStart, handleTouchMove, handleTouchEnd, touchDistance } = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight
  });

  return (
    <>
      <div
        className="relative transition-transform duration-300"
        style={{ transform: `translateX(${touchDistance}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Card className="w-full bg-white shadow-lg">
          {/* Character Info */}
          <div className="p-4 border-b">
            <div className="flex justify-between text-sm">
              <span>Character: {currentDialogue.character}</span>
              <span>{currentDialogue.time_start} - {currentDialogue.time_end}</span>
            </div>
          </div>

          <DialogueText 
            dialogue={currentDialogue.dialogue} 
            ref={dialogueTextRef}
          />
          
          <ContextInfo 
            context={currentDialogue.context}
            primary={currentDialogue.primary}
            secondary={currentDialogue.secondary}
            technical={currentDialogue.technical_notes}
            cultural={currentDialogue.cultural_notes}
          />

          {currentDialogue.audioURL && (
            <div className="p-4 border-t">
              <audio controls className="w-full">
                <source src={currentDialogue.audioURL} type="audio/wav" />
              </audio>
            </div>
          )}
        </Card>
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <p>Do you want to approve or re-record this dialogue?</p>
            <button onClick={() => handleConfirm(true)}>Approve</button>
            <button onClick={() => handleConfirm(false)}>Re-record</button>
          </div>
        </div>
      )}
    </>
  );
};

export default DialogueCard;