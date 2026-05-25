import { useState } from 'react'
import { useParams } from 'react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { UserPlus, MoreHorizontal, X, Shield, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import {
  apiGetMembers, apiUpdateMember, apiRemoveMember,
  apiInviteMember, apiGetLeaveRequests, apiApproveLeaveRequest, apiRejectLeaveRequest,
} from '@/api/members.api'
import { queryClient } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { useOrgStore } from '@/store/org.store'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROLE_LABELS, type OrgRole } from '@/types/org'
import type { Member } from '@/types/member'
import { cn } from '@/lib/utils'

const ROLES: OrgRole[] = ['admin', 'manager', 'employee']
const CAN_MANAGE: OrgRole[] = ['owner', 'admin']

const ROLE_COLORS: Record<OrgRole, string> = {
  owner:    'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  admin:    'bg-red-500/10 text-red-600 dark:text-red-400',
  manager:  'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  employee: 'bg-muted text-muted-foreground',
}

const inviteSchema = z.object({
  email:    z.email('Некорректный email'),
  role:     z.enum(['admin', 'manager', 'employee']),
  position: z.string().min(1, 'Укажите должность').max(100),
})
type InviteForm = z.infer<typeof inviteSchema>

function InviteModal({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'employee' },
  })

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: (data: InviteForm) => apiInviteMember(orgId, data),
  })

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-background rounded-2xl border border-border shadow-lg p-6 text-center">
          <CheckCircle2 className="size-10 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">Приглашение отправлено</h3>
          <p className="text-sm text-muted-foreground mb-5">Токен приглашения записан в логах сервера</p>
          <Button onClick={onClose}>Закрыть</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background rounded-2xl border border-border shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Пригласить участника</h2>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit((d) => mutate(d))} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="inv-email">Email</Label>
            <Input id="inv-email" type="email" autoComplete="off" placeholder="user@company.com" aria-invalid={!!errors.email} {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-position">Должность</Label>
            <Input id="inv-position" autoComplete="off" placeholder="Frontend Developer" aria-invalid={!!errors.position} {...register('position')} />
            {errors.position && <p className="text-xs text-destructive">{errors.position.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-role">Роль</Label>
            <select id="inv-role" className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20" {...register('role')}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Отправляю...' : 'Пригласить'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditMemberModal({ member, orgId, currentRole, onClose }: {
  member: Member; orgId: string; currentRole: OrgRole; onClose: () => void
}) {
  const [role, setRole] = useState<OrgRole>(member.role)
  const [position, setPosition] = useState(member.position ?? '')
  const canChangeRole = currentRole === 'owner' || (currentRole === 'admin' && member.role !== 'owner' && member.role !== 'admin')

  const { mutate, isPending } = useMutation({
    mutationFn: () => apiUpdateMember(orgId, member.user_id, {
      role: role !== member.role ? role : undefined,
      position: position !== (member.position ?? '') ? (position || null) : undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members', orgId] }); onClose() },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-background rounded-2xl border border-border shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Редактировать участника</h2>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="size-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <Avatar src={`/api/users/avatar/${member.user_id}`} name={member.user.display_name} size="md" />
            <div>
              <p className="font-medium text-sm">{member.user.display_name}</p>
              <p className="text-xs text-muted-foreground">{member.user.email}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Должность</Label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Должность" autoComplete="off" />
          </div>
          {canChangeRole && (
            <div className="space-y-1.5">
              <Label>Роль</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as OrgRole)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
              >
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" onClick={onClose}>Отмена</Button>
            <Button disabled={isPending} onClick={() => mutate()}>{isPending ? 'Сохраняю...' : 'Сохранить'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MembersPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const currentUser = useAuthStore((s) => s.user)
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const myRole = currentOrg?.role ?? 'employee'
  const canManage = CAN_MANAGE.includes(myRole)

  const [showInvite, setShowInvite] = useState(false)
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', orgId],
    queryFn: () => apiGetMembers(orgId!),
    enabled: !!orgId,
  })

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['leave-requests', orgId],
    queryFn: () => apiGetLeaveRequests(orgId!),
    enabled: !!orgId && canManage,
  })

  const { mutate: removeMember } = useMutation({
    mutationFn: (userId: string) => apiRemoveMember(orgId!, userId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members', orgId] }); setMenuOpenId(null) },
  })

  const { mutate: approveLeave } = useMutation({
    mutationFn: (reqId: string) => apiApproveLeaveRequest(orgId!, reqId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests', orgId] })
      queryClient.invalidateQueries({ queryKey: ['members', orgId] })
    },
  })

  const { mutate: rejectLeave } = useMutation({
    mutationFn: (reqId: string) => apiRejectLeaveRequest(orgId!, reqId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leave-requests', orgId] }),
  })

  const leaveMap = Object.fromEntries(leaveRequests.map((r) => [r.user_id, r.id]))

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      {showInvite && <InviteModal orgId={orgId!} onClose={() => setShowInvite(false)} />}
      {editMember && <EditMemberModal member={editMember} orgId={orgId!} currentRole={myRole} onClose={() => setEditMember(null)} />}

      <div className="flex-1 p-4 sm:p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Участники</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{members.length} участников</p>
          </div>
          {canManage && (
            <Button onClick={() => setShowInvite(true)}>
              <UserPlus className="size-4" />
              Пригласить
            </Button>
          )}
        </div>

        {/* Заявки на выход */}
        {canManage && leaveRequests.length > 0 && (
          <div className="mb-6 border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 border-b border-border">
              <p className="text-sm font-medium">Заявки на выход ({leaveRequests.length})</p>
            </div>
            <div className="divide-y divide-border">
              {leaveRequests.map((req) => {
                const member = members.find((m) => m.user_id === req.user_id)
                return (
                  <div key={req.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar src={`/api/users/avatar/${req.user_id}`} name={member?.user.display_name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{member?.user.display_name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground truncate">{member?.user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => rejectLeave(req.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <XCircle className="size-4" />
                        Отклонить
                      </Button>
                      <Button size="sm" onClick={() => approveLeave(req.id)}>
                        <CheckCircle2 className="size-4" />
                        Одобрить
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Список участников */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {members.map((member) => {
              const isMe = member.user_id === currentUser?.id
              const canEdit = canManage && !isMe && member.role !== 'owner'
              const hasLeaveRequest = leaveMap[member.user_id]

              return (
                <div key={member.user_id} className="flex items-center gap-4 px-4 py-3 relative group">
                  <Avatar src={`/api/users/avatar/${member.user_id}`} name={member.user.display_name} size="md" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{member.user.display_name}</p>
                      {isMe && <span className="text-xs text-muted-foreground">(вы)</span>}
                      {hasLeaveRequest && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                          Заявка на выход
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{member.user.email}</p>
                    {member.position && <p className="text-xs text-muted-foreground">{member.position}</p>}
                  </div>

                  <span className={cn('text-xs px-2 py-1 rounded-md font-medium shrink-0', ROLE_COLORS[member.role])}>
                    {ROLE_LABELS[member.role]}
                  </span>

                  {canEdit && (
                    <div className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === member.user_id ? null : member.user_id) }}
                        className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>

                      {menuOpenId === member.user_id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                          <div className="absolute right-4 z-20 w-44 bg-popover border border-border rounded-lg shadow-md py-1">
                            <button
                              onClick={() => { setEditMember(member); setMenuOpenId(null) }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                              <Shield className="size-3.5 shrink-0" />
                              Изменить
                            </button>
                            <div className="h-px bg-border mx-2 my-1" />
                            <button
                              onClick={() => removeMember(member.user_id)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="size-3.5 shrink-0" />
                              Удалить
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}