import {SafeAreaView} from "react-native-safe-area-context";
import {ThemedText} from "@/components/themed-text";
import {ThemedView} from "@/components/themed-view";

export default function IndexWorker() {
    return (
        <SafeAreaView style={{flex: 1}}>
            <ThemedView>
                <ThemedText>Index de Worker</ThemedText>
            </ThemedView>
        </SafeAreaView>
    )
}