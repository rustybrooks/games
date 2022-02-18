import { apiClass } from '@rustybrooks/api-framework';
import * as queries from './queries';

@apiClass({ requireLogin: false })
export class WWMUsers {
  async index({ username, _user }: { username: string; _user: any }) {
    return queries.getUserStats({ username, viewing_user_id: _user?.user_id, sort: 'league_name' });
  }
}
