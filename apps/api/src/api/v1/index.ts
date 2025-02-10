import { Hono } from 'hono';
import quizzes from './quizzes.routes';
import quizSubmissions from './quiz-submissions.routes';
import rooms from './rooms.routes';

const v1 = new Hono<{ Bindings: CloudflareEnv }>()
  .route('/quizzes', quizzes)
  .route('/quiz-submissions', quizSubmissions)
  .route('/rooms', rooms)

export default v1;