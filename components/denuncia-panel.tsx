"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { gerarTextoDenuncia } from "@/lib/denuncia"
import { ENTIDADES_DENUNCIA, type Local } from "@/lib/ruido"
import { Printer, Copy, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

const CHAVE_LOCALSTORAGE = "noiseman_denunciante"

type Identidade = { nome: string; contacto: string; morada: string }

function lerIdentidadeGuardada(): Identidade {
  try {
    const bruto = localStorage.getItem(CHAVE_LOCALSTORAGE)
    if (bruto) return { nome: "", contacto: "", morada: "", ...JSON.parse(bruto) }
  } catch {
    // ignorar
  }
  return { nome: "", contacto: "", morada: "" }
}

type Props = {
  local: Local
  onAtualizar: (payload: Partial<Local>) => Promise<void>
}

export function DenunciaPanel({ local, onAtualizar }: Props) {
  const identidadeCompleta = Boolean(local.nomeDenunciante?.trim())
  const [aEditarIdentidade, setAEditarIdentidade] = useState(false)
  const [form, setForm] = useState<Identidade>(() =>
    identidadeCompleta
      ? {
          nome: local.nomeDenunciante ?? "",
          contacto: local.contactoDenunciante ?? "",
          morada: local.moradaDenunciante ?? "",
        }
      : lerIdentidadeGuardada(),
  )
  const [aGuardar, setAGuardar] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const texto = useMemo(() => gerarTextoDenuncia(local), [local])

  async function guardarIdentidade(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) {
      toast.error("Indica o teu nome — a denúncia tem de ser assinada.")
      return
    }
    setAGuardar(true)
    try {
      await onAtualizar({
        nomeDenunciante: form.nome.trim(),
        contactoDenunciante: form.contacto.trim(),
        moradaDenunciante: form.morada.trim(),
      })
      // Guarda também localmente para pré-preencher futuras denúncias
      try {
        localStorage.setItem(CHAVE_LOCALSTORAGE, JSON.stringify(form))
      } catch {
        // ignorar (modo privado)
      }
      setAEditarIdentidade(false)
    } finally {
      setAGuardar(false)
    }
  }

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

  // Identificação em falta: pedir uma única vez, depois ir direto ao documento
  if (!identidadeCompleta || aEditarIdentidade) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Antes da denúncia</h3>
          <p className="text-sm text-muted-foreground">
            A denúncia é assinada contigo. Preenche uma vez — fica guardado e as próximas denúncias
            são geradas logo, sem perguntas.
          </p>
        </div>

        <form onSubmit={guardarIdentidade} className="glass grid gap-4 rounded-2xl p-5">
          <div className="grid gap-2">
            <Label htmlFor="dn-nome">Nome completo</Label>
            <Input
              id="dn-nome"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dn-contacto">Contacto (telefone ou email)</Label>
            <Input
              id="dn-contacto"
              value={form.contacto}
              onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))}
              placeholder="Opcional, mas recomendado"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dn-morada">A tua morada</Label>
            <Input
              id="dn-morada"
              value={form.morada}
              onChange={(e) => setForm((f) => ({ ...f, morada: e.target.value }))}
              placeholder="Opcional"
            />
          </div>

          <div className="flex gap-2">
            {identidadeCompleta && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAEditarIdentidade(false)}
                disabled={aGuardar}
              >
                Cancelar
              </Button>
            )}
            <Button type="submit" className="glow-amber flex-1 gap-2" disabled={aGuardar}>
              {aGuardar && <Loader2 className="size-4 animate-spin" />}
              Guardar e gerar denúncia
            </Button>
          </div>
        </form>
      </div>
    )
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
          <Button variant="secondary" onClick={() => setAEditarIdentidade(true)} className="gap-2">
            Editar os meus dados
          </Button>
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
