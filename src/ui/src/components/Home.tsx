import { Link } from 'react-router-dom';

export const Home = () => (
  <div style={{ padding: '2rem' }}>
    <h2>
      <p>
        Welcome to Words with Melvins, a mastermind-like word puzzle game. This game is based on and heavily influenced by the excellent
        word game <a href="https://www.powerlanguage.co.uk/wordle/">Wordle</a>, created by{' '}
        <a href="https://www.powerlanguage.co.uk/">Josh Wardle.</a>
      </p>

      <ul>
        <li>
          <Link to="/wwm/leagues">Join some Words with Melvins leagues</Link>
        </li>
        <li>
          <Link to="/wwm">Play new Words with Melvins matches in your leagues</Link>
        </li>
      </ul>
    </h2>
  </div>
);
