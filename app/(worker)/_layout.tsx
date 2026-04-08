import {Tabs} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';

export default function OwnerLayout() {
    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#0a7ea4',
            tabBarInactiveTintColor: '#8e8e93',
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
                name="jobs"
                options={{
                    title: 'Trabajos',
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={24} color={color}/>
                    ),
                }}/>


            <Tabs.Screen
                name='contactos'
                options={{
                    title: "Contactos",
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons name={focused ? "call" : "call-outline"} size={24} color={color}/>
                    )
                }}/>

            <Tabs.Screen
                name="perfil"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color}/>
                    ),
                }}/>

        </Tabs>
    );
}