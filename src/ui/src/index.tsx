import { render } from 'react-dom';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { withStore } from 'react-context-hook';
import './index.css';

import {
  ActivePuzzles,
  ArchivedPuzzles,
  Bots,
  Home,
  JoinLeague,
  JoinLeaguePlay,
  LeagueView,
  Leagues,
  NewLeague,
  WWMBrowse,
  WWMPlay,
  WWMPuzzle,
  UserView,
} from './components';
import { AppBar } from './components/AppBar';

const initialValue: { [id: string]: any } = {
  'login-widget': null,
  'login-open': false,
  user: null,
  leagues: [],
  'active-puzzles': [],
};

function AppX() {
  return (
    <BrowserRouter>
      <AppBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/wwm" element={<WWMPlay />} />
        <Route path="/wwm/active" element={<ActivePuzzles />} />
        <Route path="/wwm/archived" element={<ArchivedPuzzles />} />
        <Route path="/wwm/bots" element={<Bots />} />
        <Route path="/wwm/leagues" element={<Leagues />} />
        <Route path="/wwm/leagues/new" element={<NewLeague />} />
        <Route path="/wwm/leagues/:leagueSlug" element={<LeagueView />} />
        <Route path="/wwm/leagues/:leagueSlug/join" element={<JoinLeague />} />
        <Route path="/wwm/leagues/:leagueSlug/join/:inviteCode" element={<JoinLeague />} />
        <Route path="/wwm/leagues/:leagueSlug/join_play/:answerId" element={<JoinLeaguePlay />} />
        <Route path="/wwm/puzzles/:leagueSlug/:answerId" element={<WWMBrowse />} />
        <Route path="/wwm/puzzles/:leagueSlug/:answerId/play" element={<WWMPuzzle />} />
        <Route path="/wwm/puzzles/:leagueSlug/:answerId/browse" element={<WWMBrowse />} />
        <Route path="/wwm/puzzles/:leagueSlug/:answerId/browse/:username" element={<WWMBrowse />} />
        <Route path="/wwm/users/:username/" element={<UserView />} />
      </Routes>
    </BrowserRouter>
  );
}
const App = withStore(AppX, initialValue);

render(<App />, document.getElementById('root'));
