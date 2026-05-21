import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Building2, Mail, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react'
import { apiGetInvitation, apiAcceptInvitation } from '@/api/invitations.api'
import { queryClient } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'

export default function InvitationAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data: invite, isLoading, isError } = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => apiGetInvitation(token!),
    enabled: !!token,
    retry: false,
  })

  const { mutate: accept, isPending, isSuccess } = useMutation({
    mutationFn: () => apiAcceptInvitation(token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="size-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="size-8 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold">Приглашение не найдено</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Ссылка недействительна или срок действия приглашения истёк. Попросите администратора отправить новое.
        </p>
        <Button variant="outline" onClick={() => navigate('/orgs')}>На главную</Button>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="size-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="size-8 text-green-500" />
        </div>
        <h2 className="text-lg font-semibold">Вы вступили в организацию!</h2>
        <p className="text-sm text-muted-foreground">
          Теперь вы участник организации <span className="font-medium text-foreground">{invite?.org_name}</span>
        </p>
        <Button onClick={() => navigate('/orgs')}>Перейти к организациям</Button>
      </div>
    )
  }

  const emailMismatch = user && invite && user.email !== invite.email

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="size-8 text-primary" />
          </div>
          <h1 className="text-xl font-semibold mb-1">Приглашение в организацию</h1>
          <p className="text-sm text-muted-foreground">Вас приглашают стать участником</p>
        </div>

        <div className="border border-border rounded-xl bg-card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                {invite!.org_name[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{invite!.org_name}</p>
                <p className="text-xs text-muted-foreground">Организация</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 flex items-center gap-3 border-b border-border">
            <Mail className="size-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Для</p>
              <p className="text-sm font-medium">{invite!.email}</p>
            </div>
          </div>

          {invite!.position && (
            <div className="px-5 py-3 flex items-center gap-3">
              <Briefcase className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Должность</p>
                <p className="text-sm font-medium">{invite!.position}</p>
              </div>
            </div>
          )}
        </div>

        {emailMismatch ? (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 mb-4">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">
              Приглашение предназначено для <span className="font-medium">{invite!.email}</span>, но вы вошли как <span className="font-medium">{user!.email}</span>
            </p>
          </div>
        ) : (
          <Button
            className="w-full"
            disabled={isPending || !!emailMismatch}
            onClick={() => accept()}
          >
            {isPending ? 'Принимаю...' : 'Принять приглашение'}
          </Button>
        )}
      </div>
    </div>
  )
}