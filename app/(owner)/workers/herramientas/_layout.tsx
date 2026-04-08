import { Stack } from 'expo-router';
export default function WorkersHerramientasLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="[id]" />
        </Stack>
    );
}