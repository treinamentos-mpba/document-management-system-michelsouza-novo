const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const app = require('../src/app');

const storageDirectory = path.resolve(__dirname, '../storage');
const uploadedIds = [];
let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await Promise.all(
    uploadedIds.map((id) => fs.unlink(path.join(storageDirectory, id)).catch(() => {})),
  );
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

function createForm(contents = 'conteúdo de teste', filename = 'relatorio.txt') {
  const form = new FormData();
  form.append('file', new Blob([contents]), filename);
  return form;
}

test('upload, listagem e download respeitam o proprietário', async () => {
  const owner = `test-${randomUUID()}`;
  const otherOwner = `test-${randomUUID()}`;

  const missingUserResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: createForm(),
  });
  assert.equal(missingUserResponse.status, 400);
  assert.equal((await missingUserResponse.json()).error.code, 'USER_ID_REQUIRED');

  const missingFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: new FormData(),
  });
  assert.equal(missingFileResponse.status, 400);
  assert.equal((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: createForm(),
  });
  assert.equal(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  uploadedIds.push(document.id);
  assert.deepEqual(Object.keys(document).sort(), [
    'id',
    'originalName',
    'owner',
    'size',
    'uploadedAt',
  ]);
  assert.equal(document.owner, owner);
  assert.equal(document.originalName, 'relatorio.txt');
  assert.equal(document.size, Buffer.byteLength('conteúdo de teste'));

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': owner },
  });
  assert.equal(listResponse.status, 200);
  assert.deepEqual(await listResponse.json(), [document]);

  const otherListResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': otherOwner },
  });
  assert.equal(otherListResponse.status, 200);
  assert.deepEqual(await otherListResponse.json(), []);

  const forbiddenDownloadResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': otherOwner } },
  );
  assert.equal(forbiddenDownloadResponse.status, 404);
  assert.equal((await forbiddenDownloadResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': owner },
  });
  assert.equal(downloadResponse.status, 200);
  assert.equal(downloadResponse.headers.get('content-type'), 'application/octet-stream');
  assert.match(downloadResponse.headers.get('content-disposition'), /filename\*=UTF-8''/);
  assert.equal(await downloadResponse.text(), 'conteúdo de teste');
});

test('upload rejeita arquivos acima de 10 MiB', async () => {
  const owner = `test-${randomUUID()}`;
  const oversizedContent = new Uint8Array(10 * 1024 * 1024 + 1);
  const form = new FormData();
  form.append('file', new Blob([oversizedContent]), 'large.bin');

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: form,
  });

  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'FILE_TOO_LARGE');
});