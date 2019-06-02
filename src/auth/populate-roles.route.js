'use strict';

const router = require('express').Router();

const Role = require('./roles-model.js');

router.get('/populate-roles', (request, response, next) => {
  const capabilities = {
    superuser: ['superuser', 'create', 'read', 'update', 'delete'],
    admin: ['create', 'read', 'update', 'delete'],
    editor: ['create', 'read', 'update'],
    user: ['read'],
  };

  for (let roleType of Object.keys(capabilities)) {
    let newRole = new Role({
      role: roleType,
      capabilities: capabilities[roleType],
    });

    newRole.save().catch(console.error);
  }
  response.status(200).send('roles created');
});

router.get('/get-roles', (request, response, next) => {
  Role.find()
    .then((roles) => response.send(roles))
    .catch(console.error);
});

module.exports = router;
