import * as cron from 'node-cron';
import * as wordle from './games/wwm';

export async function init() {
  cron.getTasks().forEach(c => c.stop());

  cron.schedule('0 0-59/10 * * * * *', async () => {
    await wordle.generateAllSeries(wordle.roundedNow());
    await wordle.generateAllAnswers(wordle.roundedNow());
  });
}
