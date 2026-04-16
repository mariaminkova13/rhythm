class BitcrusherProcessor extends AudioWorkletProcessor {
     static get parameterDescriptors() {
          return [
               { name: 'bits', defaultValue: 512, minValue: 16, maxValue: 1024 },
               { name: 'normFreq', defaultValue: 0.3, minValue: 0.0, maxValue: 1.0 }
          ];
     }

     constructor() {
          super();
          this.phase = [0, 0];       // per-channel
          this.lastSample = [0, 0];  // per-channel
     }

     process(inputs, outputs, parameters) {
          const input = inputs[0];
          const output = outputs[0];

          if (!input || input.length === 0) return true;

          const bits = parameters.bits[0];
          const normFreq = parameters.normFreq[0];
          const step = 1 / bits;

          for (let channel = 0; channel < output.length; channel++) {
               const inputChannel = input[channel];
               const outputChannel = output[channel];

               if (!inputChannel) continue;

               let phase = this.phase[channel];
               let lastSample = this.lastSample[channel];

               for (let i = 0; i < inputChannel.length; i++) {
                    phase += normFreq;
                    if (phase >= 1.0) {
                         phase -= 1.0;
                         lastSample = step * Math.floor(inputChannel[i] / step);
                    }
                    outputChannel[i] = lastSample;
               }

               this.phase[channel] = phase;
               this.lastSample[channel] = lastSample;
          }

          return true;
     }
}

registerProcessor("bitcrusher-processor", BitcrusherProcessor);
