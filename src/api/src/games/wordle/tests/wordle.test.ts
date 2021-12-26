import * as pgexplorer from '@rustybrooks/pgexplorer';
import supertest from 'supertest';
import MockDate from 'mockdate';
import * as utils from '../utils';
import * as queries from '../queries';
import * as db from '../../../db';
import * as migrations from '../../../../scripts/migrations';
import * as users from '../../../users';
import { app } from '../../../app';
import { leagues } from '../queries';

pgexplorer.setupDb(null, db.SQL.writeUrl); // this is kinda lame, fix pgexplorer

const apiKey = 'xxx';
let user: any;
let league: any;

afterAll(async () => {
  pgexplorer.SQL.db.$pool.end();
});

describe('Wordle Utilities', () => {
  it('test_evaluateGuess', async () => {
    expect(utils.evaluateGuess('masse', 'basse')).toStrictEqual([' ', '+', '+', '+', '+']);
    expect(utils.evaluateGuess('masse', 'masse')).toStrictEqual(['+', '+', '+', '+', '+']);
    expect(utils.evaluateGuess('masse', 'xmass')).toStrictEqual([' ', '-', '-', '+', '-']);
    expect(utils.evaluateGuess('masse', 'sasas')).toStrictEqual(['-', '+', '+', ' ', ' ']);
    expect(utils.evaluateGuess('guest', 'xgues')).toStrictEqual([' ', '-', '-', '-', '-']);
  });
});

describe('Cron stuff', () => {
  afterEach(async () => {
    for (const t of await pgexplorer.tables({})) {
      await db.SQL.execute(`truncate ${t.table_name} cascade`);
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
    expect((await queries.leagueSeries()).length).toBe(3);

    // running it again should not make more
    await queries.generateAllSeries(new Date('2021-12-31'));
    expect((await queries.leagueSeries()).length).toBe(3);

    // not close enough to new one so still no more
    await queries.generateAllSeries(new Date('2022-01-01'));
    expect((await queries.leagueSeries()).length).toBe(3);

    // now we're close enough an make another
    await queries.generateAllSeries(new Date('2022-01-06'));
    expect((await queries.leagueSeries()).length).toBe(6);
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

describe('Join/leave leagues', () => {
  beforeEach(async () => {
    user = await users.addUser({
      username: 'test',
      password: 'test',
      email: 'test@test.com',
      is_admin: false,
      api_key: apiKey,
    });
    await migrations.bootstrapLeagues(new Date('2022-01-01'));
    [league] = await queries.leagues({ league_slug: 'every_6h_weekly_5' });
  });

  afterEach(async () => {
    MockDate.reset();
    for (const t of await pgexplorer.tables({})) {
      await db.SQL.execute(`truncate ${t.table_name} cascade`);
    }
  });

  it('test_join_leave_join', async () => {
    function sleep(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    async function members() {
      const exclude = ['wordle_league_id', 'wordle_league_member_id', 'user_id'];
      return (await queries.leagueMembers()).map((m: any) =>
        Object.fromEntries(
          Object.keys(m)
            .filter(c => !exclude.includes(c))
            .map(c => [c, m[c]]),
        ),
      );
    }

    const d1 = new Date('2022-01-01T00:00');
    const d2 = new Date('2022-01-01T01:00');
    const d3 = new Date('2022-01-01T02:00');
    const d4 = new Date('2022-01-01T03:00');
    const d5 = new Date('2022-01-01T04:00');

    expect(await members()).toStrictEqual([]);

    // add
    MockDate.set(d1);
    await queries.addLeagueMember({
      user_id: user.user_id,
      wordle_league_id: league.wordle_league_id,
    });
    expect(await members()).toStrictEqual([
      {
        active: true,
        add_date: d1,
        leave_date: null,
        rejoin_date: d1,
      },
    ]);

    // add again - no change
    MockDate.set(d2);
    await queries.addLeagueMember({
      user_id: user.user_id,
      wordle_league_id: league.wordle_league_id,
    });
    expect(await members()).toStrictEqual([
      {
        active: true,
        add_date: d1,
        leave_date: null,
        rejoin_date: d1,
      },
    ]);

    // remove
    MockDate.set(d3);
    await queries.removeLeagueMember({
      user_id: user.user_id,
      wordle_league_id: league.wordle_league_id,
    });
    expect(await members()).toStrictEqual([
      {
        active: false,
        add_date: d1,
        leave_date: d3,
        rejoin_date: d1,
      },
    ]);

    // remove again, no change
    MockDate.set(d4);
    await queries.removeLeagueMember({
      user_id: user.user_id,
      wordle_league_id: league.wordle_league_id,
    });
    await sleep(5); // shouldn't be required, figure out later
    expect(await members()).toStrictEqual([
      {
        active: false,
        add_date: d1,
        leave_date: d4, // not optimal, re-leaving resets leave date
        rejoin_date: d1,
      },
    ]);

    // add again, updating rejoin_date
    MockDate.set(d5);
    await queries.addLeagueMember({
      user_id: user.user_id,
      wordle_league_id: league.wordle_league_id,
    });
    await sleep(5);
    expect(await members()).toStrictEqual([
      {
        active: true,
        add_date: d1,
        leave_date: d4,
        rejoin_date: d5,
      },
    ]);
  });
});

describe('Answer submission', () => {
  beforeEach(async () => {
    user = await users.addUser({
      username: 'test',
      password: 'test',
      email: 'test@test.com',
      is_admin: false,
      api_key: apiKey,
    });
    const answerMock = jest.spyOn(utils, 'randomWord');
    answerMock.mockReturnValue('train');
    await migrations.bootstrapLeagues(new Date('2022-01-01'));
    [league] = await queries.leagues({ league_slug: 'every_6h_weekly_5' });
    await queries.generateAllSeries(new Date('2022-01-01'));
    const answer = await queries.generateAnswer(league, new Date('2022-01-01'));
  });

  afterEach(async () => {
    MockDate.reset();
    for (const t of await pgexplorer.tables({})) {
      await db.SQL.execute(`truncate ${t.table_name} cascade`);
    }
  });

  it('test_submit_fails', async () => {
    const d1 = new Date('2022-01-01T00:00');
    const d2 = new Date('2022-01-10T03:00');
    MockDate.set(d1);

    // not logged in, forbidden
    await supertest(app).post('/api/games/wordle/check').send({ league_slug: 'every_6h_weekly_5', guess: 'xxx' }).expect(403);

    // logged in, but league doesn't exist
    await supertest(app)
      .post('/api/games/wordle/check')
      .set('X-API-KEY', apiKey)
      .send({ league_slug: 'xxx', guess: 'xxx' })
      .expect(404)
      .then(response => {
        expect(response.body.detail === 'League not found');
      });

    // logged in, but not part of league
    await supertest(app)
      .post('/api/games/wordle/check')
      .set('X-API-KEY', apiKey)
      .send({ league_slug: 'every_6h_weekly_5', guess: 'xxx' })
      .expect(404)
      .then(response => {
        expect(response.body.detail === 'League not found');
      });

    // invalid guess
    await queries.addLeagueMember({ user_id: user.user_id, wordle_league_id: league.wordle_league_id });
    await supertest(app)
      .post('/api/games/wordle/check')
      .set('X-API-KEY', apiKey)
      .send({ league_slug: 'every_6h_weekly_5', guess: 'xxx' })
      .expect(400)
      .then(response => {
        expect(response.body.detail === 'guess must be 5 letters');
      });

    // missing guess
    await supertest(app)
      .post('/api/games/wordle/check')
      .set('X-API-KEY', apiKey)
      .send({ league_slug: 'every_6h_weekly_5' })
      .expect(400)
      .then(response => {
        expect(response.body.detail === 'must pass field named "guess" containing guessed word');
      });

    // no answer for some reason
    MockDate.set(d2);
    await supertest(app)
      .post('/api/games/wordle/check')
      .set('X-API-KEY', apiKey)
      .send({ league_slug: 'every_6h_weekly_5' })
      .expect(404)
      .then(response => {
        expect(response.body.detail === 'Wordle not found');
      });
  });
});
