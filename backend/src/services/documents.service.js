const fs = require('node:fs/promises');
const documentsRepository = require('../repositories/documents.repository');

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

async function createDocument(owner, file) {
  const document = {
    id: file.filename,
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
  };

  try {
    return toPublicDocument(documentsRepository.create(document, file.filename));
  } catch (error) {
    await fs.unlink(file.path).catch(() => {});
    throw error;
  }
}

function listDocuments(owner) {
  return documentsRepository
    .findByOwner(owner)
    .sort((first, second) => {
      const dateOrder = second.uploadedAt.localeCompare(first.uploadedAt);
      return dateOrder || first.id.localeCompare(second.id);
    })
    .map(toPublicDocument);
}

async function findDownload(id, owner) {
  const document = documentsRepository.findById(id);
  if (!document || document.owner !== owner) {
    return null;
  }

  const filePath = documentsRepository.getFilePath(document.storageName);
  try {
    await fs.access(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }

  return { document: toPublicDocument(document), filePath };
}

module.exports = {
  createDocument,
  listDocuments,
  findDownload,
};