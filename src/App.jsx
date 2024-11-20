import React from 'react';
import { DialoguesProvider } from './context/DialoguesContext';
import { RecordingProvider } from './context/RecordingContext1';
import { VideoProvider } from './context/VideoContext';
import { ErrorProvider } from './context/ErrorContext';
import VideoPlayer from './components/video/VideoPlayer';
import DialogueCard from './components/dialogue/DialogueCard';
import RecordingControls from './components/audio/RecordingControls';

const App = () => {
  return (
    <DialoguesProvider>
      <RecordingProvider>
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
      </RecordingProvider>
    </DialoguesProvider>
  );
};

export default App;
