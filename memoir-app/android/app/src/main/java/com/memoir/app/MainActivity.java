package com.memoir.app;

import com.getcapacitor.BridgeActivity;
import com.memoir.aliyunspeech.AliyunSpeechPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(AliyunSpeechPlugin.class);
    }
}
