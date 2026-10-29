# Especificação - Document Management System (DMS)

## 1. Objetivo

Entregar uma aplicação web que permita ao usuário enviar, listar e baixar seus documentos, armazenando os arquivos no filesystem local e mantendo seus metadados em memória nesta versão.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos associados ao usuário informado na requisição.
- Download de um documento por identificador, somente pelo usuário proprietário.
- Armazenamento dos arquivos em `backend/storage`, usando Multer com `diskStorage`.
- Persistência em memória dos metadados enquanto o processo do backend estiver ativo.
- Interface web para envio, listagem e download.

### Fora do escopo

- Armazenamento em nuvem, serviços de upload de terceiros ou banco de dados.
- Persistência dos metadados entre reinicializações do backend.
- Autenticação, cadastro de usuários, autorização baseada em papéis ou gestão de sessões.
- Versionamento, edição, compartilhamento, busca avançada ou exclusão de documentos.
- Visualização ou conversão do conteúdo dos arquivos.
- Restrição de upload por tipo de arquivo nesta versão.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O sistema deve aceitar o envio de um documento em `multipart/form-data`, no campo `file`. | Com arquivo válido e usuário informado, deve gravar o arquivo localmente e retornar seus metadados com status `201`. |
| RF-02 | O sistema deve associar cada documento ao usuário indicado pelo cabeçalho `X-User-Id`. | A resposta de upload deve incluir o identificador do proprietário no campo `owner`. |
| RF-03 | O sistema deve rejeitar upload sem arquivo ou sem um `X-User-Id` não vazio. | A requisição deve falhar sem criar metadados; ausência de arquivo retorna `400`, e ausência de usuário retorna `400`. |
| RF-04 | O sistema deve limitar o tamanho de cada arquivo a 10 MiB (10.485.760 bytes). | Arquivos acima do limite devem ser rejeitados com `413`; nenhum documento deve ser registrado como enviado com sucesso. |
| RF-05 | O sistema deve gerar um identificador único para cada documento e um nome de armazenamento controlado pelo servidor. | O nome original fornecido pelo cliente não deve ser usado como caminho de armazenamento. |
| RF-06 | O sistema deve listar somente documentos pertencentes ao usuário indicado por `X-User-Id`. | A lista deve ser vazia quando o usuário não tiver documentos e não deve conter documentos de outros usuários. |
| RF-07 | O sistema deve ordenar a lista do documento mais recente para o mais antigo. | Em caso de empate de data/hora, a ordenação deve usar `id` em ordem crescente para ser determinística. |
| RF-08 | O sistema deve disponibilizar o download de um documento pelo identificador, somente para seu proprietário. | Download existente e autorizado retorna o conteúdo binário; identificador inexistente ou não pertencente ao usuário retorna `404`. |
| RF-09 | O frontend deve permitir selecionar e enviar um arquivo, apresentar os documentos do usuário e iniciar o download de um documento. | A interface deve apresentar estados de carregamento, sucesso e erro para as operações. |
| RF-10 | O frontend deve informar falhas de validação e de comunicação sem apresentar sucesso falso. | Após resposta de erro, a interface deve manter ou atualizar seu estado de forma coerente com a resposta recebida. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O backend deve ser implementado em Node.js e Express, em JavaScript CommonJS; o frontend deve usar React e Vite em JavaScript ESM. |
| RNF-02 | O backend deve seguir a separação `routes → controllers → services → repositories`; dependências apontam das camadas externas para as internas. |
| RNF-03 | Os arquivos devem ser gravados exclusivamente no filesystem local em `backend/storage`, por meio do Multer configurado com `diskStorage`. |
| RNF-04 | Os metadados devem permanecer em memória durante a execução do processo. O filesystem local não deve ser apresentado como persistência durável dos metadados. |
| RNF-05 | Configurações operacionais, como a porta do servidor, devem ser obtidas por variáveis de ambiente quando aplicável, com valores padrão documentados. |
| RNF-06 | As respostas da API devem usar UTF-8 e JSON para operações que não retornam conteúdo de arquivo. Downloads devem retornar bytes, sem conversão do conteúdo. |
| RNF-07 | A pasta de armazenamento não deve ser exposta como diretório estático; o acesso aos arquivos deve ocorrer pelo caso de uso de download, após verificação de propriedade. |
| RNF-08 | O nome original deve ser tratado como dado não confiável. Ele não pode controlar o caminho físico do arquivo e deve ser codificado com segurança nos cabeçalhos de download. |
| RNF-09 | A primeira versão não oferece autenticação. `X-User-Id` é um identificador declarado pelo cliente e não prova a identidade do usuário. |

## 5. Modelo de dados

### Metadados do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | UUID gerado pelo servidor e usado nas operações de listagem e download. |
| `originalName` | string | Sim | Nome original informado para o arquivo, preservado para exibição e download. |
| `size` | number | Sim | Tamanho do arquivo em bytes, validado pelo backend; máximo de 10.485.760. |
| `uploadedAt` | string | Sim | Data e hora do upload em ISO 8601, normalizada para UTC. |
| `owner` | string | Sim | Valor não vazio recebido em `X-User-Id`. |

Os cinco campos acima formam o contrato público dos metadados. O repositório pode manter também um nome de arquivo gerado pelo servidor (por exemplo, UUID sem extensão) para localizar o conteúdo. Esse dado interno não deve ser retornado pela API. O caminho absoluto pode ser derivado do diretório de armazenamento configurado e do nome interno; não deve ser aceito do cliente nem montado a partir de `originalName`.

Os metadados ficam em uma coleção em memória indexada por `id`. O repositório é a fonte de leitura para os casos de uso durante a vida do processo. Após reiniciar o backend, a coleção fica vazia mesmo que arquivos permaneçam em `backend/storage`; a limpeza ou recuperação desses arquivos não faz parte desta versão.

### Regras de integridade

- `id` é único e gerado pelo servidor.
- `owner` deve conter ao menos um caractere não branco; o valor recebido deve ser preservado sem conversão implícita de identidade.
- `size` deve corresponder ao tamanho efetivamente recebido pelo backend.
- `uploadedAt` é atribuído pelo servidor após o recebimento bem-sucedido do arquivo.
- Uma falha ao gravar o arquivo não pode criar metadados. Uma falha ao registrar metadados após gravar o arquivo deve tentar remover o arquivo recém-gravado para evitar órfão.
- O nome original não precisa ser único. O nome físico gerado pelo servidor evita colisões e travessia de diretório.

## 6. Contratos de API

### Convenções

- As rotas do backend são `/upload`, `/documents` e `/documents/:id/download`.
- O frontend chama essas rotas com o prefixo `/api` (`/api/upload`, `/api/documents` e `/api/documents/:id/download`). No desenvolvimento, o proxy do Vite remove `/api` antes de encaminhar a requisição ao backend. Em outros ambientes, o roteamento deve preservar essa equivalência.
- `X-User-Id` é obrigatório em todas as operações documentais. Seu valor é um identificador de usuário fornecido pelo cliente, não uma credencial autenticada.
- Respostas de erro JSON usam a forma `{ "error": { "code": "...", "message": "..." } }` e `Content-Type: application/json; charset=utf-8`.
- O backend não deve revelar se um documento existe quando o usuário não é seu proprietário; ambos os casos retornam `404`.

### POST `/upload`

**Finalidade:** gravar um arquivo localmente e registrar os metadados em memória.

**Cabeçalhos:**

```http
X-User-Id: user-123
Content-Type: multipart/form-data; boundary=...
```

**Corpo:** campo de formulário `file` contendo exatamente um arquivo. Outros campos multipart são ignorados nesta versão.

**Sucesso — `201 Created`:** retorna os metadados do documento como objeto JSON.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-10-29T12:00:00.000Z",
  "owner": "user-123"
}
```

**Erros:**

| Status | Código | Condição |
| --- | --- | --- |
| `400` | `USER_ID_REQUIRED` | `X-User-Id` ausente ou vazio. |
| `400` | `FILE_REQUIRED` | Campo `file` ausente ou sem arquivo. |
| `413` | `FILE_TOO_LARGE` | Arquivo acima de 10 MiB. |
| `500` | `STORAGE_ERROR` | Falha ao gravar o arquivo ou registrar os metadados. |

### GET `/documents`

**Finalidade:** listar os metadados dos documentos do usuário.

**Cabeçalhos:**

```http
X-User-Id: user-123
```

**Sucesso — `200 OK`:** retorna um array JSON, inclusive quando não houver documentos. A ordem é `uploadedAt` decrescente e, em empate, `id` crescente.

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-10-29T12:00:00.000Z",
    "owner": "user-123"
  }
]
```

Sem documentos, a resposta é `[]`. Documento de outro proprietário nunca aparece na lista.

**Erros:** `400 USER_ID_REQUIRED` se o cabeçalho estiver ausente ou vazio; `500 INTERNAL_ERROR` para falha inesperada ao consultar o repositório.

### GET `/documents/:id/download`

**Finalidade:** transmitir os bytes do arquivo associado ao identificador, se ele pertencer ao usuário.

**Cabeçalhos:**

```http
X-User-Id: user-123
```

**Sucesso — `200 OK`:** corpo binário original, sem transformação; `Content-Type: application/octet-stream`; `Content-Length` correspondente ao tamanho registrado; `Content-Disposition: attachment` com o nome original codificado de forma segura conforme RFC 5987 (parâmetro `filename*`). O cabeçalho não pode permitir injeção de CR/LF.

**Erros:** `400 USER_ID_REQUIRED` se o cabeçalho estiver ausente ou vazio; `404 DOCUMENT_NOT_FOUND` se o ID não existir, não pertencer ao usuário ou se o arquivo físico não estiver disponível; `500 INTERNAL_ERROR` para falhas inesperadas de leitura. Em todos os erros, o corpo segue o formato JSON comum.

### Significado dos status

- `200`: listagem concluída ou download transmitido.
- `201`: arquivo gravado e metadados registrados.
- `400`: entrada obrigatória ausente ou inválida.
- `404`: documento inexistente, não pertencente ao usuário ou indisponível no disco.
- `413`: arquivo maior que o limite configurado.
- `500`: erro interno não previsto pelas validações anteriores.

## 7. Decisões arquiteturais

### Backend

- **Routes:** associam método e caminho HTTP ao controller, sem implementar regra de negócio.
- **Controllers:** leem cabeçalhos, parâmetros e dados multipart; validam a forma básica da entrada; chamam services e convertem resultados em status, cabeçalhos e respostas HTTP.
- **Services:** aplicam as regras de propriedade, tamanho, ordenação e fluxo de upload/listagem/download; coordenam as operações necessárias sem conhecer Express ou detalhes do Multer.
- **Repositories:** mantêm e consultam metadados em memória e fornecem a localização interna do arquivo para operações do domínio. O acesso ao filesystem deve ficar encapsulado na infraestrutura de persistência local.
- **Multer:** configurado com `diskStorage` para escrever em `backend/storage`, limite de 10 MiB e nome gerado pelo servidor. A rota não deve expor diretamente caminhos locais.

### Frontend

- Aplicação React com componentes funcionais e hooks, organizada em componentes, páginas e serviços.
- Chamadas HTTP por `fetch`, usando `/api` como prefixo; o proxy do Vite encaminha ao backend no desenvolvimento.
- A interface identifica o usuário enviando `X-User-Id`, de acordo com a forma simples definida para esta versão. Como não existe autenticação, esse valor não deve ser tratado como prova de identidade.
- A interface mostra nome, tamanho e data do documento, oferece ações de upload e download e informa estados de carregamento, lista vazia e erro.

### Armazenamento e limites operacionais

- Os bytes são armazenados apenas localmente em `backend/storage`; não usar armazenamento externo ou serviço de terceiros.
- Os metadados são voláteis. Reiniciar o processo elimina o índice em memória, tornando indisponíveis para consulta os arquivos que permanecerem no disco.
- A solução não promete durabilidade, recuperação após reinicialização ou isolamento real entre usuários enquanto não houver autenticação confiável.
- Erros de filesystem devem ser tratados na fronteira da infraestrutura e convertidos em respostas HTTP sem expor caminhos internos ou detalhes sensíveis.

## 8. Plano de execução

As etapas abaixo descrevem a sequência futura de entrega do produto em nível funcional. Esta especificação não executa nem divide a implementação por arquivos de backend ou frontend.

1. **Fundação e regras:** confirmar configuração local, limite de upload, identificação declarada do usuário, formato de erros e responsabilidades arquiteturais.
2. **Fluxo de upload:** concluir validação, gravação local com nome gerado, registro de metadados em memória e tratamento de falhas sem registros inconsistentes.
3. **Consulta e download:** disponibilizar listagem ordenada e filtrada por proprietário, além do download binário com verificação de propriedade e cabeçalho de nome seguro.
4. **Experiência web:** integrar envio, atualização da lista, estados vazios e de erro, e download usando a API sob o prefixo `/api`.
5. **Verificação funcional:** validar cenários de sucesso, campos ausentes, limite excedido, isolamento por proprietário, documento indisponível e perda dos metadados após reinicialização.

## 9. Premissas e riscos conhecidos

- O valor de `X-User-Id` é fornecido pelo cliente e pode ser falsificado. A separação por proprietário é uma regra funcional, não uma barreira de segurança contra usuários não autenticados.
- O limite de tamanho não implica validação ou segurança do conteúdo. Como os tipos não são restringidos, os arquivos não devem ser executados nem servidos como conteúdo ativo.
- Metadados em memória e arquivos em disco têm ciclos de vida diferentes; reinicializações podem deixar arquivos sem referência.
- O contrato não inclui paginação, exclusão, busca, autenticação ou retenção/limpeza automática de arquivos.
- O proxy `/api` é uma convenção de desenvolvimento do frontend. O ambiente de produção deverá encaminhar o mesmo prefixo às rotas correspondentes do backend.