import * as cron from 'node-cron';
import * as wordle from './games/wordle';

export async function init() {
  cron.schedule('0 0 * * * *', () => {
    wordle.generateAllSeries(wordle.roundedNow());
  });

  (await wordle.leagues()).forEach((l: any) => {
    cron.schedule(l.answer_cron_interval, () => {
      wordle.generateAnswer(l);
    });
  });
}
