import React from "react";
import { DialoguesProvider } from "./context/DialoguesContext";
import { RecordingProvider } from "./context/RecordingContext";
import { VideoProvider } from "./context/VideoContext";
import { ErrorProvider } from "./context/ErrorContext";

const AppProviders = ({ children }) => {
  return (
    <DialoguesProvider>
      <RecordingProvider>
        <VideoProvider>
          <ErrorProvider>{children}</ErrorProvider>
        </VideoProvider>
      </RecordingProvider>
    </DialoguesProvider>
  );
};

export default AppProviders;
