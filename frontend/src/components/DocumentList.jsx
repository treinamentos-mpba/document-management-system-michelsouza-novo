import DownloadButton from './DownloadButton.jsx';
import formatFileSize from '../utils/formatFileSize.js';

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function DocumentList({
  documents,
  downloadError,
  downloadingId,
  error,
  isLoading,
  onDownload,
  onRefresh,
  userId,
}) {
  return (
    <section className="documents-panel" aria-labelledby="documents-title">
      <div className="section-title-row list-title-row">
        <div>
          <p className="section-kicker">BIBLIOTECA</p>
          <h2 id="documents-title">Documentos</h2>
        </div>
        <button
          className="text-button"
          type="button"
          onClick={onRefresh}
          disabled={!userId || isLoading}
        >
          <span aria-hidden="true">↻</span> Atualizar
        </button>
      </div>

      {error && <p className="list-message error-message" role="alert">{error}</p>}
      {downloadError && <p className="list-message error-message" role="alert">{downloadError}</p>}

      {!userId ? (
        <div className="empty-state">
          <span className="empty-mark" aria-hidden="true">—</span>
          <p>Escolha um identificador para carregar a biblioteca.</p>
        </div>
      ) : isLoading && documents.length === 0 ? (
        <div className="empty-state" role="status">
          <span className="loading-mark" aria-hidden="true" />
          <p>Carregando documentos...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <span className="empty-mark" aria-hidden="true">0</span>
          <p>Nenhum documento enviado para este identificador.</p>
        </div>
      ) : (
        <>
          <div className="document-list-header" aria-hidden="true">
            <span>ARQUIVO</span>
            <span>ENVIADO</span>
            <span>TAMANHO</span>
            <span />
          </div>
          <ul className="document-list">
            {documents.map((document) => (
              <li className="document-row" key={document.id}>
                <div className="document-name">
                  <span className="file-mark" aria-hidden="true">FILE</span>
                  <span className="document-name-copy">
                    <strong title={document.originalName}>{document.originalName}</strong>
                    <span>{document.id.slice(0, 8)}</span>
                  </span>
                </div>
                <span className="document-date">{formatDate(document.uploadedAt)}</span>
                <span className="document-size">{formatFileSize(document.size)}</span>
                <DownloadButton
                  fileName={document.originalName}
                  isLoading={downloadingId === document.id}
                  onClick={() => onDownload(document)}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}