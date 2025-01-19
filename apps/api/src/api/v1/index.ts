import { Hono } from 'hono';
import quizzes from './quizzes.routes';
import rooms from './rooms.routes';

const v1 = new Hono<{ Bindings: CloudflareEnv }>()
  .route('/quizzes', quizzes)
  .route('/rooms', rooms)

export default v1;