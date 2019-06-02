'use strict';

process.env.SECRET = 'test';

const jwt = require('jsonwebtoken');

const server = require('../../../src/app.js').server;
const supergoose = require('../../supergoose.js');
const User = require('../../../src/auth/users-model.js');
const Role = require('../../../src/auth/roles-model.js');

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
  super: 'c3VwZXI6dXNlcg==',
};

beforeAll(async (done) => {
  await supergoose.startDB();

  for(let roleType of Object.keys(roles)) {
    await new Role(roles[roleType]).save();
  }

  done();
});

afterAll(supergoose.stopDB);

describe('Auth Router', () => {

  Object.keys(users).forEach( userType => {

    describe(`${userType} users`, () => {

      let encodedToken;
      let id;

      it('can create one', () => {
        return mockRequest.post('/signup')
          .send(users[userType])
          .then(results => {
            var token = jwt.verify(results.text, process.env.SECRET);
            id = token.id;
            encodedToken = results.text;
            expect(token.id).toBeDefined();
            expect(token.capabilities).toBeDefined();
          });
      });

      it('can signin with basic', () => {
        return mockRequest.post('/signin')
          .auth(users[userType].username, users[userType].password)
          .then(results => {
            var token = jwt.verify(results.text, process.env.SECRET);
            expect(token.id).toEqual(id);
            expect(token.capabilities).toBeDefined();
          });
      });

      it('can signin with bearer', () => {
        return mockRequest.post('/signin')
          .set('Authorization', `Bearer ${encodedToken}`)
          .then(results => {
            var token = jwt.verify(results.text, process.env.SECRET);
            expect(token.id).toEqual(id);
            expect(token.capabilities).toBeDefined();
          });
      });

    });

  });

});
