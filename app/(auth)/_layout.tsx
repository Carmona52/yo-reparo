import { Stack } from 'expo-router';
import ForgotPassword from "@/app/(auth)/forgot-password";

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#fff' },
                animation: 'fade',
            }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />
        </Stack>
    );
}