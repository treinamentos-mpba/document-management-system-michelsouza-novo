import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments, uploadDocument, downloadDocument } from './services/api.js';
import formatFileSize from './utils/formatFileSize.js';
import './App.css';

function readSavedUserId() {
  try {
    return window.localStorage.getItem('dms.userId')?.trim() || 'local-user';
  } catch {
    return 'local-user';
  }
}

function saveUserId(userId) {
  try {
    window.localStorage.setItem('dms.userId', userId);
    return true;
  } catch {
    return false;
  }
}

export default function App() {
  const [userId, setUserId] = useState(readSavedUserId);
  const [userIdDraft, setUserIdDraft] = useState(readSavedUserId);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState('');
  const [loadError, setLoadError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    if (!userId) {
      setDocuments([]);
      setIsLoading(false);
      setLoadError('');
      return undefined;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setLoadError('');

    listDocuments(userId, { signal: controller.signal })
      .then(setDocuments)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setLoadError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [userId, refreshVersion]);

  function applyUserId(event) {
    event.preventDefault();
    const nextUserId = userIdDraft.trim();
    if (!nextUserId) {
      setLoadError('Informe um identificador para consultar seus documentos.');
      return;
    }

    const persistenceNotice = saveUserId(nextUserId)
      ? 'Identificador aplicado.'
      : 'Identificador usado apenas nesta sessão.';

    if (nextUserId !== userId) {
      setDocuments([]);
    }
    setUserId(nextUserId);
    setUserIdDraft(nextUserId);
    setNotice(persistenceNotice);
    setUploadError('');
    setDownloadError('');
    setRefreshVersion((version) => version + 1);
  }

  async function handleUpload(file) {
    const uploadUserId = userIdDraft.trim() || userId;
    if (!uploadUserId) {
      setUploadError('Informe um identificador antes de enviar.');
      return false;
    }

    if (uploadUserId !== userId) {
      saveUserId(uploadUserId);
      setDocuments([]);
      setUserId(uploadUserId);
      setUserIdDraft(uploadUserId);
    }

    setIsUploading(true);
    setUploadError('');
    setNotice('');

    try {
      await uploadDocument(uploadUserId, file);
      setNotice(`${file.name} enviado.`);
      setRefreshVersion((version) => version + 1);
      return true;
    } catch (error) {
      setUploadError(error.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(document) {
    setDownloadingId(document.id);
    setDownloadError('');

    try {
      await downloadDocument(userId, document);
    } catch (error) {
      setDownloadError(error.message);
    } finally {
      setDownloadingId('');
    }
  }

  const totalSize = documents.reduce((total, document) => total + document.size, 0);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>ARQUIVO<span className="brand-light"> / DMS</span></span>
        </a>
        <div className="local-indicator"><span aria-hidden="true" /> Armazenamento local</div>
      </header>

      <section className="page-heading" id="inicio">
        <div>
          <p className="eyebrow">DOCUMENT MANAGEMENT SYSTEM</p>
          <h1>Seus documentos<span className="heading-period">.</span></h1>
          <p className="heading-copy">Envie, organize e acesse seus arquivos em um só lugar.</p>
        </div>
        <div className="overview" aria-label="Resumo dos documentos">
          <div className="overview-item">
            <span>DOCUMENTOS</span>
            <strong>{isLoading ? '...' : documents.length}</strong>
          </div>
          <div className="overview-item overview-size">
            <span>ESPAÇO LISTADO</span>
            <strong>{formatFileSize(totalSize)}</strong>
          </div>
        </div>
      </section>

      <section className="identity-bar" aria-labelledby="identity-title">
        <div className="identity-copy">
          <h2 id="identity-title">Identificação</h2>
          <p>Identificador local padrão; troque para separar documentos, sem autenticação.</p>
        </div>
        <form className="identity-form" onSubmit={applyUserId}>
          <label className="visually-hidden" htmlFor="user-id">Identificador do usuário</label>
          <input
            id="user-id"
            autoComplete="username"
            value={userIdDraft}
            onChange={(event) => setUserIdDraft(event.target.value)}
            placeholder="Ex.: equipe-financeiro"
          />
          <button type="submit" className="button button-quiet">Aplicar</button>
        </form>
      </section>

      {notice && <p className="notice" role="status">{notice}</p>}

      <div className="workspace-grid">
        <UploadComponent
          error={uploadError}
          isUploading={isUploading}
          onUpload={handleUpload}
        />
        <DocumentList
          documents={documents}
          downloadError={downloadError}
          downloadingId={downloadingId}
          error={loadError}
          isLoading={isLoading}
          onDownload={handleDownload}
          onRefresh={() => setRefreshVersion((version) => version + 1)}
          userId={userId}
        />
      </div>

      <footer className="app-footer">
        <span>Os arquivos ficam no armazenamento local desta aplicação.</span>
        <span>Metadados disponíveis enquanto o serviço estiver ativo.</span>
      </footer>
    </main>
  );
}
