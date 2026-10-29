import { useRef, useState } from 'react';
import formatFileSize from '../utils/formatFileSize.js';

export default function UploadComponent({ disabled, error, isUploading, onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectionError, setSelectionError] = useState('');
  const fileInput = useRef(null);

  async function submitUpload(event) {
    event.preventDefault();
    if (isUploading) return;
    if (disabled) {
      setSelectionError('Informe e aplique um identificador antes de enviar.');
      return;
    }
    if (!selectedFile) {
      setSelectionError('Selecione um arquivo antes de enviar.');
      return;
    }

    const uploaded = await onUpload(selectedFile);
    if (uploaded) {
      setSelectedFile(null);
      setSelectionError('');
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled && !isUploading) {
      const file = event.dataTransfer.files?.[0] || null;
      setSelectedFile(file);
      if (file) setSelectionError('');
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) setSelectionError('');
  }

  return (
    <section className="upload-panel" aria-labelledby="upload-title">
      <div className="section-title-row">
        <div>
          <p className="section-kicker">ADICIONAR</p>
          <h2 id="upload-title">Enviar documento</h2>
        </div>
        <span className="step-mark" aria-hidden="true">01</span>
      </div>

      <form onSubmit={submitUpload}>
        <label
          className={`file-picker${selectedFile ? ' has-file' : ''}${isDragging ? ' is-dragging' : ''}`}
          htmlFor="document-file"
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <span className="upload-symbol" aria-hidden="true">↑</span>
          <span className="file-picker-text">
            <strong>{selectedFile ? selectedFile.name : 'Escolha um arquivo'}</strong>
            <span>{selectedFile ? formatFileSize(selectedFile.size) : 'ou arraste até aqui'}</span>
          </span>
          <span className="browse-label">Procurar</span>
        </label>
        <input
          ref={fileInput}
          className="visually-hidden"
          id="document-file"
          type="file"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />

        <div className="upload-meta">
          <span>Qualquer formato · até 10 MiB</span>
          <button
            className="button button-primary"
            type="submit"
            disabled={isUploading}
          >
            {isUploading ? 'Enviando...' : 'Enviar arquivo'}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>

      {!disabled && error && <p className="inline-error" role="alert">{error}</p>}
  {selectionError && <p className="inline-error" role="alert">{selectionError}</p>}
      {disabled && <p className="inline-hint">Informe um identificador acima para habilitar o envio.</p>}
    </section>
  );
}