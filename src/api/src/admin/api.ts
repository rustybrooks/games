import express, { Request, Response } from 'express';
import * as migrations from './migrations';
import { SQL } from '../db';
import { getParams } from '../utils';
import * as users from '../users';

export const router = express.Router();

const bootstrapAdmin = async () => {
  const user = await users.user({ username: 'rbrooks' });
  console.log('user', user);
  if (!user) {
    console.log('Adding bootstrapped admin user');
    await users.addUser({
      username: 'rbrooks',
      password: 'admin',
      email: 'me@rustybrooks.com',
      is_admin: true,
      api_key: 'xxx',
    });
  }
};

export const migrate = async (request: Request, response: Response) => {
  const { apply, initial }: { apply: string; initial: string } = getParams(request);
  console.log('apply', apply, 'initial', initial);
  const val = await migrations.Migration.migrate(
    SQL,
    !!parseInt(initial, 10),
    (apply || '')
      .split(',')
      .filter(x => x)
      .map(x => parseInt(x, 10)),
  );
  await bootstrapAdmin();
  response.status(200).json(val);
};

router.all('/migrate', migrate);
