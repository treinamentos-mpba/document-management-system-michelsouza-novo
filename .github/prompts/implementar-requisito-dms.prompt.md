---
description: "Implemente um requisito da especificação do DMS com mudanças mínimas, testes e validação alinhados à arquitetura existente."
name: implementar-requisito-dms
argument-hint: "ID do requisito ou descrição do comportamento"
agent: agent
---

# Implementar requisito do DMS

Implemente o requisito `${input:requisito:ID do requisito ou comportamento solicitado}` conforme `docs/specs/dms-spec.md`.

## Processo

1. Consulte `docs/specs/dms-spec.md`, `.github/copilot-instructions.md` e as implementações/testes mais próximos do requisito.
2. Extraia os critérios de aceite relevantes e identifique a menor superfície de código necessária.
3. Crie ou ajuste testes antes da implementação usando os padrões existentes. No backend, use `node:test`; no frontend, confira a infraestrutura disponível antes de propor novos pacotes.
4. Implemente o comportamento mantendo as APIs públicas e as convenções do projeto. Evite criar abstrações ou alterar arquivos não relacionados.
5. Execute primeiro a validação mais específica e depois os gates necessários para a mudança. Corrija falhas relacionadas e repita a validação.

## Regras obrigatórias

- Mantenha a separação do backend `routes -> controllers -> services -> repositories`.
- Use `fetch` no frontend por meio de `/api` e mantenha os contratos de cabeçalho, corpo, resposta e erro descritos na especificação.
- Grave arquivos somente em `backend/storage` com Multer `diskStorage`; mantenha metadados em memória nesta fase.
- Não adicione armazenamento externo, banco de dados, autenticação ou dependências sem solicitação explícita.
- Trate `X-User-Id` como identificador fornecido pelo cliente, não como autenticação.

## Resultado

Resuma o requisito implementado, as decisões relevantes, os testes executados e qualquer critério de aceite que permaneça pendente.