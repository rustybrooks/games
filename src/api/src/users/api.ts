import express, { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { getParams } from '../utils';
import * as queries from './queries';
import * as exceptions from '../exceptions';

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

export const requireLogin = (response: Response, next: NextFunction) => {
  if (response.locals.user === null) {
    throw new exceptions.HttpException(403, 'unauthorized');
    // next(new exceptions.HttpException(403, 'unauthorized'));
    // throw new exceptions.HaltException('halt'); // prevent further execution?
  }
};

const signup = async (request: Request, response: Response, next: NextFunction) => {
  const { username, email, password, password2 } = getParams(request);
  const errors: { [id: string]: string } = {};
  if (username.length < 4) {
    errors.username = 'Username must be at least 4 characters';
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
    return response.status(400).json({ details: errors });
  }

  try {
    await queries.addUser({ username, password, email });
    return response.status(200).json(queries.generateToken(username));
  } catch (e) {
    return response.status(400).json({ details: { username: 'Failed to create user' } });
  }
};

const login = async (request: Request, response: Response, next: NextFunction) => {
  const { username, password } = getParams(request);

  if (username && password) {
    const user = await queries.user({ username });
    if (!user) {
      return next(new exceptions.HttpForbidden());
    }
    if (await queries.checkPassword(password, user.password)) {
      return response.status(200).json(queries.generateToken(user.username));
    }
  }

  return next(new exceptions.HttpForbidden());
};

const apiKey = async (request: Request, response: Response, next: NextFunction) => {
  try {
    requireLogin(response, next);
  } catch (e) {
    return next(e);
  }

  response.status(200).json(response.locals.user.api_key);
};

const changePassword = async (request: Request, response: Response, next: NextFunction) => {
  requireLogin(response, next);
  const { new_password } = getParams(request);
  await queries.updateUser({ user_id: response.locals.user.user_id, password: new_password });
};

const user = (request: Request, response: Response, next: NextFunction) => {
  requireLogin(response, next);

  response.status(200).json({
    username: response.locals.user.username,
  });
};

router.all('/', user);
router.all('/signup', signup);
router.all('/login', login);
router.all('/api_key', apiKey);
router.all('/change_password', changePassword);
