export const createWorker = async (audioContext) => {
  const workletCode = `
    class RecorderProcessor extends AudioWorkletProcessor {
      constructor() {
        super();
        this.isRecording = true;
        this.recordedData = [];
      }

      process(inputs) {
        const input = inputs[0];
        if (input && input.length > 0 && this.isRecording) {
          // Process each channel
          const processedData = input.map(channel => {
            // Apply gain to each sample
            const gainFactor = 50;
            return Array.from(channel).map(sample => sample * gainFactor);
          });
          
          // Send the processed data
          this.port.postMessage({
            audioData: processedData,
            peakLevel: Math.max(...processedData[0].map(Math.abs))
          });
        }
        return true;
      }
    }

    registerProcessor('recorder-processor', RecorderProcessor);
  `;

  const blob = new Blob([workletCode], { type: 'application/javascript' });
  const workletUrl = URL.createObjectURL(blob);

  await audioContext.audioWorklet.addModule(workletUrl);
  const workletNode = new AudioWorkletNode(audioContext, 'recorder-processor', {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 2,
    processorOptions: {
      sampleRate: audioContext.sampleRate
    }
  });

  return workletNode;
};
