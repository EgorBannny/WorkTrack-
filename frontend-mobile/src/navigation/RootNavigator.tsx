import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuthStore } from '../store/auth.store'
import { useOrgStore } from '../store/org.store'
import type { RootStackParamList } from './types'
import { Colors } from '../theme'

import AuthScreen from '../screens/auth/AuthScreen'
import OrgsScreen from '../screens/orgs/OrgsScreen'
import { AppNavigator } from './AppNavigator'
import BoardScreen from '../screens/board/BoardScreen'
import TaskDetailScreen from '../screens/board/TaskDetailScreen'
import InvitationsScreen from '../screens/invitations/InvitationsScreen'
import ProfileScreen from '../screens/profile/ProfileScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  const user = useAuthStore((s) => s.user)
  const currentOrg = useOrgStore((s) => s.currentOrg)

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
      </Stack.Navigator>
    )
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.primary,
        headerTitleStyle: { color: Colors.text },
        headerShadowVisible: false,
      }}
    >
      {!currentOrg ? (
        <Stack.Screen
          name="Orgs"
          component={OrgsScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="MainTabs"
            component={AppNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Board"
            component={BoardScreen}
            options={({ route }) => ({ title: route.params.projectName })}
          />
          <Stack.Screen
            name="TaskDetail"
            component={TaskDetailScreen}
            options={{ title: 'Задача' }}
          />
        </>
      )}
      <Stack.Screen
        name="Invitations"
        component={InvitationsScreen}
        options={{ title: 'Приглашения' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Профиль' }}
      />
    </Stack.Navigator>
  )
}