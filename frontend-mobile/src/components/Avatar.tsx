import { Image, Text, View, StyleSheet } from 'react-native'
import { Colors } from '../theme'
import { API_BASE_URL } from '../config'

interface AvatarProps {
  src: string | null
  name?: string | null
  size?: number
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function Avatar({ src, name, size = 40 }: AvatarProps) {
  const uri = src ? `${API_BASE_URL}${src}` : null

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
          {name ? initials(name) : '?'}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: Colors.primaryForeground,
    fontWeight: '600',
  },
})