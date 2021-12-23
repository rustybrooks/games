import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { HttpException, HaltException } from './exceptions';
import * as users from './users/api';
import * as admin from './admin/api';
import * as wordle from './games/wordle/api';

export const app = express();

const beforeRequest = async (req: Request, res: Response, next: NextFunction) => {
  res.locals.user = await users.isLoggedIn(req);
  res.setHeader('X-LOGGED-IN', res.locals.user ? '1' : '0');
  next();
};

function errorMiddleware(error: HttpException, request: Request, response: Response, next: NextFunction) {
  // console.log('errorMiddleware', error);
  const status = error.status || 500;
  const message = error.message || 'Something went wrong';
  response.status(status).send({
    status,
    message,
  });
}

function defaulterrorMiddleware(error: Error, request: Request, response: Response, next: NextFunction) {
  console.log('my dumb error ware', error);
  // if (!(error instanceof HaltException)) {
  // }
}

const corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(express.json());
app.use(beforeRequest);

app.use(cors(corsOptions));
app.options('*', cors()); // include before other routes

app.use('/api/games/wordle', wordle.router);
app.use('/api/admin', admin.router);
app.use('/api/user', users.router);

// must go last
app.use(errorMiddleware);
app.use(defaulterrorMiddleware);
