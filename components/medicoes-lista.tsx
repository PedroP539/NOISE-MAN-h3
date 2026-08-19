"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { avaliarIncomodidade, PERIODOS, type Medicao } from "@/lib/ruido"
import { Trash2 } from "lucide-react"

type Props = {
  medicoes: Medicao[]
  onApagar: (medicaoId: string) => void
}

export function MedicoesLista({ medicoes, onApagar }: Props) {
  if (medicoes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Ainda não há medições registadas para este local.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {medicoes.map((m) => {
        const av = avaliarIncomodidade(m)
        return (
          <div
            key={m.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
                  {m.laeqAmbiente.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">dB(A) ambiente</span>
                <Badge variant="secondary">{PERIODOS[m.periodo].label}</Badge>
                {av.aplicavel &&
                  (av.excede ? (
                    <Badge variant="destructive">Excede incomodidade</Badge>
                  ) : (
                    <Badge className="bg-chart-3 text-background">Conforme</Badge>
                  ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{new Date(m.criadoEm).toLocaleString("pt-PT")}</span>
                {m.laeqResidual != null && <span>Residual: {m.laeqResidual.toFixed(1)} dB(A)</span>}
                {m.lafMax != null && <span>Pico: {m.lafMax.toFixed(1)} dB(A)</span>}
                {m.duracaoMinutos != null && <span>Duração: {m.duracaoMinutos} min</span>}
                {av.aplicavel && av.diferencaCorrigida != null && (
                  <span>
                    Δ corrigida: {av.diferencaCorrigida.toFixed(1)} / {av.limite} dB(A)
                  </span>
                )}
              </div>
              {m.observacoes && (
                <p className="text-sm text-muted-foreground">{m.observacoes}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onApagar(m.id)}
              aria-label="Apagar medição"
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
