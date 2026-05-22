import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <p className="text-8xl font-bold text-muted-foreground/20">404</p>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Página no encontrada</h1>
        <p className="text-sm text-muted-foreground">
          La ruta que buscas no existe o fue movida.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
        </Link>
      </Button>
    </div>
  )
}
