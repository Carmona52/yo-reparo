import {SafeAreaView} from "react-native-safe-area-context";
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";

export default function JobsWorkerScreen(){
    return(
        <SafeAreaView style={{flex: 1}}>
            <ThemedView>
                <ThemedText>Pantalla de trabajos</ThemedText>
            </ThemedView>
        </SafeAreaView>
    )
}