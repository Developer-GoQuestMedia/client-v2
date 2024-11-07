export const createWorker = async (audioContext) => {
  const workletCode = `
    class RecorderProcessor extends AudioWorkletProcessor {
      constructor() {
        super();
        this.isRecording = true;
        this.buffers = [];
      }

      process(inputs) {
        const input = inputs[0];
        if (!input || !input.length) return true;

        // Clone the input data
        const audioData = input.map(channel => new Float32Array(channel));
        
        // Send the audio data to the main thread
        this.port.postMessage({ audioData });
        
        return true;
      }
    }

    registerProcessor('recorder-processor', RecorderProcessor);
  `;

  const blob = new Blob([workletCode], { type: 'application/javascript' });
  const workletUrl = URL.createObjectURL(blob);

  try {
    await audioContext.audioWorklet.addModule(workletUrl);
    const workletNode = new AudioWorkletNode(audioContext, 'recorder-processor');
    URL.revokeObjectURL(workletUrl);
    return workletNode;
  } catch (error) {
    URL.revokeObjectURL(workletUrl);
    throw error;
  }
};
