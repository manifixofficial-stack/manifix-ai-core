package com.manifix.veggimon;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.manifix.veggimon.VeggieGoARPlugin; // 1. Import your new vegetable AR plugin

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VeggieGoARPlugin.class); // 2. Register the plugin here
        super.onCreate(savedInstanceState);
    }
}
