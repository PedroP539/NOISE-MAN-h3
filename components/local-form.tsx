"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ZONAS, type ClassificacaoZona, type Local } from "@/lib/ruido"

type Props = {
  onSubmit: (payload: Partial<Local>) => Promise<void>
  onCancel: () => void
}

export function LocalForm({ onSubmit, onCancel }: Props) {
  const [zona, setZona] = useState<ClassificacaoZona>("nao_classificada")
  const [enviar, setEnviar] = useState(false)

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setEnviar(true)
    try {
      await onSubmit({
        nome: String(fd.get("nome") ?? ""),
        morada: String(fd.get("morada") ?? ""),
        freguesia: String(fd.get("freguesia") ?? ""),
        concelho: String(fd.get("concelho") ?? ""),
        classificacaoZona: zona,
        fonteRuido: String(fd.get("fonteRuido") ?? ""),
        descricaoFonte: String(fd.get("descricaoFonte") ?? ""),
        horarioIncomodo: String(fd.get("horarioIncomodo") ?? ""),
        nomeDenunciante: String(fd.get("nomeDenunciante") ?? ""),
        contactoDenunciante: String(fd.get("contactoDenunciante") ?? ""),
        moradaDenunciante: String(fd.get("moradaDenunciante") ?? ""),
        notas: String(fd.get("notas") ?? ""),
      })
    } finally {
      setEnviar(false)
    }
  }

  return (
    <form onSubmit={handle} className="flex flex-col gap-6">
      <Seccao titulo="Identificação do local">
        <Campo id="nome" label="Nome / referência do local *" placeholder="Ex.: Bar do Manel, obra na Rua X" required />
        <Campo id="morada" label="Morada *" placeholder="Rua, número, andar" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="freguesia" label="Freguesia" />
          <Campo id="concelho" label="Concelho" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Classificação da zona (RGR, art. 11.º)</Label>
          <Select value={zona} onValueChange={(v) => setZona(v as ClassificacaoZona)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ZONAS) as ClassificacaoZona[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {ZONAS[k].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{ZONAS[zona].descricao}</p>
        </div>
      </Seccao>

      <Seccao titulo="Fonte do ruído">
        <Campo id="fonteRuido" label="Origem do ruído" placeholder="Ex.: esplanada, equipamento de AVAC, música" />
        <div className="flex flex-col gap-2">
          <Label htmlFor="descricaoFonte">Descrição do incómodo</Label>
          <Textarea
            id="descricaoFonte"
            name="descricaoFonte"
            rows={3}
            placeholder="Descreva o tipo de ruído, frequência e como afeta o descanso/atividade."
          />
        </div>
        <Campo
          id="horarioIncomodo"
          label="Horário em que ocorre"
          placeholder="Ex.: todas as noites entre as 23h e as 03h"
        />
      </Seccao>

      <Seccao titulo="Dados do denunciante (para a denúncia)">
        <Campo id="nomeDenunciante" label="Nome" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="contactoDenunciante" label="Contacto (email/telefone)" />
          <Campo id="moradaDenunciante" label="Morada" />
        </div>
      </Seccao>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notas">Notas adicionais</Label>
        <Textarea id="notas" name="notas" rows={2} />
      </div>

      <div className="flex justify-end gap-2 max-md:justify-center">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviar}>
          {enviar ? "A guardar..." : "Guardar local"}
        </Button>
      </div>
    </form>
  )
}

function Seccao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </h3>
      {children}
    </div>
  )
}

function Campo({
  id,
  label,
  placeholder,
  required,
}: {
  id: string
  label: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} placeholder={placeholder} required={required} />
    </div>
  )
}
