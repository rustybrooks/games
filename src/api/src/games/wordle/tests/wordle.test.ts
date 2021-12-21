import * as pgexplorer from '@rustybrooks/pgexplorer';
import * as utils from '../utils';
import * as queries from '../queries';
import * as db from '../../../db';
import * as migrations from '../../../../scripts/migrations';

pgexplorer.setupDb(null, db.SQL.writeUrl); // this is kinda lame, fix pgexplorer

describe('Test utils', () => {
  it('test_evaluateGuess', async () => {
    expect(utils.evaluateGuess('masse', 'basse')).toStrictEqual([' ', '+', '+', '+', '+']);
    expect(utils.evaluateGuess('masse', 'masse')).toStrictEqual(['+', '+', '+', '+', '+']);
    expect(utils.evaluateGuess('masse', 'xmass')).toStrictEqual([' ', '-', '-', '+', '-']);
    expect(utils.evaluateGuess('masse', 'sasas')).toStrictEqual(['-', '+', '+', ' ', ' ']);
    expect(utils.evaluateGuess('guest', 'xgues')).toStrictEqual([' ', '-', '-', '-', '-']);
  });
});

describe('Test cron stuff', () => {
  afterAll(async () => {
    db.SQL.db.$pool.end();
  });

  afterEach(async () => {
    for (const t of await pgexplorer.tableConstraintDeleteOrder({})) {
      await db.SQL.execute(`truncate ${t} cascade`);
    }
  });

  it('test_generateAllSeries', async () => {
    expect(await queries.leagueSeries()).toStrictEqual([]);
    await migrations.bootstrapLeagues(new Date('2022-01-01'));

    // the first one is too far in the future, should not generate
    await queries.generateAllSeries(new Date('2021-12-01'));
    expect((await queries.leagueSeries()).length).toBe(0);

    // the first one is close enough, should generate one set
    await queries.generateAllSeries(new Date('2021-12-31'));
    expect((await queries.leagueSeries()).length).toBe(2);

    // running it again should not make more
    await queries.generateAllSeries(new Date('2021-12-31'));
    expect((await queries.leagueSeries()).length).toBe(2);

    // not close enough to new one so still no more
    await queries.generateAllSeries(new Date('2022-01-01'));
    expect((await queries.leagueSeries()).length).toBe(2);

    // now we're close enough an make another
    await queries.generateAllSeries(new Date('2022-01-06'));
    expect((await queries.leagueSeries()).length).toBe(4);
  });

  it('test_generateAnswer', async () => {
    await migrations.bootstrapLeagues(new Date('2022-01-01'));
    const league = (await queries.leagues({ league_slug: 'every_6h_weekly_5' }))[0];

    expect(await queries.answers()).toStrictEqual([]);

    // nothing will happen because no series exist yet
    await queries.generateAnswer(league, new Date('2022-01-01'));
    expect((await queries.answers()).length).toBe(0);

    // generate series but use date not appropriate for it, so still nothing
    await queries.generateAllSeries(new Date('2022-01-01'));
    await queries.generateAnswer(league, new Date('2021-12-31'));
    expect((await queries.answers()).length).toBe(0);

    // now use appropriate date, should get new answer
    await queries.generateAnswer(league, new Date('2022-01-01'));
    expect((await queries.answers()).length).toBe(1);

    // now use same date, should get nothing new
    await queries.generateAnswer(league, new Date('2022-01-01'));
    expect((await queries.answers()).length).toBe(1);

    // now use another date, should get new answer
    await queries.generateAnswer(league, new Date('2022-01-01T06:00'));
    expect((await queries.answers()).length).toBe(2);
  });
});
