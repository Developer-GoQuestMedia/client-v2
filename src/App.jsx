import React from 'react';
import { DialoguesProvider } from './context/DialoguesContext';
import { RecordingProvider } from './context/RecordingContext';
import { AudioProvider } from './context/AudioContext';
import { VideoProvider } from './context/VideoContext';
import { ErrorProvider } from './context/ErrorContext';
import VideoPlayer from './components/video/VideoPlayer';
import DialogueCard from './components/dialogue/DialogueCard';
import RecordingControls from './components/audio/RecordingControls';

const App = () => {
  return (
    <RecordingProvider>

    <DialoguesProvider>
      <AudioProvider>
        <VideoProvider>
          <ErrorProvider>
            <div className="min-h-screen bg-gray-100">
              <div className="mx-auto">
                <VideoPlayer />
                <div className="p-4">
                  <DialogueCard />
                </div>
              </div>
              <RecordingControls />
            </div>
          </ErrorProvider>
        </VideoProvider>
      </AudioProvider>
    </DialoguesProvider>
    </RecordingProvider>
  );
};

export default App;
