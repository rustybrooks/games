#!/srv/src/api/node_modules/.bin/ts-node

import * as migrations from './migrations';

const isInitial = process.argv[1] === 'initial';
migrations.migrate({ apply: [], isInitial }).then(() => process.exit(0));
