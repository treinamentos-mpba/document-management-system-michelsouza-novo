const fs = require('node:fs');
const documentsService = require('../services/documents.service');

function encodeRFC5987Value(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => {
    return `%${character.charCodeAt(0).toString(16).toUpperCase()}`;
  });
}

function requireUserId(req, res, next) {
  const owner = req.get('X-User-Id');
  if (!owner || !owner.trim()) {
    return res.status(400).json({
      error: { code: 'USER_ID_REQUIRED', message: 'O cabeçalho X-User-Id é obrigatório.' },
    });
  }

  req.userId = owner;
  return next();
}

async function upload(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo file.' },
    });
  }

  try {
    const document = await documentsService.createDocument(req.userId, req.file);
    return res.status(201).json(document);
  } catch (error) {
    return next(error);
  }
}

function list(req, res, next) {
  try {
    return res.status(200).json(documentsService.listDocuments(req.userId));
  } catch (error) {
    return next(error);
  }
}

async function download(req, res, next) {
  try {
    const result = await documentsService.findDownload(req.params.id, req.userId);
    if (!result) {
      return res.status(404).json({
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
      });
    }

    const fileStream = fs.createReadStream(result.filePath);
    fileStream.once('error', (error) => {
      if (error.code === 'ENOENT' && !res.headersSent) {
        res.status(404).json({
          error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
        });
        return;
      }
      if (res.headersSent) {
        res.destroy(error);
        return;
      }
      next(error);
    });

    res.status(200).set({
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(result.document.size),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeRFC5987Value(result.document.originalName)}`,
    });
    fileStream.pipe(res);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  requireUserId,
  upload,
  list,
  download,
};