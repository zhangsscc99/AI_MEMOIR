package com.memoir.app;

import com.getcapacitor.BridgeActivity;
import com.memoir.aliyunspeech.AliyunSpeechPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 注册阿里云语音插件
        registerPlugin(AliyunSpeechPlugin.class);
        
        // 调试：检查插件是否注册成功
        System.out.println("🔧 阿里云插件注册完成");
    }
}
