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

describe('Test league series', () => {
  beforeEach(async () => {});

  afterAll(async () => {
    // if (mockRoundedNow) mockRoundedNow.mockRestore();

    for (const t of await pgexplorer.tableConstraintDeleteOrder({})) {
      await db.SQL.execute(`truncate ${t} cascade`);
    }

    db.SQL.db.$pool.end();
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
});
