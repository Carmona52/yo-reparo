import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { supabase } from '@/libs/supabase'

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
      console.log('PROFILE ERROR:', error)
      router.replace('/(auth)/login')
      return
    }

    console.log('profile', profile)

    if (profile?.role === 'owner') {
      router.replace('/(owner)')
    } else {
      router.replace('/(worker)')
    }
  }

  return null
}
