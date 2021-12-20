import * as utils from '../utils';
import * as db from '../../../db';

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
    db.SQL.pool.end();
  });

  it('test_generateAllSeries', async () => {});
});
