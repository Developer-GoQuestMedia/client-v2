import React from 'react';
import { RecordingProvider } from './context/RecordingContext';
import VideoPlayer from './components/video/VideoPlayer';
import DialogueCard from './components/dialogue/DialogueCard';
import RecordingControls from './components/audio/RecordingControls';

const App = () => {
  return (
    <RecordingProvider>
      <div className="min-h-screen bg-gray-100 ">
        <div className="max-w-sm mx-auto pb-24"> {/* pb-24 for RecordingControls space */}
          <VideoPlayer />
          <div className="p-4">
            <DialogueCard />
          </div>
        </div>
        <RecordingControls />
      </div>
    </RecordingProvider>
  );
};

export default App;