import type { PluginListenerHandle } from '@capacitor/core';

export interface AliyunSpeechPlugin {
  /**
   * 初始化阿里云语音识别
   */
  initialize(options: InitializeOptions): Promise<void>;

  /**
   * 开始录音和识别
   */
  startRecording(options: StartRecordingOptions): Promise<void>;

  /**
   * 停止录音和识别
   */
  stopRecording(): Promise<void>;

  /**
   * 检查录音权限
   */
  checkPermission(): Promise<PermissionResult>;

  /**
   * 请求录音权限
   */
  requestPermission(): Promise<PermissionResult>;

  /**
   * 监听识别结果
   */
  addListener(
    eventName: 'onPartialResult',
    listenerFunc: (result: PartialResult) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;

  addListener(
    eventName: 'onFinalResult',
    listenerFunc: (result: FinalResult) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;

  addListener(
    eventName: 'onError',
    listenerFunc: (error: SpeechError) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;

  /**
   * 移除所有监听器
   */
  removeAllListeners(): Promise<void>;
}

export interface InitializeOptions {
  appkey: string;
  token: string;
  workspace: string;
}

export interface StartRecordingOptions {
  sampleRate?: number;
  format?: string;
  enableIntermediateResult?: boolean;
  enablePunctuationPrediction?: boolean;
  enableInverseTextNormalization?: boolean;
}

export interface PermissionResult {
  granted: boolean;
  denied: boolean;
  neverAsked: boolean;
}

export interface PartialResult {
  text: string;
  confidence: number;
}

export interface FinalResult {
  text: string;
  confidence: number;
  beginTime: number;
  endTime: number;
}

export interface SpeechError {
  code: string;
  message: string;
}
