// Native Web Audio API Violin Synthesizer for Tavern Musicians
import { OpponentData } from '../types';

export interface Note {
    note: string;       // Name of the note (e.g. "C4", "F#5", "rest", "P")
    frequency: number;  // Calculated frequency in Hz
    duration: number;   // Duration in seconds (adjusted for BPM)
    originalDuration: number; // Raw duration in beats/relative value
}

export interface PresetMelody {
    id: string;
    name: string;
    description: string;
    notes: string;
    bpm: number;
}

const NOTE_SEMITONES: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

// Convert string note (like "C4", "F#5") to frequency
export function noteToFrequency(noteStr: string): number {
    const clean = noteStr.trim();
    if (!clean) return 0;
    if (clean.toLowerCase() === 'rest' || clean === 'p' || clean === '-') return 0;

    // Matches note name + optional sharp/flat + optional octave (default 4)
    const match = clean.match(/^([A-G][#b]?)(\d)?$/i);
    if (!match) return 0;

    const rawName = match[1];
    // Capitalize note name and ensure sharp/flat is formatted (e.g. c# -> C#, bb -> Bb)
    let name = rawName.charAt(0).toUpperCase();
    if (rawName.length > 1) {
        name += rawName.charAt(1).toLowerCase();
    }

    const octave = match[2] ? parseInt(match[2], 10) : 4;
    const semitone = NOTE_SEMITONES[name];
    if (semitone === undefined) return 0;

    // Dist from A4 (which is semitone 9, octave 4)
    const distance = (octave - 4) * 12 + (semitone - 9);
    return 440 * Math.pow(2, distance / 12);
}

// Parse space or comma-separated notes with optional custom durations (e.g. "E4:0.5 G4:0.5 A4:1.0")
export function parseNotes(notesStr: string, bpm: number): Note[] {
    const tokens = notesStr.trim().split(/[\s,]+/);
    const beatDuration = 60 / bpm; // duration of one beat in seconds

    return tokens.map(token => {
        if (!token) return null;
        const parts = token.split(':');
        const noteName = parts[0];
        // Default duration is 1 beat (0.5 or 0.25 is also common)
        const relDuration = parts[1] ? parseFloat(parts[1]) : 1.0;
        
        return {
            note: noteName,
            frequency: noteToFrequency(noteName),
            duration: relDuration * beatDuration,
            originalDuration: relDuration
        };
    }).filter((n): n is Note => n !== null);
}

// Preset Melodies List (Ukrainian Folk and popular tunes)
export const PRESET_MELODIES: PresetMelody[] = [
    {
        id: 'shchedryk',
        name: '«Щедрик» (Carol of the Bells)',
        description: 'Легендарна українська різдвяна щедрівка в обробці Миколи Леонтовича.',
        bpm: 145,
        notes: 'Bb4:0.5 A4:0.5 Bb4:0.5 G4:0.5 Bb4:0.5 A4:0.5 Bb4:0.5 G4:0.5 Bb4:0.5 A4:0.5 Bb4:0.5 G4:0.5 Bb4:0.5 A4:0.5 Bb4:0.5 G4:0.5 D5:0.5 D5:0.5 C5:0.5 Bb4:0.5 A4:0.5 A4:0.5 G4:0.5 F#4:0.5 G4:0.5 A4:0.5 G4:1.0 P:0.5'
    },
    {
        id: 'kalyna',
        name: '«Ой у лузі червона калина»',
        description: 'Українська народна пісня авторського походження, гімн Січових стрільців.',
        bpm: 100,
        notes: 'E4:0.5 G4:0.5 A4:0.5 B4:1.0 B4:0.5 A4:0.5 B4:0.5 C5:0.5 B4:1.5 A4:0.5 B4:0.5 C5:0.5 D5:1.0 D5:0.5 C5:0.5 D5:0.5 E5:0.5 B4:1.5'
    },
    {
        id: 'kozak_march',
        name: '«Запорозький Марш»',
        description: 'Епічний марш українських козаків.',
        bpm: 110,
        notes: 'D4:0.5 F4:0.5 G4:1.0 G4:0.5 G4:0.5 F4:0.5 G4:0.5 A4:0.5 Bb4:1.0 A4:0.5 G4:0.5 F4:1.0 G4:0.5 F4:0.5 D4:1.5 D4:0.5 F4:0.5 G4:1.0 G4:0.5 G4:0.5 F4:0.5 G4:0.5 A4:0.5 Bb4:1.0 C5:0.5 D5:1.5'
    },
    {
        id: 'nich_misyachna',
        name: '«Ніч яка місячна»',
        description: 'Душевний романс про красу української ночі.',
        bpm: 80,
        notes: 'D4:0.5 G4:0.5 Bb4:0.5 D5:1.0 C5:0.5 Bb4:1.0 A4:0.5 G4:1.5 D4:0.5 G4:0.5 Bb4:0.5 D5:1.0 C5:0.5 D5:0.5 D#5:0.5 D5:1.5'
    },
    {
        id: 'odin_v_kanoe',
        name: '«У мене немає дому»',
        description: 'Сучасна меланхолійна скрипкова інтерпретація хіта гурту Один в Каное.',
        bpm: 90,
        notes: 'A4:1.0 C5:0.5 B4:0.5 A4:1.0 E4:1.0 A4:1.0 C5:0.5 B4:0.5 A4:1.0 E4:1.0 A4:1.0 C5:0.5 B4:0.5 A4:0.5 B4:0.5 C5:1.0 D5:1.0 E5:2.0'
    }
];

// Physical Modeling of String Resonance and Bow Chiff using Web Audio API
export class ViolinSynthPlayer {
    private ctx: AudioContext | null = null;
    private sourceNodes: { 
        oscs: OscillatorNode[], 
        gains: GainNode[], 
        filters: BiquadFilterNode[],
        noiseSource?: AudioBufferSourceNode
    }[] = [];
    private activeTimers: NodeJS.Timeout[] = [];
    private playProgressCallback: ((noteIndex: number) => void) | null = null;
    private playFinishedCallback: (() => void) | null = null;
    private isCurrentlyPlaying: boolean = false;

    // Room acoustics / tavern delay line
    private reverbInput: GainNode | null = null;
    private delayNodeLeft: DelayNode | null = null;
    private delayNodeRight: DelayNode | null = null;
    private delayFeedbackLeft: GainNode | null = null;
    private delayFeedbackRight: GainNode | null = null;
    private reverbFilter: BiquadFilterNode | null = null;

    constructor() {}

    private initContext() {
        if (!this.ctx) {
            // @ts-ignore
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        // Setup the cross-feedback stereo delay line to recreate tavern wooden ambient space
        if (this.ctx && !this.reverbInput) {
            const ctx = this.ctx;
            this.reverbInput = ctx.createGain();
            this.reverbInput.gain.setValueAtTime(0.28, ctx.currentTime); // wet mix level

            // Short slap delays mimicking wood panel reflection times
            this.delayNodeLeft = ctx.createDelay(1.0);
            this.delayNodeLeft.delayTime.setValueAtTime(0.13, ctx.currentTime);

            this.delayNodeRight = ctx.createDelay(1.0);
            this.delayNodeRight.delayTime.setValueAtTime(0.19, ctx.currentTime);

            // Feedbacks with high-frequency wooden absorption / damping
            this.delayFeedbackLeft = ctx.createGain();
            this.delayFeedbackLeft.gain.setValueAtTime(0.32, ctx.currentTime);

            this.delayFeedbackRight = ctx.createGain();
            this.delayFeedbackRight.gain.setValueAtTime(0.32, ctx.currentTime);

            // Bandpass filter in the feedback path to isolate warm middle-range resonances (300Hz - 2500Hz)
            this.reverbFilter = ctx.createBiquadFilter();
            this.reverbFilter.type = 'bandpass';
            this.reverbFilter.frequency.setValueAtTime(1100, ctx.currentTime);
            this.reverbFilter.Q.setValueAtTime(0.55, ctx.currentTime);

            // Audio Routing with Cross-Feedback (adds stereo depth and body decay)
            this.reverbInput.connect(this.reverbFilter);
            this.reverbFilter.connect(this.delayNodeLeft);
            this.reverbFilter.connect(this.delayNodeRight);

            this.delayNodeLeft.connect(this.delayFeedbackLeft);
            this.delayFeedbackLeft.connect(this.delayNodeRight); // Left feeds into Right
            this.delayNodeLeft.connect(ctx.destination);

            this.delayNodeRight.connect(this.delayFeedbackRight);
            this.delayFeedbackRight.connect(this.delayNodeLeft);  // Right feeds into Left
            this.delayNodeRight.connect(ctx.destination);
        }
    }

    public playMelody(
        notesStr: string,
        bpm: number,
        onProgress?: (noteIndex: number) => void,
        onFinished?: () => void
    ) {
        this.stop();
        this.initContext();
        if (!this.ctx) return;

        const parsedNotes = parseNotes(notesStr, bpm);
        if (parsedNotes.length === 0) return;

        this.isCurrentlyPlaying = true;
        this.playProgressCallback = onProgress || null;
        this.playFinishedCallback = onFinished || null;

        let scheduledTime = this.ctx.currentTime + 0.05; // small offset for smooth start

        parsedNotes.forEach((note, index) => {
            const timeOffsetMs = (scheduledTime - this.ctx!.currentTime) * 1000;

            // Schedule UI callbacks
            const progressTimer = setTimeout(() => {
                if (this.isCurrentlyPlaying && this.playProgressCallback) {
                    this.playProgressCallback(index);
                }
            }, Math.max(0, timeOffsetMs));
            this.activeTimers.push(progressTimer);

            // Schedule the Audio nodes
            this.playSynthNote(note.frequency, scheduledTime, note.duration);
            scheduledTime += note.duration;
        });

        // Schedule playback finished callback
        const finalOffsetMs = (scheduledTime - this.ctx.currentTime) * 1000;
        const finishedTimer = setTimeout(() => {
            this.isCurrentlyPlaying = false;
            if (this.playFinishedCallback) {
                this.playFinishedCallback();
            }
        }, Math.max(0, finalOffsetMs));
        this.activeTimers.push(finishedTimer);
    }

    public playSingleNote(noteName: string, duration: number = 0.6) {
        this.initContext();
        if (!this.ctx) return;
        const frequency = noteToFrequency(noteName);
        if (frequency === 0) return;

        // Play immediate solo note with physical model
        const startTime = this.ctx.currentTime;
        this.playSynthNote(frequency, startTime, duration);
    }

    private playSynthNote(frequency: number, startTime: number, duration: number) {
        if (!this.ctx || frequency === 0) return;

        const ctx = this.ctx;

        // 1. BOW SCRATCH / BOW HAIR TRANSITION (The "Chiff" transient of rosin catching the string)
        const noiseSize = ctx.sampleRate * 0.05; // 50ms noise burst
        const noiseBuffer = ctx.createBuffer(1, noiseSize, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseSize; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(3200, startTime);
        noiseFilter.Q.setValueAtTime(2.2, startTime);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08, startTime); // subtle but vital transient scratch
        noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.045);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.reverbInput || ctx.destination);

        // 2. MAIN COOPERATIVE STRING GENERATORS
        // Primary Sawtooth: rich overtones
        const oscSaw = ctx.createOscillator();
        oscSaw.type = 'sawtooth';

        // Secondary Triangle: body warmth and fundamental reinforcement
        const oscTri = ctx.createOscillator();
        oscTri.type = 'triangle';

        // Pitch articulation: tiny human sliding into pitch (expressive portamento)
        const slideTime = 0.07; // 70ms pitch correction slide
        oscSaw.frequency.setValueAtTime(frequency * 0.985, startTime); // start slightly flat (25 cents)
        oscSaw.frequency.exponentialRampToValueAtTime(frequency, startTime + slideTime);

        // Second oscillator is slightly detuned for string/chorus thickness
        const detuneFactor = 1.0025; // 4 cents sharp
        oscTri.frequency.setValueAtTime(frequency * detuneFactor * 0.985, startTime);
        oscTri.frequency.exponentialRampToValueAtTime(frequency * detuneFactor, startTime + slideTime);

        // 3. EXPRESSIVE DELAYED VIBRATO (Human players don't vibrato immediately; it swells after attack)
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(6.1, startTime); // Sweet 6.1Hz natural hand vibrato speed

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0, startTime);
        lfoGain.gain.setValueAtTime(0, startTime + 0.085); // Straight attack phase
        lfoGain.gain.linearRampToValueAtTime(frequency * 0.007, startTime + 0.25); // Gentle ramp to full vibrato depth

        lfo.connect(lfoGain);
        lfoGain.connect(oscSaw.frequency);
        lfoGain.connect(oscTri.frequency);

        // 4. ACOUSTIC CABINET RESONANCE (FORMANT EQ FILTERS)
        // Eliminates digital synthetic beeps and models the wooden sound box
        
        // Highpass filter to eliminate mud
        const filterHP = ctx.createBiquadFilter();
        filterHP.type = 'highpass';
        filterHP.frequency.setValueAtTime(190, startTime);

        // F1 (Body/Wood resonance peak)
        const filterF1 = ctx.createBiquadFilter();
        filterF1.type = 'peaking';
        filterF1.frequency.setValueAtTime(285, startTime);
        filterF1.Q.setValueAtTime(2.2, startTime);
        filterF1.gain.setValueAtTime(7, startTime);

        // F2 (Anti-harshness scoop)
        const filterF2 = ctx.createBiquadFilter();
        filterF2.type = 'peaking';
        filterF2.frequency.setValueAtTime(950, startTime);
        filterF2.Q.setValueAtTime(1.1, startTime);
        filterF2.gain.setValueAtTime(-5, startTime);

        // F3 (Bridge "singing" peak - critical for sweet violin projection!)
        const filterF3 = ctx.createBiquadFilter();
        filterF3.type = 'peaking';
        filterF3.frequency.setValueAtTime(2700, startTime);
        filterF3.Q.setValueAtTime(2.4, startTime);
        filterF3.gain.setValueAtTime(9, startTime);

        // Lowpass to gently roll off digital bite
        const filterLP = ctx.createBiquadFilter();
        filterLP.type = 'lowpass';
        filterLP.frequency.setValueAtTime(3400, startTime);
        filterLP.Q.setValueAtTime(0.9, startTime);

        // Sub-mix gains
        const gainSaw = ctx.createGain();
        gainSaw.gain.setValueAtTime(0.24, startTime);

        const gainTri = ctx.createGain();
        gainTri.gain.setValueAtTime(0.18, startTime);

        // 5. ENVELOPE (Bowing pressure shape with gentle entry and resonance decay)
        const envGain = ctx.createGain();
        envGain.gain.setValueAtTime(0, startTime);
        
        // Attack: smooth entry as the bow starts to pull (~75ms)
        envGain.gain.linearRampToValueAtTime(0.36, startTime + 0.075);
        // Slight organic volume dip after attack (characteristic of string traction)
        envGain.gain.linearRampToValueAtTime(0.28, startTime + 0.14);
        envGain.gain.linearRampToValueAtTime(0.26, startTime + duration - 0.05);
        // Release: nice ring out decay (~90ms)
        envGain.gain.setValueAtTime(0.26, startTime + duration - 0.05);
        envGain.gain.linearRampToValueAtTime(0, startTime + duration + 0.07);

        // CONNECTIONS
        oscSaw.connect(gainSaw);
        oscTri.connect(gainTri);

        gainSaw.connect(filterHP);
        gainTri.connect(filterHP);

        filterHP.connect(filterF1);
        filterF1.connect(filterF2);
        filterF2.connect(filterF3);
        filterF3.connect(filterLP);
        filterLP.connect(envGain);

        // Send to main output and wet tavern reverberator
        envGain.connect(ctx.destination);
        if (this.reverbInput) {
            envGain.connect(this.reverbInput);
        }

        // START PLAYBACK
        oscSaw.start(startTime);
        oscTri.start(startTime);
        lfo.start(startTime);
        noiseNode.start(startTime);

        // STOP AND CLEAN UP
        const finalStopTime = startTime + duration + 0.08;
        oscSaw.stop(finalStopTime);
        oscTri.stop(finalStopTime);
        lfo.stop(finalStopTime);
        noiseNode.stop(finalStopTime);

        // Auto-cleanup and disconnect when note playback completes naturally
        const noteNodeGroup = {
            oscs: [oscSaw, oscTri, lfo],
            gains: [gainSaw, gainTri, lfoGain, envGain, noiseGain],
            filters: [filterHP, filterF1, filterF2, filterF3, filterLP, noiseFilter],
            noiseSource: noiseNode
        };

        const cleanupNote = () => {
            try {
                noteNodeGroup.oscs.forEach(o => { try { o.disconnect(); } catch (e) {} });
                if (noteNodeGroup.noiseSource) { try { noteNodeGroup.noiseSource.disconnect(); } catch (e) {} }
                noteNodeGroup.gains.forEach(g => { try { g.disconnect(); } catch (e) {} });
                noteNodeGroup.filters.forEach(f => { try { f.disconnect(); } catch (e) {} });
            } catch (e) {}
            const idx = this.sourceNodes.indexOf(noteNodeGroup);
            if (idx !== -1) {
                this.sourceNodes.splice(idx, 1);
            }
        };

        oscSaw.onended = cleanupNote;

        // Save active references to allow immediate stops
        this.sourceNodes.push(noteNodeGroup);
    }

    public stop() {
        this.isCurrentlyPlaying = false;
        
        // Clear all timers
        this.activeTimers.forEach(t => clearTimeout(t));
        this.activeTimers = [];

        // Stop and disconnect all active audio nodes
        this.sourceNodes.forEach(nodes => {
            nodes.oscs.forEach(osc => {
                try {
                    osc.stop();
                } catch (e) {}
                try {
                    osc.disconnect();
                } catch (e) {}
            });
            if (nodes.noiseSource) {
                try {
                    nodes.noiseSource.stop();
                } catch (e) {}
                try {
                    nodes.noiseSource.disconnect();
                } catch (e) {}
            }
            nodes.gains.forEach(g => {
                try {
                    g.disconnect();
                } catch (e) {}
            });
            nodes.filters.forEach(f => {
                try {
                    f.disconnect();
                } catch (e) {}
            });
        });
        this.sourceNodes = [];
    }

    public dispose() {
        this.stop();
        try {
            if (this.reverbInput) this.reverbInput.disconnect();
            if (this.delayNodeLeft) this.delayNodeLeft.disconnect();
            if (this.delayNodeRight) this.delayNodeRight.disconnect();
            if (this.delayFeedbackLeft) this.delayFeedbackLeft.disconnect();
            if (this.delayFeedbackRight) this.delayFeedbackRight.disconnect();
            if (this.reverbFilter) this.reverbFilter.disconnect();
        } catch (e) {}
    }

    public isPlaying(): boolean {
        return this.isCurrentlyPlaying;
    }
}
