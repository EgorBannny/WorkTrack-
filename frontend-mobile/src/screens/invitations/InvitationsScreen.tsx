import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGetMyInvitations, apiAcceptInvitation } from '../../api/invitations.api'
import { apiGetMyOrgs } from '../../api/orgs.api'
import { useOrgStore } from '../../store/org.store'
import { Spinner } from '../../components/Spinner'
import { Colors, Spacing, FontSize, Radius } from '../../theme'
import { ROLE_LABELS, type OrgRole } from '../../types/org'

export default function InvitationsScreen() {
  const qc = useQueryClient()
  const setCurrentOrg = useOrgStore((s) => s.setCurrentOrg)

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['my-invitations'],
    queryFn: apiGetMyInvitations,
  })

  const { mutate: accept } = useMutation({
    mutationFn: (token: string) => apiAcceptInvitation(token),
    onSuccess: async () => {
      const orgs = await apiGetMyOrgs()
      qc.invalidateQueries({ queryKey: ['orgs'] })
      qc.invalidateQueries({ queryKey: ['my-invitations'] })
      if (orgs.length > 0) {
        Alert.alert('Принято', 'Вы вступили в организацию', [
          {
            text: 'Перейти',
            onPress: () => setCurrentOrg(orgs[orgs.length - 1]),
          },
        ])
      }
    },
    onError: () => Alert.alert('Ошибка', 'Не удалось принять приглашение'),
  })

  function confirmAccept(token: string, orgName: string) {
    Alert.alert('Принять приглашение?', `Вступить в организацию «${orgName}»?`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Принять', onPress: () => accept(token) },
    ])
  }

  if (isLoading) return <Spinner />

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={invitations}
        keyExtractor={(inv) => inv.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Нет приглашений</Text>
            <Text style={styles.emptyText}>
              Когда вас пригласят в организацию, приглашение появится здесь
            </Text>
          </View>
        }
        renderItem={({ item: inv }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.orgName}>{inv.org_name}</Text>
              <Text style={styles.position}>{inv.position}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{ROLE_LABELS[inv.role as OrgRole] ?? inv.role}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => confirmAccept(inv.token, inv.org_name)}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptText}>Принять</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  cardInfo: { flex: 1 },
  orgName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  position: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start', marginTop: 6,
    backgroundColor: Colors.primaryLight, paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: Radius.full,
  },
  roleText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  acceptBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 16,
    paddingVertical: 10, borderRadius: Radius.sm,
  },
  acceptText: { color: Colors.primaryForeground, fontSize: FontSize.sm, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: Spacing.lg },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
})