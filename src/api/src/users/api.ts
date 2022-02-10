import express, { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { apiClass, apiConfig, HttpBadRequest, HttpForbidden } from '@rustybrooks/api-framework';
import * as queries from './queries';

export const router = express.Router();

export const isLoggedIn = async (request: Request) => {
  const apiKey = request.header('X-API-KEY');
  if (apiKey) {
    try {
      const { username } = jwt.verify(apiKey, process.env.TOKEN_KEY) as { username: string };
      return await queries.user({ username });
    } catch (e) {
      // console.log('failed to decode jwt token');
    }

    try {
      return await queries.user({ apiKey });
    } catch (e) {
      // console.log('failed to look up user by api key');
    }
  }
  return null;
};

@apiClass()
export class Users {
  async signup({ username, email, password, password2 }: { username: string; email: string; password: string; password2: string }) {
    const errors: { [id: string]: string } = {};
    if (username.length < 4) {
      errors.username = 'Username must be at least 4 characters';
    }

    const re = /^[a-z,A-Z,0-9,\-,_]+$/;
    if (!username.match(re)) {
      errors.username = 'Username must be composed of only letters, numbers, _ and -';
    }

    if (password !== password2) {
      errors.password2 = 'Passwords do not match';
    }

    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!email) {
      errors.email = 'Email required';
    }

    if (Object.keys(errors).length) {
      throw new HttpBadRequest(errors);
    }

    try {
      await queries.addUser({ username, password, email });
      return queries.generateToken(username);
    } catch (e) {
      throw new HttpBadRequest({ username: 'Failed to create user' });
    }
  }

  async login({ username, password }: { username: string; password: string }) {
    if (username && password) {
      const user = await queries.user({ username });
      if (!user) {
        throw new HttpForbidden();
      }
      if (await queries.checkPassword(password, user.password)) {
        return queries.generateToken(user.username);
      }
    }

    throw new HttpForbidden();
  }

  @apiConfig({ requireLogin: true })
  async api_key({ _user = null }: { _user: any }) {
    return _user.api_key;
  }

  @apiConfig({ requireLogin: true })
  async change_password({ new_password, _user }: { new_password: string; _user: any }) {
    await queries.updateUser({ user_id: _user.user_id, password: new_password });
    return { status: 'ok' };
  }

  @apiConfig({ requireLogin: true })
  async index({ _user = null }: { _user: any }) {
    return {
      username: _user.username,
    };
  }
}

// router.all('/', user);
// router.all('/signup', signup);
// router.all('/login', login);
// router.all('/api_key', apiKey);
// router.all('/change_password', changePassword);
