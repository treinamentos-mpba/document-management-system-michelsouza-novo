async function request(path, userId, options = {}) {
  if (!userId?.trim()) {
    throw new Error('Informe um identificador de usuário antes de continuar.');
  }

  const headers = new Headers(options.headers);
  headers.set('X-User-Id', userId);

  const response = await fetch(`/api${path}`, { ...options, headers });
  if (!response.ok) {
    let message = 'Não foi possível concluir a operação.';
    try {
      const body = await response.json();
      message = body.error?.message || message;
    } catch {
      // A resposta pode não conter JSON em falhas de infraestrutura.
    }
    throw new Error(message);
  }

  return response;
}

export async function listDocuments(userId, { signal } = {}) {
  const response = await request('/documents', userId, { signal });
  return response.json();
}

export async function uploadDocument(userId, file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', userId, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

export async function downloadDocument(userId, document) {
  const response = await request(
    `/documents/${encodeURIComponent(document.id)}/download`,
    userId,
  );
  const file = await response.blob();
  const objectUrl = URL.createObjectURL(file);
  const link = window.document.createElement('a');
  link.href = objectUrl;
  link.download = document.originalName;
  window.document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}