import android.content.Context;
import android.app.ActivityManager;
import android.util.DisplayMetrics;

import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import org.json.JSONObject;

@CapacitorPlugin(name = "CapacitorRealm")
public class CapacitorRealm extends Plugin {

    @PluginMethod
    public void bulkDocs(final PluginCall call) {
        try {

            Context context = getContext();
            ActivityManager actManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo memInfo = new ActivityManager.MemoryInfo();
            DisplayMetrics displayMetrics = context.getResources().getDisplayMetrics();

            assert actManager != null;
            actManager.getMemoryInfo(memInfo);
            long totalMemory = memInfo.totalMem;

            JSObject result = new JSObject();

            result.put("physicalMemory", totalMemory);
            result.put("screenHeight", displayMetrics.heightPixels);
            result.put("screenWidth", displayMetrics.widthPixels);
            result.put("screenScale", displayMetrics.density);

            call.resolve(result);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
}