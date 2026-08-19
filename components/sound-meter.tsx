"use client"

import { useSoundMeter } from "@/hooks/use-sound-meter"
import { classificarNivel } from "@/lib/ruido"
import { Button } from "@/components/ui/button"
import { Mic, Square, RotateCcw } from "lucide-react"

const TOM_COR: Record<string, string> = {
  ok: "text-chart-3",
  aviso: "text-accent",
  critico: "text-destructive",
}

type Props = {
  onCapturar?: (valores: { laeq: number; max: number }) => void
}

export function SoundMeter({ onCapturar }: Props) {
  const { state, iniciar, parar, reiniciarEstatisticas } = useSoundMeter()
  const nivel = classificarNivel(state.atual)
  // arco de 0 a 120 dB
  const pct = Math.max(0, Math.min(100, (state.atual / 120) * 100))

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex h-56 w-56 items-center justify-center">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth="14"
          />
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke={
              nivel.tom === "critico"
                ? "var(--color-destructive)"
                : nivel.tom === "aviso"
                  ? "var(--color-accent)"
                  : "var(--color-chart-3)"
            }
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 553} 553`}
            className="transition-all duration-150 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-mono text-5xl font-semibold tabular-nums text-foreground">
            {state.ativo ? state.atual.toFixed(0) : "--"}
          </span>
          <span className="text-sm text-muted-foreground">dB(A) aprox.</span>
          <span className={`mt-1 text-sm font-medium ${TOM_COR[nivel.tom]}`}>
            {state.ativo ? nivel.label : "Inativo"}
          </span>
        </div>
      </div>

      <div className="grid w-full grid-cols-3 gap-2 text-center">
        <Stat label="Mín" valor={state.ativo && isFinite(state.min) ? state.min : null} />
        <Stat label="LAeq" valor={state.ativo ? state.laeq : null} destaque />
        <Stat label="Máx" valor={state.ativo ? state.max : null} />
      </div>

      {state.erro && (
        <p className="text-center text-sm text-destructive" role="alert">
          {state.erro}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {!state.ativo ? (
          <Button onClick={iniciar} className="gap-2">
            <Mic className="size-4" />
            Iniciar medição
          </Button>
        ) : (
          <Button onClick={parar} variant="destructive" className="gap-2">
            <Square className="size-4" />
            Parar
          </Button>
        )}
        <Button
          onClick={reiniciarEstatisticas}
          variant="secondary"
          className="gap-2"
          disabled={!state.ativo}
        >
          <RotateCcw className="size-4" />
          Repor
        </Button>
        {onCapturar && (
          <Button
            onClick={() => onCapturar({ laeq: state.laeq, max: state.max })}
            variant="outline"
            disabled={!state.ativo || state.amostras < 5}
          >
            Usar na medição
          </Button>
        )}
      </div>

      <p className="max-w-md text-center text-xs leading-relaxed text-muted-foreground">
        Medição indicativa e não calibrada, obtida pelo microfone do dispositivo. Não substitui um
        sonómetro certificado nem tem valor legal oficial, mas serve como registo de suporte à
        denúncia.
      </p>
    </div>
  )
}

function Stat({ label, valor, destaque }: { label: string; valor: number | null; destaque?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={`font-mono text-xl font-semibold tabular-nums ${destaque ? "text-primary" : "text-foreground"}`}
      >
        {valor == null ? "--" : valor.toFixed(1)}
      </div>
    </div>
  )
}
