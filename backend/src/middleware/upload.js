const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');

const storageDirectory = path.resolve(__dirname, '../../storage');
const maxFileSize = 10 * 1024 * 1024;

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename(req, file, callback) {
    callback(null, crypto.randomUUID());
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: maxFileSize, files: 1 },
});