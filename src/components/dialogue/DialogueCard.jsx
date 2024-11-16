import React, { useRef, useState } from 'react';
import { Card } from '../ui/card';
import { useRecording } from '../../context/RecordingContext';
import DialogueText from './DialogueText';
import ContextInfo from './ContextInfo';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import axios from 'axios';

const DialogueCard = () => {
  const { currentDialogue, moveToNext, moveToPrevious, updateDialogue, currentIndex,audioElement,setIsPlaying,
    setAudioElement, } = useRecording();
  const dialogueTextRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSwipeLeft = () => {
    console.log("handleSwipeLeft");
    setIsModalOpen(true);
  };

  const handleConfirm = async (isApproved) => {
    if (dialogueTextRef.current) {
      const { original, translated, adapted } = dialogueTextRef.current.getTextValues();
      
      try {
        // Make API call to update dialogue
        const response = await axios.put(`https://server-v2-akga.onrender.com/api/dialogues/${currentDialogue._id}`, {
          dialogue: {
            original,
            translated,
            adapted
          },
          status: isApproved ? 'approved' : 'pending'
        });
        
        console.log('API Response:', response.data); // Log the response data

        // Update local state after successful API call
        updateDialogue(currentIndex, {
          dialogue: {
            original,
            translated,
            adapted
          },
          isCompleted: true,
          status: isApproved ? 'approved' : 'pending'
        });

        if (isApproved) {
          moveToNext();
        } else {
          if (typeof handleDeleteRecording === 'function') {
            handleDeleteRecording();
          }
        }
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error updating dialogue:', error);
        // Optionally add error handling UI here
      }
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

    // console.log("context",   currentDialogue)
    // console.log("Primary",   currentDialogue.emotions.primary)
    // console.log("secondary", currentDialogue)
    // console.log("technicle notes", currentDialogue)
    // console.log("caltural", currentDialogue)
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
              <span>{currentDialogue.timeStart} - {currentDialogue.timeEnd}</span>
            </div>
          </div>

          <DialogueText 
            dialogue={currentDialogue.dialogue} 
            ref={dialogueTextRef}
          />
          
          <ContextInfo 
            context={{
              sceneContext: currentDialogue.sceneContext,
              emotions: {
                  primary: currentDialogue.emotions.primary,
                  secondary: currentDialogue.emotions.secondary,
              },
              technical: currentDialogue.technicalNotes,
              cultural: currentDialogue.culturalNotes,
          }}
          />

          {currentDialogue.audioURL && (
            <div className="p-4 border-t bg-red-600 h-32 mb-2">
              <audio controls className="w-full">
                <source src={currentDialogue.audioURL} type="audio/wav" />
              </audio>
            </div>
          )}
        </Card>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="modal-content bg-white p-6 rounded-lg shadow-lg w-4/5">
            <p className="text-lg font-semibold">Do you want to approve or re-record this dialogue?</p>
            <div className="mt-4 flex justify-center">
              <button className="mr-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" onClick={() => handleConfirm(true)}>Approve</button>
              <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" onClick={() => handleConfirm(false)}>Re-record</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DialogueCard;