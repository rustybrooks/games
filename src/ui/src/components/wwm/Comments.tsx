import { useGetAndSet } from 'react-context-hook';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import * as constants from '../../constants';
import { genLeague } from '../../routes';
import { League } from '../../../types';

import { Button } from '../widgets/Button';
import { Drawer } from '../widgets/Drawer';
import { TextInput } from '../widgets/TextInput';

import './Comments.css';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wwm/${fn}`;

// move this to utils or something
export async function getComments(wordle_answer_id: number | string): Promise<Comment[]> {
  const data = await fetch(genUrl('puzzles/comments'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': localStorage.getItem('api-key'),
    },
    body: JSON.stringify({
      wordle_answer_id,
    }),
  });
  return data.json();
}

export async function addComment(wordle_answer_id: number | string, comment: string) {
  const data = await fetch(genUrl('puzzles/add_comment'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': localStorage.getItem('api-key'),
    },
    body: JSON.stringify({
      wordle_answer_id,
      comment,
    }),
  });
  return data.json();
}

export function Comments({ wordle_answer_id, league }: { wordle_answer_id: number | string; league: League }) {
  const [user]: [{ username: string }, any] = useGetAndSet('user');
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setComments(await getComments(wordle_answer_id));
    })();
  }, [user]);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const handleComment = (event: any) => {
    if (event.target.value !== `${comment}\n` && event.target.value !== `${comment}\r\n`) {
      setComment(event.target.value);
    }
  };

  const saveComment = async () => {
    await addComment(wordle_answer_id, comment.trim());
    setComment('');
    setComments(await getComments(wordle_answer_id));
  };

  const handleCommentKey = async (event: any) => {
    if (event.key.toLowerCase() === 'enter' && comment.trim().length) {
      saveComment();
    }
  };

  if (!user) {
    return <div />;
  }

  return (
    <div>
      <div style={{ width: '100%', textAlign: 'center' }}>
        <Button color="blue" style={{ margin: '.2em' }} variant="contained" onClick={toggleDrawer(true)}>
          {comments.length} comments
        </Button>
        <Button
          color="blue"
          style={{ margin: '.2em' }}
          variant="contained"
          onClick={() => {
            navigate(genLeague(league.league_slug));
          }}
        >
          Visit League: {league.league_name}
        </Button>
      </div>
      <Drawer anchor="bottom" open={open} onClose={toggleDrawer(false)}>
        <div style={{ margin: '.5rem' }}>
          {user ? (
            <div style={{ display: 'flex' }}>
              <TextInput
                label="Comment"
                style={{ width: '100%', margin: '.2em' }}
                value={comment}
                onChange={handleComment}
                onKeyDown={handleCommentKey}
              />
              <Button color="blue" onClick={saveComment} variant="contained" style={{ margin: '.2em' }}>
                Post
              </Button>
            </div>
          ) : null}
          <div className="comment-box">
            {comments.length ? (
              comments.map(c => {
                return (
                  <div key={c.wordle_comment_id} style={{ display: 'flex', margin: '.25em' }}>
                    <span className="comment-name">[{c.username}]</span>
                    {c.comment}
                  </div>
                );
              })
            ) : (
              <span style={{ color: '#aaa' }}>No comments yet</span>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
