import {Tabs} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';

export default function OwnerLayout() {
    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#8e8e93',
            tabBarStyle: {
                borderTopWidth: 0,
                elevation: 0,
                shadowOpacity: 0,
            }
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color}/>
                    ),
                }}/>

            <Tabs.Screen
                name="cotizaciones/index"
                options={{
                    title: 'Cotizaciones',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "document-text" : "document-text-outline"} size={24} color={color} />
                    ),
                }} />

            <Tabs.Screen
                name="perfil/index"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color}/>
                    ),
                }}/>


            {/* Pantallas ocultas del Tab Bar */}
            <Tabs.Screen
                name="cotizaciones/[id]"
                options={{
                    href: null,
                }} />

        </Tabs>
    );
}