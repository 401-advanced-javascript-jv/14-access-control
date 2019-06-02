'use strict';

process.env.SECRET = 'test';

const { startDB, stopDB } = require('../../supergoose.js');
const auth = require('../../../src/auth/middleware.js');
const User = require('../../../src/auth/users-model.js');
const Role = require('../../../src/auth/roles-model.js');

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
  await startDB();

  for (let userType of Object.keys(users)) {
    await new User(users[userType]).save();
  }
  for (let roleType of Object.keys(roles)) {
    await new Role(roles[roleType]).save();
  }

  done();
});

afterAll(stopDB);

/*
  For now, these test only make assertions on the admin user
  That user has a role with create, read, update, delete credentials
  ... you can go further as you please.
 */
describe('Auth Middleware', () => {
  let errorMessage = 'Invalid User ID/Password';

  describe('user authentication', () => {
    let cachedToken;

    it('fails a login for a user (admin) with the incorrect basic credentials', () => {
      let req = {
        headers: {
          authorization: 'Basic YWRtaW46Zm9v',
        },
      };
      let res = {};
      let next = jest.fn();
      let middleware = auth();

      return middleware(req, res, next).then(() => {
        expect(next).toHaveBeenCalledWith(errorMessage);
      });
    }); // it()

    it('fails a login for a user (admin) with an incorrect bearer token', () => {
      let req = {
        headers: {
          authorization: 'Bearer foo',
        },
      };
      let res = {};
      let next = jest.fn();
      let middleware = auth();

      // The token authorizer in the model throws an error, making it so
      // the middleware doesn't return a promise but instead throws an
      // error in the main catch block, so this assertion validates that
      // behavior instead of a standard promise signature
      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith(errorMessage);
    }); // it()

    it('logs in an admin user with the right credentials', () => {
      let req = {
        headers: {
          authorization: 'Basic YWRtaW46cGFzc3dvcmQ=',
        },
      };
      let res = {};
      let next = jest.fn();
      let middleware = auth();

      return middleware(req, res, next).then(() => {
        cachedToken = req.token;
        expect(next).toHaveBeenCalledWith();
      });
    }); // it()

    // this test borrows the token gotten from the previous it() ... not great practice
    // but we're using an in-memory db instance, so we need a way to get the user ID
    // and token from a "good" login, and the previous passing test does provide that ...
    it('logs in an admin user with a correct bearer token', () => {
      let req = {
        headers: {
          authorization: `Bearer ${cachedToken}`,
        },
      };
      let res = {};
      let next = jest.fn();
      let middleware = auth();

      return middleware(req, res, next).then(() => {
        expect(next).toHaveBeenCalledWith();
      });
    }); // it()
  });

  describe('user authorization', () => {

    let cachedTokens = {};
    let userSigninMiddleware = auth();

    it('restricts access to a valid user without permissions', () => {
      let request = {
        headers: { authorization: `Basic dXNlcjpwYXNzd29yZA==` },
      };
      let response = {};
      let next = jest.fn();
      let middleware = auth('delete');

      return middleware(request, response, next).then(() => {
        expect(next).toHaveBeenCalledWith(errorMessage);
      });
    }); // it()

    it('grants access when a user has permission', () => {

      let request = { headers: { authorization: `Basic ${encodedBasic.superuser}` } };
      let response = {};
      let next = jest.fn();
      return userSigninMiddleware( request, response, next )
        .then( () => cachedTokens.superuser = request.token );

    });

    describe('grants access when a user has permission', () => {

      roles.superuser.capabilities.forEach(capability => {
        it(`auth('${capability}') with superuser Bearer auth`, async () => {

          for ( let userType of Object.keys( encodedBasic ) ) {
          }

          let request = {
            headers: {authorization: `Bearer ${cachedTokens.superuser}`},
          };
          let response = {};
          let next = jest.fn();
          let middleware = auth(capability);

          return Promise.resolve(middleware(request, response, next))
            .then(() => {
            expect(next).toHaveBeenCalledWith();
          });

        });
      });

    }); // it()

  }); // describe()
});
