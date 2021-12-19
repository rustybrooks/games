// import * as sql from '../src/sql';

// const SQL = sql.sqlFactory({
//   writeUrl: 'http://wombat:1wombat2@localhost:5434/pgexplorer_test',
// });

import * as utils from '../utils';

describe('Test SQL Basic', () => {
  beforeEach(async () => {});

  afterAll(async () => {});

  it('test_evaluateGuess', async () => {
    expect(utils.evaluateGuess('masse', 'basse')).toStrictEqual([' ', '+', '+', '+', '+']);
    expect(utils.evaluateGuess('masse', 'masse')).toStrictEqual(['+', '+', '+', '+', '+']);
    expect(utils.evaluateGuess('masse', 'sasas')).toStrictEqual(['-', '+', '+', ' ', ' ']);
    expect(utils.evaluateGuess('guest', 'xgues')).toStrictEqual([' ', '-', '-', '-', '-']);
  });
});
