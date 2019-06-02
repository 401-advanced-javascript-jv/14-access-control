'use strict';

process.env.SECRET = 'test';

const jsonWebToken = require('jsonwebtoken');

const server = require('../../../src/app.js').server;
const supergoose = require('../../supergoose.js');
const User = require('../../../src/auth/users-model.js');
const Role = require('../../../src/auth/roles-model.js');
const auth = require('../../../src/auth/middleware.js');

const mockRequest = supergoose.server(server);

// admin:password: YWRtaW46cGFzc3dvcmQ=
// admin:foo: YWRtaW46Zm9v
// editor:password: ZWRpdG9yOnBhc3N3b3Jk
// user:password: dXNlcjpwYXNzd29yZA==
// super:user : c3VwZXI6dXNlcg==
let users = {
  admin: { username: 'admin', password: 'password', role: 'admin' },
  editor: { username: 'editor', password: 'password', role: 'editor' },
  user: { username: 'user', password: 'password', role: 'user' },
  superuser: { username: 'super', password: 'user', role: 'superuser' },
};

let roles = {
  user: { role: 'user', capabilities: ['read'] },
  editor: { role: 'editor', capabilities: ['create', 'update', 'read'] },
  admin: {
    role: 'admin',
    capabilities: ['create', 'update', 'read', 'delete'],
  },
  superuser: {
    role: 'superuser',
    capabilities: ['create', 'update', 'read', 'delete', 'superuser'],
  },
};

let encodedBasic = {
  admin: 'YWRtaW46cGFzc3dvcmQ=',
  editor: 'ZWRpdG9yOnBhc3N3b3Jk',
  user: 'dXNlcjpwYXNzd29yZA==',
  superuser: 'c3VwZXI6dXNlcg==',
};

beforeAll(async (done) => {
  await supergoose.startDB();

  for (let userType of Object.keys(users)) {
    await new User(users[userType]).save();
  }

  for(let roleType of Object.keys(roles)) {
    await new Role(roles[roleType]).save();
  }

  done();
});

afterAll(supergoose.stopDB);
describe('Routes', () => {

  let cachedToken;
  let cachedKey;

  return mockRequest.post('/signin').auth(users.superuser.username, users.superuser.password)
    .then(superUser => {
      cachedToken.superuser = superUser.token;
    });

  it('/key route returns an auth key', () => {

    // return mockReqest.post('/key')

  });

  it('Unprotected routes are open to all users', () => {



  });
});
