import { PlaybackPlugin, type PluginViewProps } from "mo-sdk";
import { GazePointView } from "./components/GazepointView";
import { GazePointPreview } from "./components/GazepointPreview";

export default class GazePointPlayback extends PlaybackPlugin {
    
    getView(props: PluginViewProps) {
        return <GazePointView {...props} />;
    }

    getPreview(){
        return <GazePointPreview />;
    }
    
    validExtensions(){
        return ["txt", "raw"]; 
    }

    validateCaptureDescriptor( descriptor: Record<string, unknown> | null ): boolean {
        if (!descriptor){
            return false;
        } 

        if (descriptor.format === "gaze_data") {
            return true;
        }
        try {
            if (descriptor.properties) {
                 const properties = descriptor.properties as Record<string, unknown>;
                 if (properties.timestamp) return true;
            }
        } catch (e) {
            return false;
        }

        return false;
    }
}