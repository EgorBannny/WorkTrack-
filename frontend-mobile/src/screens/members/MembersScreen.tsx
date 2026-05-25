import { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Modal, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  apiGetMembers, apiInviteMember, apiRemoveMember, apiUpdateMember,
  apiGetLeaveRequests, apiApproveLeaveRequest, apiRejectLeaveRequest,
} from '../../api/members.api'
import { useAuthStore } from '../../store/auth.store'
import { useOrgStore } from '../../store/org.store'
import { Avatar } from '../../components/Avatar'
import { Spinner } from '../../components/Spinner'
import { Colors, Spacing, FontSize, Radius } from '../../theme'
import { ROLE_LABELS, type OrgRole } from '../../types/org'
import type { Member } from '../../types/member'

const ROLE_COLORS: Record<OrgRole, string> = {
  owner: '#ca8a04',
  admin: '#dc2626',
  manager: '#2563eb',
  employee: '#6b7280',
}

const MANAGEABLE_ROLES: OrgRole[] = ['admin', 'manager', 'employee']

export default function MembersScreen() {
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const myRole = currentOrg?.role ?? 'employee'
  const canManage = ['owner', 'admin'].includes(myRole)
  const orgId = currentOrg!.id

  const [showInvite, setShowInvite] = useState(false)
  const [invEmail, setInvEmail] = useState('')
  const [invPosition, setInvPosition] = useState('')
  const [invRole, setInvRole] = useState<OrgRole>('employee')

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', orgId],
    queryFn: () => apiGetMembers(orgId),
  })

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['leave-requests', orgId],
    queryFn: () => apiGetLeaveRequests(orgId),
    enabled: canManage,
  })

  const { mutate: removeMember } = useMutation({
    mutationFn: (userId: string) => apiRemoveMember(orgId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', orgId] }),
  })

  const { mutate: approveLeave } = useMutation({
    mutationFn: (reqId: string) => apiApproveLeaveRequest(orgId, reqId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests', orgId] })
      qc.invalidateQueries({ queryKey: ['members', orgId] })
    },
  })

  const { mutate: rejectLeave } = useMutation({
    mutationFn: (reqId: string) => apiRejectLeaveRequest(orgId, reqId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave-requests', orgId] }),
  })

  const { mutate: invite, isPending: inviting, isSuccess: invited } = useMutation({
    mutationFn: () => apiInviteMember(orgId, { email: invEmail.trim(), role: invRole, position: invPosition.trim() }),
    onSuccess: () => {
      Alert.alert('Готово', 'Токен приглашения записан в логах сервера')
      setShowInvite(false); setInvEmail(''); setInvPosition(''); setInvRole('employee')
    },
    onError: () => Alert.alert('Ошибка', 'Не удалось отправить приглашение'),
  })

  function confirmRemove(member: Member) {
    Alert.alert('Удалить участника?', member.user.display_name, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => removeMember(member.user_id) },
    ])
  }

  function showMemberActions(member: Member) {
    if (!canManage || member.role === 'owner') return
    Alert.alert(member.user.display_name, undefined, [
      {
        text: 'Изменить роль',
        onPress: () => showRolePicker(member),
      },
      { text: 'Удалить из организации', style: 'destructive', onPress: () => confirmRemove(member) },
      { text: 'Отмена', style: 'cancel' },
    ])
  }

  function showRolePicker(member: Member) {
    Alert.alert('Роль', undefined,
      MANAGEABLE_ROLES.map((r) => ({
        text: ROLE_LABELS[r] + (member.role === r ? ' ✓' : ''),
        onPress: () => apiUpdateMember(orgId, member.user_id, { role: r })
          .then(() => qc.invalidateQueries({ queryKey: ['members', orgId] })),
      })).concat([{ text: 'Отмена', onPress: () => {} }]),
    )
  }

  if (isLoading) return <Spinner />

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Участники</Text>
          <Text style={styles.headerSub}>{members.length} участников</Text>
        </View>
        {canManage && (
          <TouchableOpacity style={styles.inviteBtn} onPress={() => setShowInvite(true)}>
            <Text style={styles.inviteBtnText}>＋ Пригласить</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={members}
        keyExtractor={(m) => m.user_id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          canManage && leaveRequests.length > 0 ? (
            <View style={styles.leaveSection}>
              <Text style={styles.leaveSectionTitle}>Заявки на выход ({leaveRequests.length})</Text>
              {leaveRequests.map((req) => {
                const member = members.find((m) => m.user_id === req.user_id)
                return (
                  <View key={req.id} style={styles.leaveRow}>
                    <Avatar src={`/api/users/avatar/${req.user_id}`} name={member?.user.display_name} size={36} />
                    <Text style={styles.leaveName} numberOfLines={1}>{member?.user.display_name ?? '—'}</Text>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectLeave(req.id)}>
                      <Text style={styles.rejectText}>✕</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => approveLeave(req.id)}>
                      <Text style={styles.approveText}>✓</Text>
                    </TouchableOpacity>
                  </View>
                )
              })}
            </View>
          ) : null
        }
        renderItem={({ item: member }) => {
          const isMe = member.user_id === currentUser?.id
          const canEdit = canManage && !isMe && member.role !== 'owner'
          return (
            <TouchableOpacity
              style={styles.memberRow}
              onPress={() => canEdit && showMemberActions(member)}
              activeOpacity={canEdit ? 0.7 : 1}
            >
              <Avatar src={`/api/users/avatar/${member.user_id}`} name={member.user.display_name} size={44} />
              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <Text style={styles.memberName} numberOfLines={1}>{member.user.display_name}</Text>
                  {isMe && <Text style={styles.youBadge}>вы</Text>}
                </View>
                <Text style={styles.memberEmail} numberOfLines={1}>{member.user.email}</Text>
                {member.position ? <Text style={styles.memberPosition}>{member.position}</Text> : null}
              </View>
              <View style={[styles.roleBadge, { borderColor: ROLE_COLORS[member.role] + '44' }]}>
                <Text style={[styles.roleText, { color: ROLE_COLORS[member.role] }]}>
                  {ROLE_LABELS[member.role]}
                </Text>
              </View>
            </TouchableOpacity>
          )
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Модал приглашения */}
      <Modal visible={showInvite} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Пригласить участника</Text>
            <TouchableOpacity onPress={() => setShowInvite(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="user@company.com"
              placeholderTextColor={Colors.textFaint}
              value={invEmail}
              onChangeText={setInvEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Должность *</Text>
            <TextInput
              style={styles.input}
              placeholder="Frontend Developer"
              placeholderTextColor={Colors.textFaint}
              value={invPosition}
              onChangeText={setInvPosition}
            />
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Роль</Text>
            <View style={styles.pillsRow}>
              {MANAGEABLE_ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.pill, invRole === r && styles.pillActive]}
                  onPress={() => setInvRole(r)}
                >
                  <Text style={[styles.pillText, invRole === r && styles.pillActiveText]}>
                    {ROLE_LABELS[r]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.submitBtn, inviting && { opacity: 0.6 }]}
              onPress={() => { if (invEmail && invPosition) invite() }}
              disabled={inviting}
            >
              {inviting
                ? <ActivityIndicator color={Colors.primaryForeground} />
                : <Text style={styles.submitText}>Пригласить</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: FontSize.sm, color: Colors.textMuted },
  inviteBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: Radius.sm,
  },
  inviteBtnText: { color: Colors.primaryForeground, fontSize: FontSize.sm, fontWeight: '600' },
  list: { paddingVertical: Spacing.sm },
  leaveSection: {
    margin: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, overflow: 'hidden',
  },
  leaveSectionTitle: {
    fontSize: FontSize.sm, fontWeight: '600', color: Colors.text,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  leaveRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  leaveName: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  rejectBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.destructiveLight, alignItems: 'center', justifyContent: 'center',
  },
  rejectText: { color: Colors.destructive, fontSize: 14, fontWeight: '700' },
  approveBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center',
  },
  approveText: { color: Colors.success, fontSize: 14, fontWeight: '700' },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  memberInfo: { flex: 1, minWidth: 0 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberName: { fontSize: FontSize.md, fontWeight: '500', color: Colors.text, flexShrink: 1 },
  youBadge: { fontSize: FontSize.xs, color: Colors.textMuted },
  memberEmail: { fontSize: FontSize.sm, color: Colors.textMuted },
  memberPosition: { fontSize: FontSize.xs, color: Colors.textFaint, marginTop: 1 },
  roleBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full, borderWidth: 1,
  },
  roleText: { fontSize: FontSize.xs, fontWeight: '600' },
  separator: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  modalClose: { fontSize: 20, color: Colors.textMuted, padding: 4 },
  modalBody: { padding: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: FontSize.md, color: Colors.text,
  },
  pillsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: Spacing.md },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontSize: FontSize.sm, color: Colors.text },
  pillActiveText: { color: '#fff' },
  submitBtn: {
    height: 48, backgroundColor: Colors.primary, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm,
  },
  submitText: { color: Colors.primaryForeground, fontSize: FontSize.md, fontWeight: '600' },
})