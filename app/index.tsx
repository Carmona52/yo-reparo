import { useEffect } from 'react'
import {ActivityIndicator, StyleSheet} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/libs/supabase'
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";

export default function Index() {
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.replace('/(auth)/login')
      return
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

    if (error) {
      router.replace('/(auth)/login')
      return
    }

    if (profile?.role === 'owner') {
      router.replace('/(owner)')
    } else {
      router.replace('/(worker)')
    }
  }

  return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <ThemedText style={styles.text}>Cargando tu perfil...</ThemedText>
      </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
})