import * as pgexplorer from '@rustybrooks/pgexplorer';
import * as db from './db';

module.exports = async () => {
  console.log('global teardown');
  await db.SQL.db.$pool.end();
  // await pgexplorer.SQL.db.$pool.end();
  console.log('global teardown end');
};
