"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createScene } from "./scene.js"

type Sala3DProps = {
  severity: number
  npcText: string
  isLoading: boolean
  puedeEscribir: boolean
  aviso: string | null
  inputValue: string
  onInputChange: (value: string) => void
  onEnviar: () => void
  mensajeFallido: boolean
  onReintentar: () => void
  onSalir: () => void
}

const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))

/** Modo 3D de la sesión a pantalla completa. Toda la lógica de la conversación vive en la página del chat. */
export function Sala3D({
  severity,
  npcText,
  isLoading,
  puedeEscribir,
  aviso,
  inputValue,
  onInputChange,
  onEnviar,
  mensajeFallido,
  onReintentar,
  onSalir,
}: Sala3DProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const globoRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const escenaRef = useRef<ReturnType<typeof createScene> | null>(null)
  const cercaRef = useRef(false)
  const [cerca, setCerca] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const conversando = abierto && puedeEscribir

  useEffect(() => {
    const host = canvasRef.current
    if (!host) return
    const escena = createScene(host, {
      npcSeverity: severity,
      onFrame: ({ near, width, anchor }: { near: boolean; width: number; anchor: { x: number; y: number; visible: boolean } }) => {
        if (near !== cercaRef.current) {
          cercaRef.current = near
          setCerca(near)
        }
        const globo = globoRef.current
        if (!globo) return
        const mitad = globo.offsetWidth / 2
        const x = Math.min(Math.max(anchor.x, mitad + 8), width - mitad - 8)
        const y = Math.max(anchor.y, globo.offsetHeight + 8)
        globo.style.visibility = anchor.visible ? "visible" : "hidden"
        globo.style.transform = `translate(${x - mitad}px, ${y - globo.offsetHeight}px)`
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
          className="absolute left-0 top-0 w-fit min-w-16 max-w-sm rounded-2xl border bg-background/95 px-3 py-2 text-foreground shadow-lg"
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
