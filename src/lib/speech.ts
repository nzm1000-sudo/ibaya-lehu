import * as Speech from 'expo-speech';
import { useCallback, useEffect, useState } from 'react';

/** Read-aloud with a neutral synthetic Hebrew voice; one utterance at a time per hook. */
export function useSpeech() {
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);

  useEffect(() => () => void Speech.stop(), []);

  const toggle = useCallback(
    async (key: string, text: string) => {
      await Speech.stop();
      if (speakingKey === key) {
        setSpeakingKey(null);
        return;
      }
      let voice: string | undefined;
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        voice = voices.find((v) => v.language?.toLowerCase().startsWith('he'))?.identifier;
      } catch {}
      setSpeakingKey(key);
      const done = () => setSpeakingKey((k) => (k === key ? null : k));
      Speech.speak(text, { language: 'he-IL', voice, rate: 0.95, onDone: done, onStopped: done, onError: done });
    },
    [speakingKey],
  );

  return { speakingKey, toggle };
}
