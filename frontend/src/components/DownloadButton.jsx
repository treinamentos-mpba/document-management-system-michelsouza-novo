export default function DownloadButton({ disabled, isLoading, fileName, onClick }) {
  return (
    <button
      className="download-button"
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={`Baixar ${fileName}`}
      aria-busy={isLoading}
      title={`Baixar ${fileName}`}
    >
      <span aria-hidden="true">{isLoading ? '…' : '↓'}</span>
      {isLoading ? 'Baixando' : 'Baixar'}
    </button>
  );
}