import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { Colors } from '../theme'

export function Spinner() {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})