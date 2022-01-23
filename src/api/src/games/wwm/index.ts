import { HttpBadRequest, HttpNotFound } from '@rustybrooks/api-framework';
import { League } from '../../../../ui/types';
import * as queries from './queries';

export * from './queries';
export * from './puzzles';
export * from './leagues';

export async function checkLeague(
  league_slug: string,
  user: { [id: string]: any },
  isMemberOnly = true,
  requireSlug = true,
): Promise<League> {
  if (requireSlug) {
    if (!league_slug || !league_slug.length) {
      throw new HttpBadRequest('Must pass in league_slug');
    }
  }

  if (league_slug) {
    const league = await queries.getLeague({ league_slug, user_id: user.user_id, isMemberOnly });
    if (league) {
      return league;
    }
    if (!league) {
      const league2 = await queries.getLeague({ league_slug });
      if (league2) {
        throw new HttpBadRequest('You are not in this league', 'not_in_league');
      }
      throw new HttpNotFound('League not found');
    }
  }
  return null;
}
