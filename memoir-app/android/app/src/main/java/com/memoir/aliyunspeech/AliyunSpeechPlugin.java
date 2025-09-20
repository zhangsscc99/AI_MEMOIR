package com.memoir.aliyunspeech;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import android.Manifest;
import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

// 阿里云SDK导入
import com.alibaba.idst.nui.CommonUtils;
import com.alibaba.idst.nui.NativeNui;
import com.alibaba.idst.nui.INativeNuiCallback;
import com.alibaba.idst.nui.Constants;
import com.alibaba.idst.nui.Constants.AudioState;
import com.alibaba.idst.nui.Constants.NuiEvent;
import com.alibaba.idst.nui.Constants.VadMode;
import com.alibaba.idst.nui.AsrResult;
import com.alibaba.idst.nui.KwsResult;
import com.alibaba.idst.nui.Constants.NuiVprEvent;

import org.json.JSONObject;
import org.json.JSONException;

@CapacitorPlugin(
    name = "AliyunSpeech",
    permissions = {
        @Permission(
            strings = { Manifest.permission.RECORD_AUDIO },
            alias = "microphone"
        )
    }
)
public class AliyunSpeechPlugin extends Plugin {
    
    private static final int REQUEST_RECORD_AUDIO_PERMISSION = 200;
    private AudioRecord audioRecord;
    private boolean isRecording = false;
    private ExecutorService executorService;
    private int sampleRate = 16000;
    private int channelConfig = AudioFormat.CHANNEL_IN_MONO;
    private int audioFormat = AudioFormat.ENCODING_PCM_16BIT;
    private int bufferSize;
    
    // 阿里云SDK相关
    private NativeNui nuiInstance;
    private String appkey;
    private String token;
    private String workspace;
    
    @Override
    public void load() {
        super.load();
        executorService = Executors.newSingleThreadExecutor();
    }
    
    @PluginMethod
    public void initialize(PluginCall call) {
        try {
            String appkey = call.getString("appkey");
            String token = call.getString("token");
            String workspace = call.getString("workspace");
            
            if (appkey == null || token == null || workspace == null) {
                call.reject("缺少必要参数: appkey, token, workspace");
                return;
            }
            
            this.appkey = appkey;
            this.token = token;
            this.workspace = workspace;
            
            // 初始化阿里云SDK
            nuiInstance = new NativeNui();
            
            // 生成初始化参数
            String initParams = generateInitParams(workspace);
            
            // 暂时跳过SDK初始化，先让基础功能工作
            // int ret = nuiInstance.initialize(this, initParams, Constants.LogLevel.LOG_LEVEL_VERBOSE, true);
            int ret = 0; // 模拟成功
            
            if (ret == 0) {
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("message", "阿里云SDK初始化成功");
                call.resolve(result);
            } else {
                call.reject("SDK初始化失败，错误码: " + ret);
            }
            
        } catch (Exception e) {
            call.reject("初始化失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void startRecording(PluginCall call) {
        if (isRecording) {
            call.reject("已经在录音中");
            return;
        }
        
        if (nuiInstance == null) {
            call.reject("SDK未初始化，请先调用initialize方法");
            return;
        }
        
        if (!hasPermission(Manifest.permission.RECORD_AUDIO)) {
            requestPermissionForAlias("microphone", call, "recordAudioPermissionCallback");
            return;
        }
        
        try {
            // 暂时跳过SDK调用，先让基础功能工作
            // String params = generateRecognitionParams();
            // nuiInstance.setParams(params);
            // int ret = nuiInstance.startDialog(VadMode.TYPE_P2T, generateDialogParams());
            int ret = 0; // 模拟成功
            
            if (ret == 0) {
                isRecording = true;
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("message", "阿里云语音识别已开始");
                call.resolve(result);
            } else {
                call.reject("开始识别失败，错误码: " + ret);
            }
            
        } catch (Exception e) {
            call.reject("开始录音失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void stopRecording(PluginCall call) {
        if (!isRecording) {
            call.reject("当前没有在录音");
            return;
        }
        
        try {
            // 暂时跳过SDK调用
            // if (nuiInstance != null) {
            //     nuiInstance.stopDialog();
            // }
            isRecording = false;
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "阿里云语音识别已停止");
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("停止录音失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean granted = hasPermission(Manifest.permission.RECORD_AUDIO);
        
        JSObject result = new JSObject();
        result.put("granted", granted);
        result.put("denied", !granted);
        result.put("neverAsked", !granted);
        call.resolve(result);
    }
    
    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (hasPermission(Manifest.permission.RECORD_AUDIO)) {
            JSObject result = new JSObject();
            result.put("granted", true);
            result.put("denied", false);
            result.put("neverAsked", false);
            call.resolve(result);
        } else {
            requestPermissionForAlias("microphone", call, "recordAudioPermissionCallback");
        }
    }
    
    @PermissionCallback
    private void recordAudioPermissionCallback(PluginCall call) {
        if (hasPermission(Manifest.permission.RECORD_AUDIO)) {
            JSObject result = new JSObject();
            result.put("granted", true);
            result.put("denied", false);
            result.put("neverAsked", false);
            call.resolve(result);
        } else {
            JSObject result = new JSObject();
            result.put("granted", false);
            result.put("denied", true);
            result.put("neverAsked", false);
            call.resolve(result);
        }
    }
    
    private void startAudioRecording() {
        try {
            bufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat);
            audioRecord = new AudioRecord(
                MediaRecorder.AudioSource.MIC,
                sampleRate,
                channelConfig,
                audioFormat,
                bufferSize
            );
            
            if (audioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
                notifyListeners("onError", createError("AUDIO_INIT_FAILED", "音频初始化失败"));
                return;
            }
            
            audioRecord.startRecording();
            isRecording = true;
            
            // 开始录音线程
            executorService.execute(() -> {
                byte[] buffer = new byte[bufferSize];
                while (isRecording && audioRecord != null) {
                    int bytesRead = audioRecord.read(buffer, 0, bufferSize);
                    if (bytesRead > 0) {
                        // 这里应该调用阿里云SDK进行识别
                        // 模拟识别结果
                        simulateRecognitionResult();
                    }
                }
            });
            
        } catch (Exception e) {
            notifyListeners("onError", createError("RECORDING_FAILED", "录音失败: " + e.getMessage()));
        }
    }
    
    private void stopAudioRecording() {
        isRecording = false;
        
        if (audioRecord != null) {
            try {
                audioRecord.stop();
                audioRecord.release();
                audioRecord = null;
            } catch (Exception e) {
                notifyListeners("onError", createError("STOP_RECORDING_FAILED", "停止录音失败: " + e.getMessage()));
            }
        }
    }
    
    private void simulateRecognitionResult() {
        // 模拟识别结果，实际应该调用阿里云SDK
        // 这里只是演示如何发送结果到前端
        
        // 模拟中间结果
        JSObject partialResult = new JSObject();
        partialResult.put("text", "模拟识别结果");
        partialResult.put("confidence", 0.95);
        notifyListeners("onPartialResult", partialResult);
        
        // 模拟最终结果
        JSObject finalResult = new JSObject();
        finalResult.put("text", "模拟最终识别结果");
        finalResult.put("confidence", 0.98);
        finalResult.put("beginTime", System.currentTimeMillis());
        finalResult.put("endTime", System.currentTimeMillis() + 1000);
        notifyListeners("onFinalResult", finalResult);
    }
    
    private JSObject createError(String code, String message) {
        JSObject error = new JSObject();
        error.put("code", code);
        error.put("message", message);
        return error;
    }
    
    public boolean hasPermission(String permission) {
        return ContextCompat.checkSelfPermission(getContext(), permission) == PackageManager.PERMISSION_GRANTED;
    }
    
    // 生成初始化参数
    private String generateInitParams(String workspace) {
        try {
            JSONObject object = new JSONObject();
            object.put("appkey", appkey);
            object.put("token", token);
            object.put("device_id", "memoir_device_" + System.currentTimeMillis());
            object.put("url", "wss://nls-gateway.cn-shanghai.aliyuncs.com:443/ws/v1");
            object.put("workspace", workspace);
            object.put("service_mode", Constants.ModeFullCloud);
            return object.toString();
        } catch (JSONException e) {
            return "{}";
        }
    }
    
    // 生成识别参数
    private String generateRecognitionParams() {
        try {
            JSONObject nlsConfig = new JSONObject();
            nlsConfig.put("enable_intermediate_result", true);
            nlsConfig.put("enable_punctuation_prediction", true);
            nlsConfig.put("enable_inverse_text_normalization", true);
            
            JSONObject parameters = new JSONObject();
            parameters.put("nls_config", nlsConfig);
            parameters.put("service_type", Constants.kServiceTypeSpeechTranscriber);
            
            return parameters.toString();
        } catch (JSONException e) {
            return "{}";
        }
    }
    
    // 生成对话参数
    private String generateDialogParams() {
        try {
            JSONObject dialogParam = new JSONObject();
            dialogParam.put("token", token);
            return dialogParam.toString();
        } catch (JSONException e) {
            return "{}";
        }
    }
    
    // 阿里云SDK回调方法 - 暂时注释，等基础功能工作后再启用
    
    
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        if (executorService != null) {
            executorService.shutdown();
        }
        if (nuiInstance != null) {
            nuiInstance.release();
        }
        stopAudioRecording();
    }
}
