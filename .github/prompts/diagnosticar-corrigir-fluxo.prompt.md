---
description: "Diagnostique e corrige um comportamento quebrado percorrendo a interface, a API e o backend do DMS."
name: diagnosticar-corrigir-fluxo
argument-hint: "Descreva o comportamento esperado e o que acontece"
agent: agent
---

# Diagnosticar e corrigir um fluxo do DMS

Investigue e corrija este sintoma: `${input:sintoma:descreva o problema observado}`

## Processo

1. Leia as instruções do projeto e os arquivos diretamente envolvidos. Siga o caminho completo do evento na interface até a resposta da API e o estado exibido ao usuário.
2. Formule uma hipótese local e verificável para a causa; identifique o teste ou checagem mais barata que pode confirmá-la ou descartá-la.
3. Reproduza o problema com um teste ou uma checagem focada antes de alterar o comportamento, sempre que a infraestrutura existente permitir.
4. Corrija a causa raiz com a menor alteração coerente com a arquitetura do DMS. Preserve dados e alterações existentes.
5. Execute a verificação focada e os testes relacionados. Se a hipótese estiver errada, siga o próximo ponto do fluxo com base na evidência observada.

## Restrições do projeto

- Backend: Node.js, Express, CommonJS e `node:test`.
- Frontend: React com componentes funcionais e hooks, Vite e `fetch` pelo prefixo `/api`.
- Backend organizado em `routes -> controllers -> services -> repositories`.
- Uploads exclusivamente no filesystem local em `backend/storage`, usando Multer `diskStorage`; metadados em memória.
- Considere o contrato atual de `X-User-Id`, os campos multipart, os status HTTP e os estados de carregamento/erro da interface.
- Não adicione dependências sem necessidade comprovada. Não faça refatorações fora do fluxo investigado.

## Resultado

Informe a causa confirmada, a correção realizada, os arquivos afetados e os comandos de validação executados. Diferencie fatos verificados de limitações que não puderam ser reproduzidas.