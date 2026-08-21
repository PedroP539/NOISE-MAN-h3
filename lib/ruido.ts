// Enquadramento legal: Regulamento Geral do Ruído (RGR)
// Decreto-Lei n.º 9/2007, de 17 de janeiro (com alterações posteriores)

export type PeriodoReferencia = "diurno" | "entardecer" | "noturno"

export type ClassificacaoZona = "sensivel" | "mista" | "nao_classificada"

export type Local = {
  id: string
  criadoEm: string
  atualizadoEm: string
  // Identificação do local
  nome: string
  morada: string
  concelho: string
  freguesia: string
  classificacaoZona: ClassificacaoZona
  // Localização GPS (opcional; capturada no momento da medição)
  latitude?: number | null
  longitude?: number | null
  // Fonte do ruído
  fonteRuido: string
  descricaoFonte: string
  horarioIncomodo: string
  // Denunciante
  nomeDenunciante: string
  contactoDenunciante: string
  moradaDenunciante: string
  // Notas livres
  notas: string
  // Medições associadas
  medicoes: Medicao[]
}

/** Distância em metros entre dois pontos (fórmula de haversine). */
export function distanciaMetros(
  a: { latitude?: number | null; longitude?: number | null },
  b: { latitude?: number | null; longitude?: number | null },
): number | null {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) {
    return null
  }
  const R = 6371000
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180
  const lat1 = (a.latitude * Math.PI) / 180
  const lat2 = (b.latitude * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)))
}

export type Medicao = {
  id: string
  criadoEm: string
  periodo: PeriodoReferencia
  // Valores em dB(A)
  laeqAmbiente: number // ruído ambiente (com a fonte a funcionar)
  laeqResidual: number | null // ruído residual (sem a fonte)
  lafMax: number | null // pico máximo registado
  duracaoMinutos: number | null // duração acumulada da fonte no período
  observacoes: string
}

// Períodos de referência do RGR (art. 3.º)
export const PERIODOS: Record<
  PeriodoReferencia,
  { label: string; horario: string; descricao: string }
> = {
  diurno: {
    label: "Diurno",
    horario: "07h00 – 20h00",
    descricao: "Período diurno (13 horas)",
  },
  entardecer: {
    label: "Entardecer",
    horario: "20h00 – 23h00",
    descricao: "Período do entardecer (3 horas)",
  },
  noturno: {
    label: "Noturno",
    horario: "23h00 – 07h00",
    descricao: "Período noturno (8 horas)",
  },
}

export const ZONAS: Record<
  ClassificacaoZona,
  { label: string; descricao: string; limiteLden: number | null; limiteLn: number | null }
> = {
  sensivel: {
    label: "Zona sensível",
    descricao:
      "Área com usos habitacionais, escolares, hospitalares ou de lazer. Limites mais exigentes (art. 11.º).",
    limiteLden: 55,
    limiteLn: 45,
  },
  mista: {
    label: "Zona mista",
    descricao:
      "Área com usos habitacionais e também comércio, serviços ou indústria (art. 11.º).",
    limiteLden: 65,
    limiteLn: 55,
  },
  nao_classificada: {
    label: "Não classificada",
    descricao:
      "Zona ainda não classificada pelo município. Aplica-se, transitoriamente, o limite de zona mista.",
    limiteLden: 65,
    limiteLn: 55,
  },
}

// Critério de incomodidade (art. 13.º) — diferença máxima permitida
// entre o LAeq do ruído ambiente e o LAeq do ruído residual, por período.
export const LIMITE_INCOMODIDADE: Record<PeriodoReferencia, number> = {
  diurno: 5,
  entardecer: 4,
  noturno: 3,
}

// Correção D (fator de duração) do Anexo I do RGR, aplicada em função
// da percentagem de tempo em que a fonte funciona no período.
export function correcaoDuracao(duracaoMinutos: number | null, periodo: PeriodoReferencia): number {
  if (duracaoMinutos == null) return 0
  const duracaoTotal = periodo === "diurno" ? 13 * 60 : periodo === "entardecer" ? 3 * 60 : 8 * 60
  const q = (duracaoMinutos / duracaoTotal) * 100
  if (q <= 12.5) return -1
  if (q <= 25) return 0
  if (q <= 50) return 1
  if (q <= 75) return 2
  return 3
}

export type AvaliacaoIncomodidade = {
  aplicavel: boolean
  diferenca: number | null // ambiente - residual
  correcaoD: number
  diferencaCorrigida: number | null
  limite: number
  excede: boolean
}

export function avaliarIncomodidade(m: Medicao): AvaliacaoIncomodidade {
  const limite = LIMITE_INCOMODIDADE[m.periodo]
  if (m.laeqResidual == null) {
    return {
      aplicavel: false,
      diferenca: null,
      correcaoD: 0,
      diferencaCorrigida: null,
      limite,
      excede: false,
    }
  }
  const diferenca = m.laeqAmbiente - m.laeqResidual
  const correcaoD = correcaoDuracao(m.duracaoMinutos, m.periodo)
  // O valor a comparar é (ambiente corrigido pela duração) - residual.
  const diferencaCorrigida = diferenca + correcaoD
  return {
    aplicavel: true,
    diferenca: Number(diferenca.toFixed(1)),
    correcaoD,
    diferencaCorrigida: Number(diferencaCorrigida.toFixed(1)),
    limite,
    excede: diferencaCorrigida > limite,
  }
}

export type ClassificacaoNivel = {
  label: string
  tom: "ok" | "aviso" | "critico"
}

// Interpretação qualitativa de um nível LAeq medido (indicativo, não calibrado).
export function classificarNivel(db: number): ClassificacaoNivel {
  if (db < 45) return { label: "Silencioso", tom: "ok" }
  if (db < 55) return { label: "Moderado", tom: "ok" }
  if (db < 65) return { label: "Ruidoso", tom: "aviso" }
  if (db < 75) return { label: "Muito ruidoso", tom: "aviso" }
  return { label: "Excessivo", tom: "critico" }
}

export function periodoAtual(date = new Date()): PeriodoReferencia {
  const h = date.getHours()
  if (h >= 7 && h < 20) return "diurno"
  if (h >= 20 && h < 23) return "entardecer"
  return "noturno"
}

export const ENTIDADES_DENUNCIA = [
  "Câmara Municipal (fiscalização municipal / ambiente)",
  "IGAMAOT — Inspeção-Geral da Agricultura, do Mar, do Ambiente e do Ordenamento do Território",
  "APA — Agência Portuguesa do Ambiente",
  "PSP / GNR (ruído de vizinhança e atividades ruidosas)",
  "Entidade licenciadora da atividade",
]
