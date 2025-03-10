import { hc } from 'hono/client';
import type { AppType } from '@intelliq/api';

export const createApiClient = () => {
  const basePath = process.env.NODE_ENV === 'production' ? '/' : '/api/v1';
  // const basePath = 'https://app.intelliq.dev/';
  return hc<AppType>(basePath);
};
 