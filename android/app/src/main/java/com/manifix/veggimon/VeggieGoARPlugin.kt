package com.manifix.veggiego;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.manifixai.veggiego.ar.VeggieGoARPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VeggieGoARPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
