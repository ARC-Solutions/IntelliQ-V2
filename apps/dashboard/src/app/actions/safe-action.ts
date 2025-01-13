import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';

// Base client for regular actions
export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }
    return DEFAULT_SERVER_ERROR_MESSAGE;
  }
});

// Edge client with Hyperdrive context
export const edgeActionClient = actionClient
  .use(async ({ next }) => {
    // @ts-expect-error Runtime binding
    const hyperdrive: Hyperdrive = process.env.HYPERDRIVE;
    return next({ ctx: { env: { HYPERDRIVE: hyperdrive } } });
  });
