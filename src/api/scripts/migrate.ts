#!/srv/src/api/node_modules/.bin/ts-node

import * as migrations from './migrations';

migrations.migrate({ apply: [], isInitial: true }).then(() => process.exit(0));
