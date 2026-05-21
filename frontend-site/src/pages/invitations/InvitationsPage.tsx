import { Mail } from 'lucide-react'

export default function InvitationsPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
        <Mail className="size-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold">Приглашения</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        Чтобы вступить в организацию, перейдите по ссылке-приглашению которую прислал администратор.
      </p>
    </div>
  )
}