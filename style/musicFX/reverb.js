export {addReverb}

class Effect {
     constructor(context) {
          this.name = "effect";
          this.context = context;
          this.input = this.context.createGain();
          this.effect = null;
          this.bypassed = false;
          this.output = this.context.createGain();
          this.setup();
          this.wireUp();
     }

     setup() {
          this.effect = this.context.createGain();
     }

     wireUp() {
          this.input.connect(this.effect);
          this.effect.connect(this.output);
     }

     connect(destination) {
          this.output.connect(destination);
     }

}

class Filter extends Effect {
     constructor(context, type = "lowpass", cutoff = 1000, resonance = 0.9) {
          super(context);
          this.name = "filter";
          this.effect.frequency.value = cutoff;
          this.effect.Q.value = resonance;
          this.effect.type = type;
     }

     setup() {
          this.effect = this.context.createBiquadFilter();
          this.effect.connect(this.output);
          this.wireUp();
     }

}

class AmpEnvelope {
     constructor(context, gain = 1) {
          this.context = context;
          this.output = this.context.createGain();
          this.output.gain.value = gain;
          this.partials = [];
          this.velocity = 0;
          this.gain = gain;
          this._attack = 0;
          this._decay = 0.001;
          this._sustain = this.output.gain.value;
          this._release = 0.001;
     }

     on(velocity) {
          this.velocity = velocity / 127;
          this.start(this.context.currentTime);
     }

     off(MidiEvent) {
          return this.stop(this.context.currentTime);
     }

     start(time) {
          this.output.gain.value = 0;
          this.output.gain.setValueAtTime(0, time);
          this.output.gain.setTargetAtTime(1, time, this.attack + 0.00001);
          this.output.gain.setTargetAtTime(this.sustain * this.velocity, time + this.attack, this.decay);
     }

     stop(time) {
          this.sustain = this.output.gain.value;
          this.output.gain.cancelScheduledValues(time);
          this.output.gain.setValueAtTime(this.sustain, time);
          this.output.gain.setTargetAtTime(0, time, this.release + 0.00001);
     }

     set attack(value) {
          this._attack = value;
     }

     get attack() {
          return this._attack
     }

     set decay(value) {
          this._decay = value;
     }

     get decay() {
          return this._decay;
     }

     set sustain(value) {
          this.gain = value;
          this._sustain;
     }

     get sustain() {
          return this.gain;
     }

     set release(value) {
          this._release = value;
     }

     get release() {
          return this._release;
     }

     connect(destination) {
          this.output.connect(destination);
     }
}

class Voice {
     constructor(context, type = "sawtooth", gain = 0.1) {
          this.context = context;
          this.type = type;
          this.value = -1;
          this.gain = gain;
          this.output = this.context.createGain();
          this.partials = [];
          this.output.gain.value = this.gain;
          this.ampEnvelope = new AmpEnvelope(this.context);
          this.ampEnvelope.connect(this.output);
     }

     init() {
          let osc = this.context.createOscillator();
          osc.type = this.type;
          osc.connect(this.ampEnvelope.output);
          osc.start(this.context.currentTime);
          this.partials.push(osc);
     }

     on(MidiEvent) {
          this.value = MidiEvent.value;
          this.partials.forEach((osc) => {
               osc.frequency.value = MidiEvent.frequency;
          });
          this.ampEnvelope.on(MidiEvent.velocity || MidiEvent);
     }

     off(MidiEvent) {
          this.ampEnvelope.off(MidiEvent);
          this.partials.forEach((osc) => {
               osc.stop(this.context.currentTime + this.ampEnvelope.release * 4);
          });
     }

     connect(destination) {
          this.output.connect(destination);
     }

     set detune(value) {
          this.partials.forEach(p => p.detune.value = value);
     }

     set attack(value) {
          this.ampEnvelope.attack = value;
     }

     get attack() {
          return this.ampEnvelope.attack;
     }

     set decay(value) {
          this.ampEnvelope.decay = value;
     }

     get decay() {
          return this.ampEnvelope.decay;
     }

     set sustain(value) {
          this.ampEnvelope.sustain = value;
     }

     get sustain() {
          return this.ampEnvelope.sustain;
     }

     set release(value) {
          this.ampEnvelope.release = value;
     }

     get release() {
          return this.ampEnvelope.release;
     }

}

class Noise extends Voice {
	constructor(context, gain) {
		super(context, gain);
		this._length = 2;
	}

	get length () {
		return this._length || 2;
	}
	set length (value) {
		this._length = value;
	}

	init() {
		var lBuffer = new Float32Array(this.length * this.context.sampleRate);
		var rBuffer = new Float32Array(this.length * this.context.sampleRate);
		for(let i = 0; i < this.length * this.context.sampleRate; i++) {
			lBuffer[i] = 1-(2*Math.random());
			rBuffer[i] = 1-(2*Math.random());
		}
		let buffer = this.context.createBuffer(2, this.length * this.context.sampleRate, this.context.sampleRate);
		buffer.copyToChannel(lBuffer,0);
		buffer.copyToChannel(rBuffer,1);

		let osc = this.context.createBufferSource();
			osc.buffer = buffer;
			osc.loop = true;
			osc.loopStart = 0;
			osc.loopEnd = 2;
			osc.start(this.context.currentTime);
			osc.connect(this.ampEnvelope.output);
		this.partials.push(osc);
	}

	on(MidiEvent) {
		this.value = MidiEvent.value;
		this.ampEnvelope.on(MidiEvent.velocity || MidiEvent);
	}

}

class SimpleReverb extends Effect{
     constructor(context) {
          super(context);
          this.name = "SimpleReverb";
        }

     setup(reverbTime = 1) {
          this.effect = this.context.createConvolver();

          this.reverbTime = reverbTime;

          this.attack = 0.0001;
          this.decay = 0.1;
          this.release = reverbTime;

          this.wet = this.context.createGain();
          this.input.connect(this.wet);
          this.wet.connect(this.effect);
          this.effect.connect(this.output);

          this.renderTail();
     }

     renderTail() {
          const tailContext = new OfflineAudioContext(2, this.context.sampleRate * this.reverbTime, this.context.sampleRate);
          tailContext.oncomplete = (buffer) => {
               this.effect.buffer = buffer.renderedBuffer;
          }

          const tailOsc = new Noise(tailContext, 1);
          tailOsc.init();
          tailOsc.connect(tailContext.destination);
          tailOsc.attack = this.attack;
          tailOsc.decay = this.decay;
          tailOsc.release = this.release;


          tailOsc.on({ frequency: 500, velocity: 1 });
          tailContext.startRendering();
          setTimeout(() => {
               tailOsc.off();
          }, 1);


     }

     set decayTime(value) {
          let dc = value / 3;
          this.reverbTime = value;
          this.release = dc;
          return this.renderTail();
     }

}

class AdvancedReverb extends SimpleReverb {
     constructor(context) {
          super(context);
          this.name = "AdvancedReverb";
     }

     setup(reverbTime = 1, preDelay = 0.03) {
          this.effect = this.context.createConvolver();

          this.reverbTime = reverbTime;

          this.attack = 0.0001;
          this.decay = 0.1;
          this.release = reverbTime / 3;

          this.preDelay = this.context.createDelay(reverbTime);
          this.preDelay.delayTime.setValueAtTime(preDelay, this.context.currentTime);

          this.multitap = [];

          for (let i = 2; i > 0; i--) {
               this.multitap.push(this.context.createDelay(reverbTime));
          }
          this.multitap.map((t, i) => {
               if (this.multitap[i + 1]) {
                    t.connect(this.multitap[i + 1])
               }
               t.delayTime.setValueAtTime(0.001 + (i * (preDelay / 2)), this.context.currentTime);
          })

          this.multitapGain = this.context.createGain();
          this.multitap[this.multitap.length - 1].connect(this.multitapGain);

          this.multitapGain.gain.value = 0.2;

          this.multitapGain.connect(this.output);

          this.wet = this.context.createGain();

          this.input.connect(this.wet);
          this.wet.connect(this.preDelay);
          this.wet.connect(this.multitap[0]);
          this.preDelay.connect(this.effect);
          this.effect.connect(this.output);

     }
     renderTail() {

          const tailContext = new OfflinectxContext(2, this.context.sampleRate * this.reverbTime, this.context.sampleRate);
          tailContext.oncomplete = (buffer) => {
               this.effect.buffer = buffer.renderedBuffer;
          }
          const tailOsc = new Noise(tailContext, 1);
          const tailLPFilter = new Filter(tailContext, "lowpass", 5000, 1);
          const tailHPFilter = new Filter(tailContext, "highpass", 500, 1);

          tailOsc.init();
          tailOsc.connect(tailHPFilter.input);
          tailHPFilter.connect(tailLPFilter.input);
          tailLPFilter.connect(tailContext.destination);
          tailOsc.attack = this.attack;
          tailOsc.decay = this.decay;
          tailOsc.release = this.release;

          tailContext.startRendering()

          tailOsc.on({ frequency: 500, velocity: 1 });
          setTimeout(() => {
               tailOsc.off();
          }, 1)
     }

     set decayTime(value) {
          let dc = value / 3;
          this.reverbTime = value;
          this.release = dc;
          this.renderTail();
     }
}

function addReverb(ctx){
     const filter = new Filter(ctx, "lowpass", 50000, 0.8)

     let verb = new SimpleReverb(ctx);
     verb.decayTime = 0.8;
     verb.wet.gain.value = 2;

     let compressor = ctx.createDynamicsCompressor();
     compressor.threshold.setValueAtTime(-24, ctx.currentTime);
     compressor.knee.setValueAtTime(40, ctx.currentTime);
     compressor.ratio.setValueAtTime(12, ctx.currentTime);
     compressor.attack.setValueAtTime(0, ctx.currentTime);
     compressor.release.setValueAtTime(0.25, ctx.currentTime);
     compressor.connect(ctx.destination);

     filter.connect(verb.input);
     verb.connect(compressor);

     return filter
}