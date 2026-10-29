const multer = require('multer');

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    const isTooLarge = error.code === 'LIMIT_FILE_SIZE';
    const status = isTooLarge ? 413 : 400;
    const code = isTooLarge ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD';
    const message = isTooLarge
      ? 'O arquivo excede o limite de 10 MiB.'
      : 'A requisição de upload é inválida.';

    return res.status(status).json({ error: { code, message } });
  }

  const isUploadError = req.method === 'POST' && req.path === '/upload';
  const code = isUploadError ? 'STORAGE_ERROR' : 'INTERNAL_ERROR';
  const message = isUploadError
    ? 'Não foi possível armazenar o documento.'
    : 'Ocorreu um erro interno.';

  return res.status(500).json({ error: { code, message } });
}

module.exports = errorHandler;