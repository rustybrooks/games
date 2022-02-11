import * as framework from '@rustybrooks/api-framework';
import * as users from './users/api';
import { Puzzles, Leagues, WWMUsers } from './games/wwm';

framework.mountApi(users.Users, '/api/user');
framework.mountApi(Puzzles, '/api/games/wwm/puzzles');
framework.mountApi(Leagues, '/api/games/wwm/leagues');
framework.mountApi(WWMUsers, '/api/games/wwm/users');
export const app = framework.init(users.isLoggedIn);
