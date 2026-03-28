import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import {Platform} from 'react-native';
import {supabase} from '@/libs/supabase';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0a7ea4',
        });
    }



    const {status: existingStatus} = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const {status} = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        console.log('Fallo al obtener el permiso para notificaciones push.');
        return;
    }

    const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
        console.error('No se encontró el projectId. Asegúrate de tener configurado EAS.');
        return;
    }

    try {
        token = (await Notifications.getExpoPushTokenAsync({projectId})).data;
        console.log('Expo Push Token obtenido:', token);
    } catch (e) {
        console.log('Error obteniendo el token:', e);
        return;
    }

    console.log('este es tu token: ', token)

    if (token) {
        const {data: {user}, error: userError} = await supabase.auth.getUser();
        if (userError) {
            console.error('Error obteniendo el usuario:', userError);
            return;
        }
        if (user) {
            const {error} = await supabase
                .from('profiles')
                .update({expo_token: token})
                .eq('id', user.id);

            if (error) {
                console.error('Error guardando el token en Supabase:', error);
            } else {
                console.log('Token guardado exitosamente para el usuario:', user.id);
            }
        } else {
            console.log('No hay usuario autenticado, no se guarda el token.');
        }
    }

    return token;
}