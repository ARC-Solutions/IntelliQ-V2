import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { UserAuthForm } from '@/components/LoginPage/user-auth-form';
import AvatarCircles from '@/components/avatar-circles';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Authentication forms built using the components.',
};

export default function AuthenticationPage() {
  //placeholder for now
  const avatarUrls = [
    'https://avatars.githubusercontent.com/u/16860528',
    'https://avatars.githubusercontent.com/u/20110627',
    'https://avatars.githubusercontent.com/u/106103625',
    'https://avatars.githubusercontent.com/u/59228569',
  ];

  return (
    <>
      <div className='container relative hidden min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
        <div className='lg:p-8 '>
          <div className='mx-auto flex w-[50vw] flex-col justify-center space-y-6 sm:w-[350px]'>
            <UserAuthForm />
          </div>
        </div>
        <div className='relative hidden h-full w-[50vw] flex-col bg-muted p-10 text-white dark:border-r lg:flex'>
          <div className='absolute inset-0 bg-zinc-900' />
          <div className='relative z-20 flex items-center text-lg font-medium'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='mr-2 h-6 w-6'
            >
              <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
            </svg>
            IntelliQ
          </div>
          <div className='flex flex-col justify-center items-center h-full relative'>
            <AvatarCircles numPeople={100} avatarUrls={avatarUrls} />
            <h1 className='text-white text-2xl font-bold mt-2'>Trusted by Users Worldwide</h1>
          </div>
          <div className='relative z-20 mt-auto'>
            <blockquote className='space-y-2'>
              <p className='text-lg'>
                &ldquo;IntelliQ is loved by thousands of people across the world, be part of the
                community and join us.&rdquo;
              </p>
              <footer className='text-sm text-primary'>ARC-Solutions</footer>
            </blockquote>
          </div>
        </div>
      </div>
    </>
  );
}
