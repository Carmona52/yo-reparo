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
                name="jobs/index"
                options={{
                    title: 'Trabajos',
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={24} color={color}/>
                    ),
                }}/>
            <Tabs.Screen
                name="cotizaciones/index"
                options={{
                    title: 'Cotizaciones',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "document-text" : "document-text-outline"} size={24} color={color} />
                    ),
                }}/>

            <Tabs.Screen
                name='contactos/index'
                options={{
                    title: "Contactos",
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons name={focused ? "call" : "call-outline"} size={24} color={color}/>
                    )
                }}/>

            <Tabs.Screen
                name="perfil/index"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color}/>
                    ),
                }}/>

            <Tabs.Screen
                name="workers/create-worker"
                options={{
                    href: null,
                }}/>

            <Tabs.Screen
                name="jobs/[id]"
                options={{
                    href: null,
                }}/>

            <Tabs.Screen
                name="workers/index"
                options={{
                    href: null,
                }}/>
            <Tabs.Screen
                name="workers/[id]]"
                options={{
                    href: null,
                }}/>

            <Tabs.Screen
                name="workers/[id]"
                options={{
                    href: null,
                }}/>
            <Tabs.Screen
                name="contactos/[id]"
                options={{
                    href: null,
                }}/>
            <Tabs.Screen
                name="workers/herramientas/[id]"
                options={{
                    href: null,
                }}/>



            <Tabs.Screen
                name="cotizaciones/[id]"
                options={{
                    href: null,
                }}/>

        </Tabs>
    );
}