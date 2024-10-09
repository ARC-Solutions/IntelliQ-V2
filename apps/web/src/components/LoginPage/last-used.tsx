'use client';

import { useLocalStorage } from 'usehooks-ts';

const useLastUsed = () => {
  return useLocalStorage<'google' | 'email' | undefined>('last_intelliq_login', undefined);
};

const LastUsed = () => {
  return (
    <span className='text-content-subtle absolute right-4 top-1/2 -translate-y-1/2 text-xs'>
      <span className='inline-block animate-calm-shimmer bg-gradient-to-r from-transparent via-black/80 to-transparent bg-[length:300%_100%] bg-clip-text text-transparent'>
        Last used
      </span>
    </span>
  );
};

export { useLastUsed, LastUsed };
