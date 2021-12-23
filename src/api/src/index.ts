import 'setup-newrelic';
import { app } from './app';
import * as cron from './cron';

cron.init();

app.listen(5000);
