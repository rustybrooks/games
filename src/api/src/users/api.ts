import express, { Request, Response } from 'express';
import { getParams } from '../utils';
import * as queries from './queries';

export const router = express.Router();

export const isLoggedIn = async (request: Request) => {
  const apiKey = request.header('X-API-KEY');
  if (apiKey) {
    try {
      const user = await queries.user({ apiKey });
      return user;
    } catch (e) {
      console.log('failed to look up user by api key');
    }
  }
  return null;
};

export const requireLogin = (response: Response) => {
  if (response.locals.user === null) {
    response.status(403).json({ detail: 'unauthorized' });
  }
};

const signup = (request: Request, response: Response) => {
  const { username, email, password, password2 } = getParams(request);
};

const login = (request: Request, response: Response) => {
  const { username, password } = getParams(request);
};

const changePassword = (request: Request, response: Response) => {
  const { new_password } = getParams(request);
};

const user = (request: Request, response: Response) => {
  requireLogin(response);
  console.log('user = ', response.locals.user);

  response.status(200).json({
    username: response.locals.user.username,
    user_id: response.locals.user.user_id,
  });
};

router.all('/', user);
router.all('/signup', signup);
router.all('/login', login);
router.all('/change_password', changePassword);

/*
@api_register(None, require_login=True)
class UserApi(Api):
    @classmethod
    @Api.config(require_login=False)
    def signup(cls, username=None, email=None, password=None, password2=None):
        if password != password2:
            raise cls.BadRequest({"password2": "Passwords don't match"})

        if len(password) < 8:
            raise cls.BadRequest(
                {"password": "Passwords must be at least 8 characters"}
            )

        if not email:
            raise cls.BadRequest({"email": "Email required"})

        queries.add_user(username=username, password=password, email=email)

    @classmethod
    @Api.config(require_login=False)
    def api_login(cls, username=None, password=None):
        if username and password:
            user = queries.User(username=username, password=password)
            if user and user.is_authenticated:
                return user.generate_token()

        raise cls.Forbidden()

    @classmethod
    @Api.config(require_login=True)
    def generate_temp_token(cls, _user=None):
        return _user.generate_token(datetime.timedelta(minutes=10))

    @classmethod
    def change_password(cls, new_password=None, _user=None):
        queries.update_user(user_id=_user.user_id, password=new_password)

    @classmethod
    def user(cls, _user):

app_class_proxy(app, "", "api/admin", AdminApi())
app_class_proxy(app, "", "api/user", UserApi())
app_class_proxy(app, "", "api/projects", projects.ProjectsApi())
app_class_proxy(app, "", "api/tools", tools.ToolsApi())
app_class_proxy(app, "", "api/pcb", pcb.PCBApi())
app_class_proxy(app, "", "api/framework", FrameworkApi())

------

import jwt
import logging

from . import queries

logger = logging.getLogger(__name__)

*/
