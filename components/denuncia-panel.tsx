"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { gerarTextoDenuncia } from "@/lib/denuncia"
import { ENTIDADES_DENUNCIA, type Local } from "@/lib/ruido"
import { Printer, Copy, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function DenunciaPanel({ local }: { local: Local }) {
  const texto = useMemo(() => gerarTextoDenuncia(local), [local])
  const [copiado, setCopiado] = useState(false)

  function imprimir() {
    const win = window.open("", "_blank", "width=800,height=900")
    if (!win) {
      toast.error("Permita janelas de pop-up para imprimir/guardar em PDF.")
      return
    }
    win.document.write(`<!doctype html><html lang="pt"><head><meta charset="utf-8">
      <title>Denúncia de ruído · ${local.nome}</title>
      <style>
        body{font-family:Georgia,'Times New Roman',serif;max-width:720px;margin:40px auto;padding:0 24px;color:#111;line-height:1.6;}
        pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;font-size:14px;}
      </style></head><body><pre>${texto.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] as string)}</pre>
      <script>window.onload=function(){window.print()}</script></body></html>`)
    win.document.close()
  }

  async function copiar() {
    await navigator.clipboard.writeText(texto)
    setCopiado(true)
    toast.success("Texto da denúncia copiado.")
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Documento de denúncia</h3>
          <p className="text-sm text-muted-foreground">
            Gerado automaticamente com base nos dados e medições do local.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={copiar} className="gap-2">
            {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
            Copiar
          </Button>
          <Button onClick={imprimir} className="gap-2">
            <Printer className="size-4" />
            Imprimir / PDF
          </Button>
        </div>
      </div>

      <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/30 p-5 font-mono text-xs leading-relaxed text-foreground">
        {texto}
      </pre>

      <div className="rounded-xl border border-border bg-card p-5">
        <h4 className="mb-2 text-sm font-semibold text-foreground">A quem apresentar a denúncia</h4>
        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          {ENTIDADES_DENUNCIA.map((e) => (
            <li key={e} className="flex gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              {e}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
