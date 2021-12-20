import * as net from 'net';
import { execSync } from 'child_process';

async function isPortReachable({ port, host, timeout = 1000 }: { port: number; host: string; timeout: number }) {
  const promise = new Promise((resolve, reject) => {
    const socket = new net.Socket();

    const onError = () => {
      socket.destroy();
      reject();
    };

    socket.setTimeout(timeout);
    socket.once('error', onError);
    socket.once('timeout', onError);

    socket.connect(port, host, () => {
      socket.end();
      resolve(null);
    });
  });

  try {
    await promise;
    return true;
  } catch {
    return false;
  }
}

module.exports = async () => {
  console.log('wait for postgres');
  await isPortReachable({ port: 5432, host: 'games-postgres-test', timeout: 30000 });
  console.log('before migrate');
  execSync('node_modules/.bin/ts-node ./scripts/migrate.ts initial');
  console.log('after migrate');
};
