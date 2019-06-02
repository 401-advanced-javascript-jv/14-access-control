'use strict';

const router = require('express').Router();
const auth = require('../auth/middleware.js');

router.get('/public-stuff', (request, response, _) => {
  response.status(200).send('public stuff is visible to all!');
});

router.get('/hidden-stuff', auth(), (request, response, _) => {
  response.status(200).send('hidden stuff requires any kind of authentication');
});

router.get('/something-to-read', auth('read'), (request, response, _) => {
  response.status(200).send('This user has the "read" capability');
});

router.post('/create-a-thing', auth('create'), (request, response, _) => {
  response.status(200).send('This user hs the "create" capability');
});

router.put('/update', auth('update'), (request, response, _) => {
  response.status(200).send('This user has the "update" capability');
});

router.patch('/jp', auth('update'), (request, response, _) => {
  response.status(200).send('This user has the "update" capability to patch');
});

router.delete('/bye-bye', auth('delete'), (request, response, _) => {
  response.status(200).send('This user has the "delete" capability');
});

router.get('/everything', auth('superuser'), (request, response, _) => {
  response.status(200).send('This user is a "superuser"');
});

module.exports = router;
