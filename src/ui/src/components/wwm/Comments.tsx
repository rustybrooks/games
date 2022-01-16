import { useGetAndSet } from 'react-context-hook';
import { Box, Button, Drawer, List, ListItemText, Paper, TextField, Typography } from '@mui/material';
import { useEffect, useState, Fragment } from 'react';
import * as constants from '../../constants';
import { Div } from '../Styled';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wwm/${fn}`;

const style: { [id: string]: any } = {
  container: {},
};

const drawerBleeding = 56;

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
  if (!comment.trim().length) {
    return {};
  }

  const data = await fetch(genUrl('puzzles/add_comment'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': localStorage.getItem('api-key'),
    },
    body: JSON.stringify({
      wordle_answer_id,
      comment: comment.trim(),
    }),
  });
  return data.json();
}

export function Comments({ wordle_answer_id }: { wordle_answer_id: number | string }) {
  const [user, setUser]: [{ username: string }, any] = useGetAndSet('user');
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');

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

  const handleCommentKey = async (event: any) => {
    console.log('key...', event.key);
    if (event.key.toLowerCase() === 'enter') {
      addComment(wordle_answer_id, comment);
      setComment('');
      setComments(await getComments(wordle_answer_id));
    }
  };

  return (
    <Div>
      <Div sx={{ width: '100%', textAlign: 'center' }}>
        <Button variant="contained" onClick={toggleDrawer(true)}>
          {comments.length} comments
        </Button>
      </Div>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={toggleDrawer(false)}
        ModalProps={{
          keepMounted: true,
        }}
      >
        {user ? (
          <TextField
            id="outlined-multiline-flexible"
            label="Comment"
            multiline
            maxRows={4}
            sx={{ width: '100%' }}
            value={comment}
            onChange={handleComment}
            onKeyDown={handleCommentKey}
          />
        ) : null}
        <Paper sx={{ maxHeight: { mobile: '20rem', tablet: '30rem', desktop: '30rem' }, overflow: 'auto' }}>
          {comments.map(c => {
            return (
              <Box key={c.wordle_comment_id} style={{ display: 'flex', margin: '.25em' }}>
                <Typography color="#55f" sx={{ marginRight: '.5em' }}>
                  [{c.username}]
                </Typography>
                <Typography>{c.comment}</Typography>
              </Box>
            );
          })}
        </Paper>
      </Drawer>
    </Div>
  );
}
