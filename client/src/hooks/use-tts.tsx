import { useCallback } from "react";
import { ChileanTTS, type TTSOptions } from "@/lib/tts";

export function useTTS() {
  const speak = useCallback(async (text: string, options?: TTSOptions) => {
    try {
      await ChileanTTS.speak(text, options);
    } catch (error) {
      console.error("TTS Error:", error);
      // Fallback to browser's default TTS if Chilean voices fail
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-CL';
        utterance.rate = options?.rate || 1;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, []);

  const stop = useCallback(() => {
    ChileanTTS.stop();
  }, []);

  const getAvailableVoices = useCallback(() => {
    return ChileanTTS.getAvailableVoices();
  }, []);

  const isSupported = useCallback(() => {
    return ChileanTTS.isSupported();
  }, []);

  return {
    speak,
    stop,
    getAvailableVoices,
    isSupported
  };
}
