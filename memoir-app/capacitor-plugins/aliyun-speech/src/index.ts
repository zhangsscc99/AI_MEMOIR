import { registerPlugin } from '@capacitor/core';
import type { AliyunSpeechPlugin } from './definitions';

const AliyunSpeech = registerPlugin<AliyunSpeechPlugin>('AliyunSpeech', {
  web: () => import('./web').then(m => new m.AliyunSpeechWeb()),
});

export * from './definitions';
export { AliyunSpeech };
