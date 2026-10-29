const path = require('node:path');

const storageDirectory = path.resolve(__dirname, '../../storage');
const documents = new Map();

function create(document, storageName) {
  if (documents.has(document.id)) {
    throw new Error('Documento duplicado');
  }

  const record = { ...document, storageName };
  documents.set(record.id, record);
  return record;
}

function findById(id) {
  return documents.get(id) || null;
}

function findByOwner(owner) {
  return Array.from(documents.values()).filter((document) => document.owner === owner);
}

function getFilePath(storageName) {
  return path.join(storageDirectory, storageName);
}

module.exports = {
  create,
  findById,
  findByOwner,
  getFilePath,
};