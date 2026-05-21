import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  orgName: string
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteOrgModal({ orgName, isPending, onConfirm, onCancel }: Props) {
  const [value, setValue] = useState('')
  const matches = value === orgName

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />

      <div className="relative w-full max-w-md bg-background rounded-2xl border border-destructive/40 shadow-lg overflow-hidden">
        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4" />
            <span className="font-semibold">Удаление организации</span>
          </div>
          <button
            onClick={onCancel}
            className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Это действие <span className="text-foreground font-medium">нельзя отменить</span>. Организация и все связанные данные будут архивированы.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-name">
              Введите название организации{' '}
              <span className="font-mono font-semibold text-foreground">{orgName}</span>{' '}
              для подтверждения
            </Label>
            <Input
              id="confirm-name"
              autoComplete="off"
              placeholder={orgName}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Отмена
            </Button>
            <Button
              type="button"
              disabled={!matches || isPending}
              onClick={onConfirm}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? 'Удаляю...' : 'Подтвердить удаление'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}