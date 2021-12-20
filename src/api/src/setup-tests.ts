import { execSync } from 'child_process';

module.exports = async () => {
  console.log('before everything');
  execSync('node_modules/.bin/ts-node ./scripts/migrate.ts');
  console.log('after migrate');
};
