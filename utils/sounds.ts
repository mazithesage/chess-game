// Chess game sound effects using Web Audio API

class ChessSounds {
  private audioContext: AudioContext | null = null;

  constructor() {
    // Initialize audio context only in browser
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  private playChord(frequencies: number[], duration: number, type: OscillatorType = 'sine', volume: number = 0.2) {
    frequencies.forEach(freq => {
      this.playTone(freq, duration, type, volume);
    });
  }

  // Sound for a regular piece move
  playMove() {
    if (!this.audioContext) return;

    // Two quick tones for a "click" sound
    this.playTone(800, 0.05, 'square', 0.15);
    setTimeout(() => {
      this.playTone(600, 0.05, 'square', 0.1);
    }, 30);
  }

  // Sound for capturing a piece
  playCapture() {
    if (!this.audioContext) return;

    // More dramatic multi-tone sound
    this.playTone(400, 0.1, 'sawtooth', 0.25);
    setTimeout(() => {
      this.playTone(300, 0.08, 'sawtooth', 0.2);
    }, 40);
    setTimeout(() => {
      this.playTone(200, 0.15, 'sawtooth', 0.15);
    }, 80);
  }

  // Sound for check
  playCheck() {
    if (!this.audioContext) return;

    // Alert-like ascending tones
    this.playTone(600, 0.1, 'triangle', 0.25);
    setTimeout(() => {
      this.playTone(800, 0.1, 'triangle', 0.25);
    }, 80);
    setTimeout(() => {
      this.playTone(1000, 0.15, 'triangle', 0.25);
    }, 160);
  }

  // Sound for game start/reset
  playGameStart() {
    if (!this.audioContext) return;

    // Pleasant ascending chord
    const chord1 = [262, 330, 392]; // C major chord
    this.playChord(chord1, 0.3, 'sine', 0.15);

    setTimeout(() => {
      const chord2 = [392, 494, 587]; // G major chord
      this.playChord(chord2, 0.4, 'sine', 0.12);
    }, 200);
  }

  // Sound for selecting a piece
  playSelect() {
    if (!this.audioContext) return;

    this.playTone(1000, 0.08, 'sine', 0.2);
  }

  // Sound for deselecting a piece
  playDeselect() {
    if (!this.audioContext) return;

    this.playTone(800, 0.08, 'sine', 0.15);
  }

  // Sound for invalid move attempt
  playInvalid() {
    if (!this.audioContext) return;

    // Low, short buzz
    this.playTone(200, 0.1, 'sawtooth', 0.2);
  }

  // Sound for checkmate
  playCheckmate() {
    if (!this.audioContext) return;

    // Dramatic descending sequence
    this.playTone(800, 0.15, 'triangle', 0.25);
    setTimeout(() => {
      this.playTone(700, 0.15, 'triangle', 0.25);
    }, 100);
    setTimeout(() => {
      this.playTone(600, 0.15, 'triangle', 0.25);
    }, 200);
    setTimeout(() => {
      this.playTone(400, 0.3, 'sine', 0.3);
    }, 300);
  }

  // Sound for castling
  playCastle() {
    if (!this.audioContext) return;

    // Two simultaneous moves sound
    this.playTone(700, 0.08, 'square', 0.18);
    this.playTone(900, 0.08, 'square', 0.18);
    setTimeout(() => {
      this.playTone(650, 0.08, 'square', 0.15);
      this.playTone(850, 0.08, 'square', 0.15);
    }, 60);
  }
}

// Create a singleton instance
let soundsInstance: ChessSounds | null = null;

export const getSounds = (): ChessSounds => {
  if (!soundsInstance) {
    soundsInstance = new ChessSounds();
  }
  return soundsInstance;
};

export default ChessSounds;
