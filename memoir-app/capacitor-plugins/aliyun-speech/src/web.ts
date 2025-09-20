import { WebPlugin } from '@capacitor/core';
import type { AliyunSpeechPlugin, InitializeOptions, StartRecordingOptions, PermissionResult, PartialResult, FinalResult, SpeechError } from './definitions';

export class AliyunSpeechWeb extends WebPlugin implements AliyunSpeechPlugin {
  async initialize(options: InitializeOptions): Promise<void> {
    console.log('Web端不支持阿里云语音识别，请使用移动端');
    throw new Error('Web端不支持阿里云语音识别');
  }

  async startRecording(options: StartRecordingOptions): Promise<void> {
    console.log('Web端不支持阿里云语音识别，请使用移动端');
    throw new Error('Web端不支持阿里云语音识别');
  }

  async stopRecording(): Promise<void> {
    console.log('Web端不支持阿里云语音识别，请使用移动端');
    throw new Error('Web端不支持阿里云语音识别');
  }

  async checkPermission(): Promise<PermissionResult> {
    return {
      granted: false,
      denied: false,
      neverAsked: true
    };
  }

  async requestPermission(): Promise<PermissionResult> {
    return {
      granted: false,
      denied: true,
      neverAsked: false
    };
  }
}
