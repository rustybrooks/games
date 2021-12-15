import express, { Request, Response } from 'express';
import * as migrations from './migrations';
import { SQL } from '../db';
import { getParams } from '../utils';
import * as users from '../users';

export const router = express.Router();

const bootstrapAdmin = () => {
  const user = users.user({ username: 'rbrooks' });
  if (!user) {
    console.log('Adding bootstrapped admin user');
    user.addUser({
      username: 'rbrooks',
      password: 'admin',
      email: 'me@rustybrooks.com',
      is_admin: true,
      api_key: 'xxx',
    });
  }
};

export const migrate = (request: Request, response: Response) => {
  const { apply, initial } = getParams(request);
  const val = migrations.Migration.migrate(SQL, apply, initial);
  bootstrapAdmin();
  response.status(200).json(val);
};

router.all('/migrate', migrate);

/*
@classmethod
    def _bootstrapAdmin(cls):
        user = queries.User(username="rbrooks")
        if not user.user_id:
            logger.warn("Adding bootstrapped admin user")
            queries.add_user(
                username="rbrooks",
                password=config.get_config_key("admin_password"),
                email="me@rustybrooks.com",
                is_admin=True,
                api_key=config.get_config_key("admin_api_key"),
            )

    @classmethod
    def migrate(cls, apply=None, initial=False):
        val = migrations.Migration.migrate(
            SQL=queries.SQL,
            dry_run=False,
            initial=api_bool(initial),
            apply_versions=[int(x) for x in api_list(apply or [])],
        )

        cls._bootstrapAdmin()
        queries.add_global_tools()

        return val

    @classmethod
    @Api.config(require_login=False, require_admin=False)
    def bootstrap(cls, initial=False):
        if (
            initial
            or not queries.SQL.table_exists("migrations")
            or not queries.SQL.select_0or1("select count(*) as count from migrations")[
                "count"
            ]
            > 0
        ):
            val = cls.migrate(apply=None, initial=initial)
        else:
            cls._bootstrapAdmin()

 */
