import { Badge } from '@/components/ui/badge'

// Marca campos que se guardan pero que el motor de conversación todavía no usa
// (por ahora, disparadores y reguladores del perfil).
export function FutureFeatureBadge() {
  return (
    <Badge
      variant="outline"
      className="text-[10px] font-normal text-muted-foreground"
      title="Se guardan con el perfil, pero aún no influyen en la conversación."
    >
      Mejora futura
    </Badge>
  )
}
