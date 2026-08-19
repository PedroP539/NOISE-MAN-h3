import {
  avaliarIncomodidade,
  PERIODOS,
  ZONAS,
  type Local,
  type Medicao,
} from "./ruido"

function dataPt(iso: string) {
  return new Date(iso).toLocaleString("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

function linhaMedicao(m: Medicao): string {
  const av = avaliarIncomodidade(m)
  const partes = [
    `- ${dataPt(m.criadoEm)} · Período ${PERIODOS[m.periodo].label.toLowerCase()} (${PERIODOS[m.periodo].horario})`,
    `  LAeq ambiente: ${m.laeqAmbiente.toFixed(1)} dB(A)`,
  ]
  if (m.laeqResidual != null) partes.push(`  LAeq residual: ${m.laeqResidual.toFixed(1)} dB(A)`)
  if (m.lafMax != null) partes.push(`  Pico máximo: ${m.lafMax.toFixed(1)} dB(A)`)
  if (m.duracaoMinutos != null) partes.push(`  Duração da fonte: ${m.duracaoMinutos} min`)
  if (av.aplicavel && av.diferencaCorrigida != null) {
    partes.push(
      `  Diferença ambiente–residual (com correção D=${av.correcaoD}): ${av.diferencaCorrigida.toFixed(1)} dB(A) · limite ${av.limite} dB(A) → ${av.excede ? "EXCEDE" : "conforme"}`,
    )
  }
  if (m.observacoes) partes.push(`  Obs.: ${m.observacoes}`)
  return partes.join("\n")
}

export function gerarTextoDenuncia(local: Local): string {
  const zona = ZONAS[local.classificacaoZona]
  const excedeAlguma = local.medicoes.some((m) => avaliarIncomodidade(m).excede)

  return `EXPOSIÇÃO / DENÚNCIA DE RUÍDO

Ao abrigo do Regulamento Geral do Ruído (Decreto-Lei n.º 9/2007, de 17 de janeiro).

Data da exposição: ${new Date().toLocaleDateString("pt-PT", { dateStyle: "long" })}

1. IDENTIFICAÇÃO DO DENUNCIANTE
Nome: ${local.nomeDenunciante || "[a preencher]"}
Contacto: ${local.contactoDenunciante || "[a preencher]"}
Morada: ${local.moradaDenunciante || "[a preencher]"}

2. IDENTIFICAÇÃO DO LOCAL E DA FONTE
Local / referência: ${local.nome}
Morada da fonte de ruído: ${local.morada}
Freguesia: ${local.freguesia || "[a preencher]"}
Concelho: ${local.concelho || "[a preencher]"}
Classificação da zona: ${zona.label} (limites de referência: Lden ${zona.limiteLden} dB(A) / Ln ${zona.limiteLn} dB(A))
Origem do ruído: ${local.fonteRuido || "[a preencher]"}
Horário do incómodo: ${local.horarioIncomodo || "[a preencher]"}

3. DESCRIÇÃO DA SITUAÇÃO
${local.descricaoFonte || "[descreva o ruído e o impacto no descanso/atividade]"}
${local.notas ? `\nNotas adicionais: ${local.notas}` : ""}

4. REGISTO DE MEDIÇÕES (${local.medicoes.length})
${
  local.medicoes.length === 0
    ? "Sem medições registadas."
    : local.medicoes.map(linhaMedicao).join("\n\n")
}

5. ENQUADRAMENTO LEGAL
Nos termos do artigo 13.º do RGR, a atividade ruidosa permanente está sujeita ao critério de
incomodidade, que corresponde à diferença entre o nível sonoro contínuo equivalente do ruído
ambiente e do ruído residual, com os limites de 5 dB(A) no período diurno, 4 dB(A) no entardecer
e 3 dB(A) no período noturno (acrescidos da correção de duração D do Anexo I).
${
  excedeAlguma
    ? "Das medições registadas resulta que o critério de incomodidade é EXCEDIDO em, pelo menos, uma das medições."
    : "Solicita-se a verificação do cumprimento dos limites aplicáveis à zona e do critério de incomodidade."
}

6. PEDIDO
Solicita-se a V. Exa. a realização de medição acústica por entidade competente e a adoção das
medidas legalmente previstas para fazer cessar o ruído excessivo, incluindo, se aplicável, a
instauração do respetivo procedimento de contraordenação.

Pede deferimento.

______________________________________
${local.nomeDenunciante || "(assinatura do denunciante)"}

---
Documento gerado como suporte à denúncia. As medições obtidas por microfone de dispositivo móvel
são indicativas e não substituem medição com sonómetro certificado.`
}
