export interface TTSOptions {
  voice?: 'lorenzo' | 'catalina';
  rate?: number; // 0.5 to 2.0
  pitch?: number; // 0 to 2
  volume?: number; // 0 to 1
  style?: 'entusiasta' | 'formal' | 'neutral';
}

export class ChileanTTS {
  private static instance: ChileanTTS;
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;

  constructor() {
    this.initializeVoices();
  }

  static getInstance(): ChileanTTS {
    if (!ChileanTTS.instance) {
      ChileanTTS.instance = new ChileanTTS();
    }
    return ChileanTTS.instance;
  }

  private async initializeVoices(): Promise<void> {
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    // Wait for voices to be loaded
    return new Promise((resolve) => {
      const loadVoices = () => {
        this.voices = window.speechSynthesis.getVoices();
        this.isInitialized = true;
        resolve();
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        loadVoices();
      } else {
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true });
      }
    });
  }

  private findChileanVoice(preferredVoice?: 'lorenzo' | 'catalina'): SpeechSynthesisVoice | null {
    if (!this.isInitialized) {
      return null;
    }

    // Try to find Chilean Spanish voices
    const chileanVoices = this.voices.filter(voice => 
      voice.lang.includes('es-CL') || 
      voice.lang.includes('es-419') ||
      voice.name.toLowerCase().includes('chile') ||
      voice.name.toLowerCase().includes('lorenzo') ||
      voice.name.toLowerCase().includes('catalina')
    );

    if (chileanVoices.length > 0) {
      if (preferredVoice === 'lorenzo') {
        const maleVoice = chileanVoices.find(voice => 
          voice.name.toLowerCase().includes('lorenzo') ||
          voice.name.toLowerCase().includes('male') ||
          voice.name.toLowerCase().includes('masculino')
        );
        if (maleVoice) return maleVoice;
      }

      if (preferredVoice === 'catalina') {
        const femaleVoice = chileanVoices.find(voice => 
          voice.name.toLowerCase().includes('catalina') ||
          voice.name.toLowerCase().includes('female') ||
          voice.name.toLowerCase().includes('femenino')
        );
        if (femaleVoice) return femaleVoice;
      }

      return chileanVoices[0];
    }

    // Fallback to any Spanish voice
    const spanishVoices = this.voices.filter(voice => voice.lang.startsWith('es'));
    if (spanishVoices.length > 0) {
      return spanishVoices[0];
    }

    // Last resort: use default voice
    return this.voices[0] || null;
  }

  static async speak(text: string, options: TTSOptions = {}): Promise<void> {
    const instance = ChileanTTS.getInstance();
    
    if (!instance.isInitialized) {
      await instance.initializeVoices();
    }

    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not available'));
        return;
      }

      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Find appropriate voice
      const voice = instance.findChileanVoice(options.voice);
      if (voice) {
        utterance.voice = voice;
      }

      // Set language to Chilean Spanish
      utterance.lang = 'es-CL';
      
      // Apply options
      utterance.rate = this.adjustRateForStyle(options.rate || 1, options.style);
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;

      // Add emotional inflection based on style
      if (options.style === 'entusiasta') {
        utterance.pitch = Math.min(utterance.pitch * 1.2, 2);
        utterance.rate = Math.min(utterance.rate * 1.1, 2);
      } else if (options.style === 'formal') {
        utterance.pitch = Math.max(utterance.pitch * 0.9, 0);
        utterance.rate = Math.max(utterance.rate * 0.9, 0.5);
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`TTS Error: ${event.error}`));

      try {
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        reject(error);
      }
    });
  }

  private static adjustRateForStyle(baseRate: number, style?: string): number {
    switch (style) {
      case 'entusiasta':
        return Math.min(baseRate * 1.1, 2);
      case 'formal':
        return Math.max(baseRate * 0.9, 0.5);
      default:
        return baseRate;
    }
  }

  static stop(): void {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  static getAvailableVoices(): SpeechSynthesisVoice[] {
    const instance = ChileanTTS.getInstance();
    return instance.voices;
  }

  static isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  static getChileanVoices(): { id: string; name: string; gender: 'male' | 'female' }[] {
    const instance = ChileanTTS.getInstance();
    const chileanVoices = instance.voices.filter(voice => 
      voice.lang.includes('es-CL') || 
      voice.lang.includes('es-419') ||
      voice.name.toLowerCase().includes('chile')
    );

    return chileanVoices.map(voice => ({
      id: voice.name,
      name: voice.name,
      gender: voice.name.toLowerCase().includes('female') || 
              voice.name.toLowerCase().includes('catalina') ? 'female' : 'male'
    }));
  }

  // Preload announcement phrases for better performance
  static preloadPhrases(): void {
    const commonPhrases = [
      "Señoras y señores, estamos jugando",
      "Tenemos bingo ganador",
      "Tenemos binguito ganado",
      "La mesa pide",
      "Siguiente número"
    ];

    commonPhrases.forEach(phrase => {
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.volume = 0; // Silent preload
      if (window.speechSynthesis) {
        window.speechSynthesis.speak(utterance);
        window.speechSynthesis.cancel(); // Cancel immediately after loading
      }
    });
  }
}

// Initialize TTS when module loads
if (typeof window !== 'undefined') {
  // Preload voices and phrases after a short delay
  setTimeout(() => {
    ChileanTTS.getInstance();
    ChileanTTS.preloadPhrases();
  }, 1000);
}
