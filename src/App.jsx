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
  const [showPermissionDialog, setShowPermissionDialog] = React.useState(true);
  const [hasUserResponded, setHasUserResponded] = React.useState(false);

  const requestFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (!element) return;

      await element.requestFullscreen();
      setHasUserResponded(true);
      setShowPermissionDialog(false);
    } catch (err) {
      console.error('Error attempting to enable fullscreen:', err);
      setHasUserResponded(true);
      setShowPermissionDialog(false);
    }
  };

  const handleCancel = () => {
    setHasUserResponded(true);
    setShowPermissionDialog(false);
  };

  return (
    <RecordingProvider>
      <DialoguesProvider>
        <AudioProvider>
          <VideoProvider>
            <ErrorProvider>
              {!hasUserResponded && showPermissionDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-4">
                    <h2 className="text-xl font-bold mb-4">Fullscreen Permission</h2>
                    <p className="mb-4">This application works best in fullscreen mode. Would you like to continue?</p>
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={requestFullscreen}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Enter Fullscreen
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {hasUserResponded && (
                <div className="min-h-screen bg-gray-100">
                  <div className="mx-auto">
                    <VideoPlayer />
                    <div className="p-4">
                      <DialogueCard />
                    </div>
                  </div>
                  <RecordingControls />
                </div>
              )}
            </ErrorProvider>
          </VideoProvider>
        </AudioProvider>
      </DialoguesProvider>
    </RecordingProvider>
  );
};

export default App;
