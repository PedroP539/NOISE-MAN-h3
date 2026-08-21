"use client"

import { useMemo, useState } from "react"
import { Loader2, Mic, Save, ArrowRight, ArrowLeft, FileText, Clock, Check } from "lucide-react"

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
import { PERIODOS, periodoAtual, type Local, type Medicao, type PeriodoReferencia } from "@/lib/ruido"

type Props = {
  locais: Local[]
  criarLocal: (payload: Partial<Local>) => Promise<Local>
  adicionarMedicao: (id: string, payload: Partial<Medicao>) => Promise<void>
  onConcluir: () => void
  onDenunciar: (localId: string) => void
}

type ValoresCapturados = { laeq: number; max: number }

function sugestaoNome() {
  const agora = new Date()
  const data = agora.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })
  const hora = agora.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
  return `Ruído ${data} ${hora}`
}

export function WizardMedicao({
  locais,
  criarLocal,
  adicionarMedicao,
  onConcluir,
  onDenunciar,
}: Props) {
  // passo: medir → local → guardar → sucesso
  const [passo, setPasso] = useState<"medir" | "local" | "guardar" | "sucesso">("medir")
  const [capturado, setCapturado] = useState<ValoresCapturados | null>(null)
  const [periodo, setPeriodo] = useState<PeriodoReferencia>(periodoAtual())
  const [obs, setObs] = useState("")
  const [detalhesAbertos, setDetalhesAbertos] = useState(false)
  const [residual, setResidual] = useState("")
  const [duracao, setDuracao] = useState("")

  const [modoLocal, setModoLocal] = useState<"existente" | "novo">(
    locais.length > 0 ? "existente" : "novo",
  )
  const [localId, setLocalId] = useState<string | null>(null)
  const [busca, setBusca] = useState("")
  const [nomeNovo, setNomeNovo] = useState(sugestaoNome())
  const [moradaNova, setMoradaNova] = useState("")

  const [aGuardar, setAGuardar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [localGuardadoId, setLocalGuardadoId] = useState<string | null>(null)

  const locaisFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return locais
    return locais.filter(
      (l) => l.nome.toLowerCase().includes(termo) || l.morada.toLowerCase().includes(termo),
    )
  }, [locais, busca])

  const localEscolhido =
    modoLocal === "existente" ? locais.find((l) => l.id === localId) ?? null : null

  async function guardar() {
    setErro(null)
    setAGuardar(true)
    try {
      let alvoId = localGuardadoId

      if (modoLocal === "novo") {
        if (nomeNovo.trim().length < 2) throw new Error("Indica um nome para o local")
        const novo = await criarLocal({ nome: nomeNovo.trim(), morada: moradaNova.trim() })
        alvoId = novo.id
      } else if (!localEscolhido) {
        throw new Error("Escolhe um local existente ou cria um novo")
      } else {
        alvoId = localEscolhido.id
      }

      await adicionarMedicao(alvoId!, {
        periodo,
        laeqAmbiente: capturado!.laeq,
        lafMax: capturado!.max,
        laeqResidual: residual === "" ? null : Number(residual),
        duracaoMinutos: duracao === "" ? null : Number(duracao),
        observacoes: obs,
      })

      setLocalGuardadoId(alvoId!)
      setPasso("sucesso")
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao guardar")
    } finally {
      setAGuardar(false)
    }
  }

  // ---------- PASSO 1 · MEDIR ----------
  if (passo === "medir") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <Cabecalho passo={1} titulo="Medir o ruído" />
        <p className="-mt-3 text-center text-sm text-muted-foreground">
          Inicia o microfone, deixa correr alguns segundos e captura. O período já vem sugerido
          pela hora atual.
        </p>

        <div className="glass rounded-2xl p-6">
          <SoundMeter
            onCapturar={(v) => {
              setCapturado(v)
            }}
          />

          <div className="mt-6 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Período de referência</Label>
                <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoReferencia)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERIODOS).map(([valor, p]) => (
                      <SelectItem key={valor} value={valor}>
                        {p.label} · {p.horario}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid content-end gap-2">
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Capturado
                  </span>
                  <div className="font-mono text-sm tabular-nums">
                    {capturado
                      ? `LAeq ${capturado.laeq.toFixed(1)} dB(A) · pico ${capturado.max.toFixed(1)}`
                      : "— ainda nada"}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDetalhesAbertos((a) => !a)}
              className="text-left text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              {detalhesAbertos ? "− Esconder detalhes opcionais" : "+ Detalhes opcionais (residual, duração, notas)"}
            </button>
            {detalhesAbertos && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="wz-residual">LAeq residual (sem a fonte)</Label>
                  <Input
                    id="wz-residual"
                    type="number"
                    step="0.1"
                    placeholder="Opcional"
                    value={residual}
                    onChange={(e) => setResidual(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="wz-duracao">Duração da fonte (min)</Label>
                  <Input
                    id="wz-duracao"
                    type="number"
                    placeholder="Opcional"
                    value={duracao}
                    onChange={(e) => setDuracao(e.target.value)}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="wz-obs">Observações</Label>
                  <Textarea
                    id="wz-obs"
                    rows={2}
                    maxLength={500}
                    placeholder="Ex.: música com graves, janelas fechadas"
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          size="lg"
          className="glow-amber w-full gap-2"
          disabled={!capturado}
          onClick={() => setPasso("local")}
        >
          Continuar
          <ArrowRight className="size-4" />
        </Button>
      </div>
    )
  }

  // ---------- PASSO 2 · LOCAL ----------
  if (passo === "local") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <Cabecalho passo={2} titulo="Onde foi?" />
        <p className="-mt-3 text-center text-sm text-muted-foreground">
          Associa a medição a um local existente ou cria um novo em segundos — os detalhes ficam
          para depois.
        </p>

        <div className="glass grid gap-4 rounded-2xl p-5">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={modoLocal === "existente" ? "default" : "secondary"}
              onClick={() => locais.length > 0 && setModoLocal("existente")}
              disabled={locais.length === 0}
            >
              Local existente
            </Button>
            <Button
              type="button"
              variant={modoLocal === "novo" ? "default" : "secondary"}
              onClick={() => setModoLocal("novo")}
            >
              Novo local rápido
            </Button>
          </div>

          {modoLocal === "existente" ? (
            <>
              <Input
                placeholder="Procurar por nome ou morada..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <ul className="grid max-h-64 gap-2 overflow-y-auto pr-1">
                {locaisFiltrados.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => setLocalId(l.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                        localId === l.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card/50 hover:border-primary/50"
                      }`}
                    >
                      <span>
                        <span className="block font-medium">{l.nome}</span>
                        <span className="block text-xs text-muted-foreground">{l.morada}</span>
                      </span>
                      {localId === l.id && <Check className="size-4 text-primary" />}
                    </button>
                  </li>
                ))}
                {locaisFiltrados.length === 0 && (
                  <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    Nenhum local encontrado.
                  </li>
                )}
              </ul>
            </>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="wz-nome">Nome do local / fonte</Label>
                <Input
                  id="wz-nome"
                  value={nomeNovo}
                  maxLength={120}
                  onChange={(e) => setNomeNovo(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Sugerimos um nome pela hora atual — edita se quiseres.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wz-morada">Morada (opcional)</Label>
                <Input
                  id="wz-morada"
                  value={moradaNova}
                  maxLength={200}
                  placeholder="Preenches depois, se quiseres"
                  onChange={(e) => setMoradaNova(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" className="gap-2" onClick={() => setPasso("medir")}>
            <ArrowLeft className="size-4" />
            Voltar
          </Button>
          <Button
            size="lg"
            className="glow-amber flex-1 gap-2"
            disabled={modoLocal === "existente" ? !localEscolhido : nomeNovo.trim().length < 2}
            onClick={() => setPasso("guardar")}
          >
            Revisão final
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    )
  }

  // ---------- PASSO 3 · GUARDAR ----------
  if (passo === "guardar") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <Cabecalho passo={3} titulo="Revisão e guardar" />

        <div className="glass grid gap-4 rounded-2xl p-6">
          <Resumo
            rotulo="Medição"
            valor={`LAeq ${capturado!.laeq.toFixed(1)} dB(A) · pico ${capturado!.max.toFixed(1)} dB(A)`}
          />
          <Resumo
            rotulo="Período"
            valor={`${PERIODOS[periodo].label} (${PERIODOS[periodo].horario})`}
          />
          <Resumo
            rotulo="Local"
            valor={
              modoLocal === "novo"
                ? `${nomeNovo.trim()}${moradaNova.trim() ? ` — ${moradaNova.trim()}` : ""}`
                : localEscolhido!.nome
            }
          />
          {obs.trim() && <Resumo rotulo="Notas" valor={obs.trim()} />}
        </div>

        {erro && <p className="text-center text-sm text-destructive">{erro}</p>}

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => setPasso("local")}
            disabled={aGuardar}
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Button>
          <Button
            size="lg"
            className="glow-amber flex-1 gap-2"
            onClick={guardar}
            disabled={aGuardar}
          >
            {aGuardar ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Guardar medição
          </Button>
        </div>
      </div>
    )
  }

  // ---------- SUCESSO ----------
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-8 py-10 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-chart-3/15">
        <Check className="size-8 text-chart-3" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold">Medição guardada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Podes gerar a denúncia agora com os dados que já tens, ou deixar o processo guardado para
          mais tarde — as próximas medições reforçam a queixa.
        </p>
      </div>

      <div className="grid w-full gap-3">
        <Button size="lg" className="glow-amber w-full gap-2" onClick={() => onDenunciar(localGuardadoId!)}>
          <FileText className="size-4" />
          Gerar denúncia agora
        </Button>
        <Button size="lg" variant="secondary" className="w-full gap-2" onClick={onConcluir}>
          <Clock className="size-4" />
          Deixar para mais tarde
        </Button>
      </div>
    </div>
  )
}

function Cabecalho({ passo, titulo }: { passo: 1 | 2 | 3; titulo: string }) {
  const passos = ["Medir", "Local", "Guardar"]
  return (
    <div className="flex flex-col items-center gap-3 pt-2">
      <div className="flex items-center gap-2">
        {passos.map((nome, i) => (
          <div key={nome} className="flex items-center gap-2">
            <span
              className={`flex size-7 items-center justify-center rounded-full border font-mono text-xs ${
                i + 1 <= passo
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-xs ${i + 1 <= passo ? "text-foreground" : "text-muted-foreground"}`}>
              {nome}
            </span>
            {i < passos.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
          </div>
        ))}
      </div>
      <h2 className="flex items-center gap-2 text-2xl font-semibold">
        <Mic className="size-5 text-primary" />
        {titulo}
      </h2>
    </div>
  )
}

function Resumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <span className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</span>
      <span className="text-right text-sm font-medium">{valor}</span>
    </div>
  )
}
