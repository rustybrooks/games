export function genActivePuzzles() {
  return '/wwm';
}

export function genPuzzleBrowse(leagueSlug: string, answerId: string, username: string = null) {
  let url = `/wwm/puzzles/${leagueSlug}/${answerId}/browse`;
  if (username) {
    url += '/' + username;
  }
  return url;
}
