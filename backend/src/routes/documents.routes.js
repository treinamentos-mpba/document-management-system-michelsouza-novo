const express = require('express');
const documentsController = require('../controllers/documents.controller');
const upload = require('../middleware/upload');

const router = express.Router();

router.post(
  '/upload',
  documentsController.requireUserId,
  upload.single('file'),
  documentsController.upload,
);
router.get('/documents', documentsController.requireUserId, documentsController.list);
router.get(
  '/documents/:id/download',
  documentsController.requireUserId,
  documentsController.download,
);

module.exports = router;