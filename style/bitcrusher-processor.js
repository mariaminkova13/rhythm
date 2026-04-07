class BitcrusherProcessor extends AudioWorkletProcessor {
     static get parameterDescriptors() {
          return [
               { name: 'bits', defaultValue: 4, minValue: 1 },
               { name: 'normFreq', defaultValue: 0.1, minValue: 0.0, maxValue: 1.0 }
          ];
     }

     constructor() {
          super();
          this.phase = 0;
          this.lastSample = 0;
     }

     process(inputs, outputs, parameters) {
          const input = inputs[0][0];
          const output = outputs[0][0];
          if (!input) return true;

          const bits = parameters.bits[0];
          const normFreq = parameters.normFreq[0];
          const step = 1 / bits;

          for (let i = 0; i < input.length; i++) {
               this.phase += normFreq;
               if (this.phase >= 1.0) {
                    this.phase -= 1.0;
                    this.lastSample = step * Math.floor(input[i] / step);
               }
               output[i] = this.lastSample;
          }

          return true;
     }
}

registerProcessor("bitcrusher-processor", BitcrusherProcessor);   