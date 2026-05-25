import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'

export type RootStackParamList = {
  Auth: undefined
  Orgs: undefined
  MainTabs: undefined
  Board: { orgId: string; projectId: string; projectName: string }
  TaskDetail: { orgId: string; projectId: string; taskId: string }
  Invitations: undefined
  Profile: undefined
}

export type TabParamList = {
  Projects: undefined
  Members: undefined
  Analytics: undefined
  More: undefined  // Profile, Invitations, switch org, logout
}

export type RootStackProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>
export type TabProps<T extends keyof TabParamList> = BottomTabScreenProps<TabParamList, T>