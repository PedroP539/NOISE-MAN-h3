# Noise Man

Aplicação web para medir, registar e documentar situações de ruído excessivo em Portugal, criando um documento de apoio a uma eventual denúncia.

## Funcionalidades

- Medição indicativa através do microfone do dispositivo com Web Audio API.
- Registo manual de valores medidos por sonómetro.
- Gestão de locais, fontes de ruído e histórico de medições.
- Avaliação automática com base no Regulamento Geral do Ruído.
- Geração de documento de denúncia pronto para copiar ou imprimir/guardar em PDF.
- Persistência dos locais e medições no Vercel Blob.

## Enquadramento legal

A aplicação considera o Regulamento Geral do Ruído, aprovado pelo **Decreto-Lei n.º 9/2007**, incluindo:

- Períodos diurno (07:00–20:00), entardecer (20:00–23:00) e noturno (23:00–07:00).
- Limites de exposição para zonas sensíveis e zonas mistas.
- Critério de incomodidade previsto no artigo 13.º.

A informação apresentada é apenas um apoio à preparação de uma participação. As medições feitas pelo microfone do dispositivo são indicativas, não calibradas e não substituem medições acústicas realizadas com equipamento certificado por entidade competente.

## Stack

- Next.js 16 e React 19
- TypeScript
- Tailwind CSS 4 e shadcn/ui
- SWR
- Vercel Blob

## Configuração

Instale as dependências e defina a variável `BLOB_READ_WRITE_TOKEN` no ambiente do projeto.

```bash
pnpm install
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Produção

```bash
pnpm build
pnpm start
```

## Estrutura principal

- `app/page.tsx` — página principal.
- `components/` — formulários, medidor, histórico e documento de denúncia.
- `lib/ruido.ts` — regras e cálculos do enquadramento legal.
- `lib/store.ts` — persistência no Vercel Blob.
- `app/api/locais/` — API para locais e medições.

## Projeto v0

Este repositório está ligado ao projeto v0 correspondente e pode continuar a ser desenvolvido através do [v0](https://v0.app/chat/projects/prj_JtuZvJrt5XdGsiTrVDQRxYgVlQY2).
