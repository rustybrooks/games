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
      console.log('failed to decode jwt token');
    }

    try {
      return await queries.user({ apiKey });
    } catch (e) {
      console.log('failed to look up user by api key');
    }
  }
  return null;
};

export const requireLogin = (response: Response, next: NextFunction) => {
  if (response.locals.user === null) {
    next(new exceptions.HttpException(403, 'unauthorized'));
    throw new exceptions.HaltException('halt'); // prevent further execution?
  }
};

const signup = async (request: Request, response: Response, next: NextFunction) => {
  const { username, email, password, password2 } = getParams(request);
  if (password !== password2) {
    return next(new exceptions.HttpBadRequest('Passwords do not match'));
  }

  if (password.length < 8) {
    return next(new exceptions.HttpBadRequest('Passwords must be at least 8 characters'));
  }

  if (!email) {
    return next(new exceptions.HttpBadRequest('Email required'));
  }
  await queries.addUser({ username, password, email });
  return response.status(200).json(queries.generateToken(username));
};

const login = async (request: Request, response: Response, next: NextFunction) => {
  const { username, password } = getParams(request);

  if (username && password) {
    const user = await queries.user({ username });
    if (await queries.checkPassword(password, user.password)) {
      return response.status(200).json(queries.generateToken(user.username));
    }
  }

  return next(new exceptions.HttpForbidden());
};

const changePassword = async (request: Request, response: Response, next: NextFunction) => {
  requireLogin(response, next);
  const { new_password } = getParams(request);
  await queries.updateUser({ user_id: response.locals.user.user_id, password: new_password });
};

const user = (request: Request, response: Response, next: NextFunction) => {
  console.log('user start');
  requireLogin(response, next);

  response.status(200).json({
    username: response.locals.user.username,
    user_id: response.locals.user.user_id,
  });
};

router.all('/', user);
router.all('/signup', signup);
router.all('/login', login);
router.all('/change_password', changePassword);
