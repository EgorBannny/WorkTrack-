import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { apiMe } from './src/api/auth.api'
import { queryClient } from './src/api/client'
import { useAuthStore } from './src/store/auth.store'
import { RootNavigator } from './src/navigation/RootNavigator'
import { Colors } from './src/theme'
import * as SecureStore from 'expo-secure-store'

function AppInner() {
  const { isInitialized, setUser, setInitialized } = useAuthStore()

  useEffect(() => {
    async function init() {
      try {
        const token = await SecureStore.getItemAsync('access_token')
        if (token) {
          const user = await apiMe()
          setUser(user)
        }
      } catch {
        await SecureStore.deleteItemAsync('access_token')
        await SecureStore.deleteItemAsync('refresh_token')
      } finally {
        setInitialized()
      }
    }
    init()
  }, [])

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <AppInner />
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}