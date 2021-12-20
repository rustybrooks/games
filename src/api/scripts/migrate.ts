#!/srv/src/api/node_modules/.bin/ts-node

import * as migrations from './migrations';

const isInitial = process.argv.includes('initial');
const isSimple = process.argv.includes('simple');

if (isSimple) {
  migrations.migrateSimple({ apply: [], isInitial }).then(() => process.exit(0));
} else {
  migrations.migrate({ apply: [], isInitial }).then(() => process.exit(0));
}
