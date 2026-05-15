import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Plus, Building2, X } from 'lucide-react'
import { apiGetMyOrgs, apiCreateOrg } from '@/api/orgs.api'
import { useOrgStore } from '@/store/org.store'
import { queryClient } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROLE_LABELS, type OrgWithRole } from '@/types/org'
import { cn } from '@/lib/utils'

const createSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
})
type CreateForm = z.infer<typeof createSchema>

function getOrgInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function OrgsPage() {
  const navigate = useNavigate()
  const setCurrentOrg = useOrgStore((s) => s.setCurrentOrg)
  const [showCreate, setShowCreate] = useState(false)

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['orgs'],
    queryFn: apiGetMyOrgs,
  })

  const { mutate: createOrg, isPending } = useMutation({
    mutationFn: (name: string) => apiCreateOrg(name),
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] })
      setShowCreate(false)
      reset()
      handleSelectOrg(org)
    },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  })

  function handleSelectOrg(org: OrgWithRole) {
    setCurrentOrg(org)
    navigate(`/orgs/${org.id}/projects`)
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl">

        {orgs.length === 0 && !showCreate ? (
          /* Пустое состояние */
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
              <Building2 className="size-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-1">У вас пока нет организаций</h2>
              <p className="text-sm text-muted-foreground">
                Создайте новую или примите приглашение —<br />
                проверьте вкладку <span className="text-foreground font-medium">Приглашения</span> в меню
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="size-4" />
              Создать организацию
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-semibold">Выберите организацию</h1>
                <p className="text-sm text-muted-foreground">Войдите в существующую или создайте новую</p>
              </div>
              {!showCreate && (
                <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
                  <Plus className="size-4" />
                  Создать
                </Button>
              )}
            </div>

            {/* Список организаций */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {orgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSelectOrg(org)}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl border border-border bg-card',
                    'hover:border-primary/50 hover:bg-primary/5 transition-colors text-left',
                    !org.is_active && 'opacity-50 pointer-events-none',
                  )}
                >
                  <div className="size-11 rounded-xl bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center shrink-0">
                    {getOrgInitials(org.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{org.name}</p>
                    <p className="text-xs text-muted-foreground">{ROLE_LABELS[org.role]}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Форма создания */}
        {showCreate && (
          <div className="border border-border rounded-xl p-5 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Новая организация</h3>
              <button
                onClick={() => { setShowCreate(false); reset() }}
                className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit((d) => createOrg(d.name))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="org-name">Название</Label>
                <Input
                  id="org-name"
                  placeholder="Название организации"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); reset() }}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Создаю...' : 'Создать'}
                </Button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}