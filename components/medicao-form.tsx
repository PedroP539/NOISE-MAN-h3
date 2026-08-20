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
import { SoundMeter } from "@/components/sound-meter"
import { PERIODOS, periodoAtual, type Medicao, type PeriodoReferencia } from "@/lib/ruido"

type Props = {
  onSubmit: (payload: Partial<Medicao>) => Promise<void>
}

export function MedicaoForm({ onSubmit }: Props) {
  const [periodo, setPeriodo] = useState<PeriodoReferencia>(periodoAtual())
  const [ambiente, setAmbiente] = useState("")
  const [max, setMax] = useState("")
  const [residual, setResidual] = useState("")
  const [duracao, setDuracao] = useState("")
  const [obs, setObs] = useState("")
  const [enviar, setEnviar] = useState(false)

  function capturar({ laeq, max }: { laeq: number; max: number }) {
    setAmbiente(laeq.toFixed(1))
    setMax(max.toFixed(1))
  }

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviar(true)
    try {
      await onSubmit({
        periodo,
        laeqAmbiente: Number(ambiente || 0),
        laeqResidual: residual === "" ? null : Number(residual),
        lafMax: max === "" ? null : Number(max),
        duracaoMinutos: duracao === "" ? null : Number(duracao),
        observacoes: obs,
      })
      setAmbiente("")
      setMax("")
      setResidual("")
      setDuracao("")
      setObs("")
    } finally {
      setEnviar(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="glass-surface rounded-xl p-6">
        <SoundMeter onCapturar={capturar} />
      </div>

      <form onSubmit={handle} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Período de referência (RGR)</Label>
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoReferencia)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PERIODOS) as PeriodoReferencia[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {PERIODOS[k].label} · {PERIODOS[k].horario}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <NumCampo
            id="ambiente"
            label="LAeq ambiente dB(A) *"
            hint="Com a fonte a funcionar"
            value={ambiente}
            onChange={setAmbiente}
            required
          />
          <NumCampo
            id="residual"
            label="LAeq residual dB(A)"
            hint="Sem a fonte (silêncio de fundo)"
            value={residual}
            onChange={setResidual}
          />
          <NumCampo
            id="max"
            label="Pico máximo dB(A)"
            value={max}
            onChange={setMax}
          />
          <NumCampo
            id="duracao"
            label="Duração da fonte (min)"
            hint="Minutos no período"
            value={duracao}
            onChange={setDuracao}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="obs">Observações</Label>
          <Textarea
            id="obs"
            rows={3}
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Condições da medição, distância à fonte, etc."
          />
        </div>

        <Button type="submit" disabled={enviar || ambiente === ""}>
          {enviar ? "A registar..." : "Registar medição"}
        </Button>

        <p className="text-xs leading-relaxed text-muted-foreground">
          O critério de incomodidade (art. 13.º do RGR) compara o ruído ambiente com o residual. Meça
          ambos para uma avaliação mais completa. Insira o residual manualmente medindo com a fonte
          desligada.
        </p>
      </form>
    </div>
  )
}

function NumCampo({
  id,
  label,
  hint,
  value,
  onChange,
  required,
}: {
  id: string
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step="0.1"
        min="0"
        max="140"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
