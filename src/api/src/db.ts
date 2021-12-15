import * as pgexplorer from '@rustybrooks/pgexplorer';

const writeUrl = 'http://wombat:1wombat2@postgres:5432/games';
export const SQL = pgexplorer.sql.sqlFactory({ writeUrl });
