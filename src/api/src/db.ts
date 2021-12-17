import * as pgexplorer from '@rustybrooks/pgexplorer';

const writeUrl = process.env.WRITE_URL;
export const SQL = pgexplorer.sql.sqlFactory({ writeUrl });
