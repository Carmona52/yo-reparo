import { Stack } from 'expo-router';

export default function HerramientasLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="page" />
        </Stack>
    );
}