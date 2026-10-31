"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { tiempoDeLectura } from "@/lib/utils"
import { createScene } from "./scene.js"

type Sala3DProps = {
  severity: number
  npcText: string
  /** Último mensaje del estudiante; el id permite mostrar de nuevo un texto repetido */
  estudianteId: string | null
  estudianteText: string
  /** El último mensaje es del estudiante: su globo se retira cuando el NPC empieza a responder */
  estudianteTieneLaPalabra: boolean
  isLoading: boolean
  puedeEscribir: boolean
  aviso: string | null
  inputValue: string
  onInputChange: (value: string) => void
  onEnviar: () => void
  mensajeFallido: boolean
  onReintentar: () => void
  onSalir: () => void
  /** Estado de la sesión para quien la supervisa; la página del chat decide cuándo mostrarlo */
  panel?: ReactNode
}

const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))

type Ancla = { x: number; y: number; visible: boolean }
type Caja = { izq: number; der: number; arriba: number; abajo: number }

// Franja inferior reservada para la barra de escritura y los avisos
const RESERVA_INFERIOR = 110

/** Ubica un globo sobre su personaje dentro de la zona libre; si choca con `otro`, lo pone encima. Devuelve su caja */
function colocarGlobo(
  globo: HTMLDivElement | null,
  ancla: Ancla,
  zona: { ancho: number; alto: number; tope: number },
  otro: Caja | null = null,
): Caja | null {
  if (!globo) return null
  const alto = globo.offsetHeight
  const mitad = globo.offsetWidth / 2
  const x = Math.min(Math.max(ancla.x, mitad + 8), zona.ancho - mitad - 8)
  let base = Math.min(ancla.y, zona.alto - RESERVA_INFERIOR)
  if (otro && x - mitad < otro.der && x + mitad > otro.izq && base > otro.arriba - 8 && base - alto < otro.abajo) {
    base = otro.arriba - 8
  }
  const y = Math.max(base, zona.tope + alto)
  globo.style.visibility = ancla.visible ? "visible" : "hidden"
  globo.style.transform = `translate(${x - mitad}px, ${y - alto}px)`
  return { izq: x - mitad, der: x + mitad, arriba: y - alto, abajo: y }
}

/** Mantiene un mensaje visible el tiempo de leerlo y luego lo deja desvanecer */
function useVisibleParaLeer(texto: string, clave: string) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!texto) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cada mensaje nuevo reinicia su tiempo de lectura
    setVisible(true)
    const temporizador = setTimeout(() => setVisible(false), tiempoDeLectura(texto))
    return () => clearTimeout(temporizador)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])
  return visible
}

/** Modo 3D de la sesión a pantalla completa. Toda la lógica de la conversación vive en la página del chat. */
export function Sala3D({
  severity,
  npcText,
  estudianteId,
  estudianteText,
  estudianteTieneLaPalabra,
  isLoading,
  puedeEscribir,
  aviso,
  inputValue,
  onInputChange,
  onEnviar,
  mensajeFallido,
  onReintentar,
  onSalir,
  panel,
}: Sala3DProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const globoRef = useRef<HTMLDivElement>(null)
  const globoEstudianteRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const escenaRef = useRef<ReturnType<typeof createScene> | null>(null)
  const cercaRef = useRef(false)
  const [cerca, setCerca] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const conversando = abierto && puedeEscribir
  // La clave del NPC es su texto: cada fragmento del streaming reinicia el tiempo de lectura
  const npcVisible = useVisibleParaLeer(npcText, npcText)
  const estudianteDentroDeTiempo = useVisibleParaLeer(estudianteText, estudianteId ?? "")
  const estudianteVisible = estudianteDentroDeTiempo && estudianteTieneLaPalabra
  const estudianteVisibleRef = useRef(false)
  useEffect(() => { estudianteVisibleRef.current = estudianteVisible }, [estudianteVisible])

  useEffect(() => {
    const host = canvasRef.current
    if (!host) return
    const escena = createScene(host, {
      npcSeverity: severity,
      onFrame: ({ near, width, height, anchor, playerAnchor }: { near: boolean; width: number; height: number; anchor: Ancla; playerAnchor: Ancla }) => {
        if (near !== cercaRef.current) {
          cercaRef.current = near
          setCerca(near)
        }
        // Los globos no entran en la franja superior, donde están el panel y "Volver al chat"
        const zona = { ancho: width, alto: height, tope: Math.max(panelRef.current?.getBoundingClientRect().bottom ?? 0, 44) + 8 }
        const cajaEstudiante = colocarGlobo(globoEstudianteRef.current, playerAnchor, zona)
        colocarGlobo(globoRef.current, anchor, zona, estudianteVisibleRef.current ? cajaEstudiante : null)
      },
    })
    escenaRef.current = escena
    const observador = new ResizeObserver(() => escena.resize())
    observador.observe(host)
    return () => {
      observador.disconnect()
      escena.dispose()
      escenaRef.current = null
    }
    // La escena se crea una sola vez; la severidad posterior llega por setSeverity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    escenaRef.current?.setSeverity(severity)
  }, [severity])

  useEffect(() => {
    escenaRef.current?.setInteracting(conversando)
    if (conversando) inputRef.current?.focus()
  }, [conversando])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Un diálogo abierto ya atendió la tecla: cerrarlo no debe sacar de la sala
        if (e.defaultPrevented) return
        if (conversando) setAbierto(false)
        else onSalir()
        return
      }
      if (e.code === "KeyE" && !conversando && puedeEscribir && cercaRef.current && !isEditable(e.target)) {
        e.preventDefault()
        setAbierto(true)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [conversando, puedeEscribir, onSalir])

  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-hidden bg-slate-900" data-modo-3d>
      <div ref={canvasRef} className="absolute inset-0" />

      {(isLoading || npcText) && (
        <div
          ref={globoRef}
          style={{ visibility: "hidden" }}
          className={`absolute left-0 top-0 w-fit min-w-16 max-w-sm rounded-2xl border bg-background/95 px-3 py-2 text-foreground shadow-lg transition-opacity duration-500 motion-reduce:transition-none ${isLoading || npcVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          {isLoading ? (
            <div className="flex gap-1 py-1.5" aria-label="Respondiendo">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          ) : (
            <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">
              {npcText}
            </p>
          )}
        </div>
      )}

      {estudianteText && (
        <div
          ref={globoEstudianteRef}
          style={{ visibility: "hidden" }}
          className={`pointer-events-none absolute left-0 top-0 w-fit min-w-16 max-w-xs rounded-2xl bg-accent px-3 py-2 text-accent-foreground shadow-lg transition-opacity duration-500 motion-reduce:transition-none ${estudianteVisible ? "opacity-100" : "opacity-0"}`}
        >
          <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">
            {estudianteText}
          </p>
        </div>
      )}

      {panel && (
        <div ref={panelRef} className="absolute left-3 top-3 flex max-w-[calc(100%-11rem)] flex-wrap items-center gap-2 rounded-xl border bg-background/95 p-1.5 text-foreground shadow-lg">
          {panel}
        </div>
      )}

      <Button variant="secondary" size="sm" className="absolute right-3 top-3" onClick={onSalir}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al chat
      </Button>

      <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-2 px-3">
        {aviso && (
          <p className="rounded-full bg-background/95 px-4 py-1.5 text-sm font-medium text-foreground shadow">{aviso}</p>
        )}
        {mensajeFallido && (
          <p className="flex items-center gap-2 rounded-full bg-background/95 px-4 py-1.5 text-sm text-destructive shadow">
            No se pudo enviar
            <button
              type="button"
              onClick={onReintentar}
              disabled={isLoading}
              className="font-medium underline underline-offset-2 disabled:opacity-50"
            >
              Reintentar
            </button>
          </p>
        )}
        {cerca && !conversando && puedeEscribir && (
          <p className="rounded-full bg-background/95 px-4 py-1.5 text-sm font-medium text-foreground shadow">
            Pulsa E para conversar
          </p>
        )}
        {conversando && (
          <div className="flex w-full max-w-2xl items-center gap-2 rounded-full border bg-background/95 py-1 pl-4 pr-1.5 shadow-lg">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputValue}
              placeholder="Escribe tu intervención…"
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  onEnviar()
                }
              }}
              className="max-h-32 min-w-0 flex-1 resize-none bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <Button
              size="icon"
              onClick={onEnviar}
              disabled={!inputValue.trim() || isLoading}
              className="h-7 w-7 shrink-0 rounded-full"
              aria-label="Enviar"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <p className="rounded bg-black/55 px-2 py-1 text-xs text-white">
          WASD o flechas: mover{puedeEscribir && " · E: conversar"} · Esc: cerrar
        </p>
      </div>
    </div>,
    document.body,
  )
}
