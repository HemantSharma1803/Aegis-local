import {
  SpeechToTextProvider,
  SpeechToTextEvents,
  SpeechRecognitionResultPayload,
} from '../../types/voice';

export class BrowserSpeechProvider implements SpeechToTextProvider {
  id = 'browser-speech';
  name = 'Browser Speech Recognition';
  description = 'Hardware-linked Web Speech API (Chromium / Safari) for real-time speech-to-text';

  private recognition: any = null;
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private animFrameId: number | null = null;
  private listening: boolean = false;
  private accumulatedFinalTranscript: string = '';

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return Boolean(SpeechRecognition && navigator.mediaDevices?.getUserMedia);
  }

  getUnavailabilityReason(): string {
    if (typeof window === 'undefined') return 'Running outside of browser runtime.';
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return 'Web Speech API is not available in this browser. Use Google Chrome, Microsoft Edge, or Safari for native voice transcription, or type your response manually.';
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      return 'Microphone capture interface (getUserMedia) is not available or blocked in this iframe.';
    }
    return '';
  }

  isListening(): boolean {
    return this.listening;
  }

  async start(events: SpeechToTextEvents): Promise<void> {
    if (this.listening) {
      this.abort();
    }

    if (!this.isSupported()) {
      const reason = this.getUnavailabilityReason();
      events.onError({
        code: 'unsupported',
        message: reason,
      });
      throw new Error(reason);
    }

    // 1. Explicitly prompt and request microphone permission first
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err: any) {
      const isDenied =
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.message?.toLowerCase().includes('denied');

      const message = isDenied
        ? 'Microphone permission was denied. Please grant microphone access in your browser address bar to use voice transcription, or enter your response manually.'
        : `Could not access microphone: ${err.message || 'Device error'}`;

      events.onError({
        code: isDenied ? 'permission-denied' : 'hardware-error',
        message,
        originalError: err,
      });
      throw new Error(message);
    }

    // 2. Setup Audio Visualizer / Level meter if supported
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && this.audioStream) {
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let lastMeterTime = 0;

        const checkAudioLevel = (timestamp: number) => {
          if (!this.listening) return;
          if (timestamp - lastMeterTime >= 50) {
            lastMeterTime = timestamp;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const avg = sum / bufferLength;
            const normalized = Math.min(1, Math.max(0, avg / 128));
            if (events.onAudioLevel) {
              events.onAudioLevel(normalized);
            }
          }
          this.animFrameId = requestAnimationFrame(checkAudioLevel);
        };
        this.animFrameId = requestAnimationFrame(checkAudioLevel);
      }
    } catch (audioErr) {
      console.warn('[BrowserSpeechProvider] AudioContext visualization setup warning:', audioErr);
    }

    // 3. Setup Web Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.accumulatedFinalTranscript = '';

    this.recognition.onstart = () => {
      this.listening = true;
      events.onStart();
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const transcriptPart = item[0].transcript;
        if (item.isFinal) {
          this.accumulatedFinalTranscript += (this.accumulatedFinalTranscript ? ' ' : '') + transcriptPart.trim();
        } else {
          interim += transcriptPart;
        }
      }

      const fullTranscript = (this.accumulatedFinalTranscript + (interim ? ' ' + interim : '')).trim();

      events.onResult({
        transcript: fullTranscript,
        isFinal: false,
      });
    };

    this.recognition.onerror = (event: any) => {
      console.warn('[BrowserSpeechProvider] Recognition error event:', event.error);
      if (event.error === 'no-speech') {
        // Benign: user was silent
        return;
      }
      if (event.error === 'not-allowed') {
        events.onError({
          code: 'permission-denied',
          message: 'Microphone permission was denied or revoked.',
          originalError: event,
        });
        this.stop();
        return;
      }
      events.onError({
        code: event.error,
        message: `Speech recognition error: ${event.error}`,
        originalError: event,
      });
    };

    this.recognition.onend = () => {
      this.cleanupMedia();
      this.listening = false;
      events.onEnd();
    };

    try {
      this.recognition.start();
    } catch (err: any) {
      this.cleanupMedia();
      this.listening = false;
      events.onError({
        code: 'start-failed',
        message: `Failed to initialize speech recognition: ${err.message}`,
        originalError: err,
      });
      throw err;
    }
  }

  async stop(): Promise<void> {
    this.listening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {
        // Ignore stop errors if already stopped
      }
    }
    this.cleanupMedia();
  }

  abort(): void {
    this.listening = false;
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (err) {
        // Ignore
      }
      this.recognition = null;
    }
    this.cleanupMedia();
  }

  private cleanupMedia(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (err) {
        // Ignore
      }
      this.audioContext = null;
    }
  }
}
