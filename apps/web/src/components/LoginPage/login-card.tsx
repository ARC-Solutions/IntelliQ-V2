'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/user-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRef, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-toastify';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6';
import { showToast } from '@/utils/show-toast';
import { LastUsed, useLastUsed } from '@/components/LoginPage/last-used';

const LoginCard = () => {
  const [isANewUser, setIsAnewUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signinUsingEmail, signupUsingEmail, signinUsingOAuth } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const [lastUsed, setLastUsed] = useLastUsed();
  const handleSubmit = async (isGoogleOAuth: boolean = false) => {
    if (isGoogleOAuth) {
      try {
        signinUsingOAuth();
        setLastUsed('google');
        return;
      } catch (error) {
        toast.error('Failed to initiate Google sign in.');
        return;
      }
    }

    const email = emailRef.current?.value as string;
    const password = passwordRef.current?.value as string;
    const confirmPassword = confirmPasswordRef.current?.value as string;

    if (!email || !password || (isANewUser && !confirmPassword)) {
      toast.error('Please fill out all the fields');
      return;
    }

    if (isANewUser) {
      if (password !== confirmPassword) {
        toast.error('Your Password does not match');
        return;
      } else {
        try {
          signupUsingEmail({ email, password });
          setLastUsed('email');
          showToast(
            'success',
            'Account Created',
            'Your account has been created! Please check your inbox for a confirmation email.',
          );
        } catch (error) {
          toast.error('Error signing up. Please try again.');
        }
      }
    } else {
      signinUsingEmail({ email, password });
      setLastUsed('email');
    }
  };

  return (
    <div className='group relative w-auto duration-700 hover:border-violet-400/50 hover:bg-violet-800/10 sm:w-[450px]'>
      <Tabs defaultValue='signup' className='w-auto sm:w-[450px]'>
        <TabsList className='grid w-full grid-cols-2 rounded-lg border-none bg-[#0e0e0e] shadow-[0_0px_20px_-4px_rgba(0,0,0,0.24)] shadow-primary'>
          <TabsTrigger value='signup' className='data-[state=active]:bg-[#c8b6ff]'>
            Sign Up
          </TabsTrigger>
          <TabsTrigger value='signin' className='data-[state=active]:bg-[#c8b6ff]'>
            Sign In
          </TabsTrigger>
        </TabsList>
        <TabsContent value='signin'>
          <Card className='w-auto rounded-lg border-none p-4 shadow-[0_0px_20px_-4px_rgba(0,0,0,0.24)] shadow-primary sm:w-[450px]'>
            <CardHeader className='pb-5'>
              <CardTitle className='text-3xl'>ARC-Solutions</CardTitle>
              <CardDescription className='pb-2 pt-1 text-xl'>
                Let&apos;s Sign You In
              </CardDescription>
              <Button
                onClick={() => handleSubmit(true)}
                className='relative bg-[#fafafa] p-5 hover:bg-[#fafafa]/90 active:bg-[#fafafa]/80'
              >
                <div className='place-content-center text-3xl'>
                  <FcGoogle size='' />
                </div>
                {lastUsed === 'google' && <LastUsed />}
              </Button>
              <div className='border-b-[0.5px] border-white border-opacity-70 pb-1 pt-1'></div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(false);
                }}
              >
                <div>
                  <div className='mb-5'>
                    <div className='mb-1.5'>
                      <Label htmlFor='email' className='font-thin'>
                        Email Address
                      </Label>
                    </div>
                    <Input
                      type='email'
                      id='email'
                      placeholder='Enter your Email Address'
                      ref={emailRef}
                      className='border-2 font-medium placeholder:text-white placeholder:opacity-70'
                    />
                  </div>
                  <div className='relative mb-5'>
                    <div className='mb-1.5'>
                      <Label htmlFor='password' className='font-thin'>
                        Your Password
                      </Label>
                    </div>
                    <Input
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Enter your Password'
                      ref={passwordRef}
                      className='border-2 pr-8 font-medium placeholder:text-white placeholder:opacity-70'
                    />
                    <Button
                      type='button'
                      className='absolute bottom-1 right-1 h-7 w-7'
                      size='icon'
                      variant='ghost'
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                      <span className='sr-only'>Toggle password visibility</span>
                    </Button>
                  </div>
                </div>
                <Button
                  type='submit'
                  className='relative w-full rounded-none p-5 text-center text-xl font-[550] active:bg-primary/80'
                  onClick={() => setIsAnewUser(false)}
                >
                  Sign In
                  {lastUsed === 'email' ? <LastUsed /> : null}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='signup'>
          <Card className='w-auto rounded-lg border-none p-4 shadow-[0_0px_20px_-4px_rgba(0,0,0,0.24)] shadow-primary sm:w-[450px]'>
            <CardHeader className='pb-5'>
              <CardTitle className='text-3xl'>ARC-Solutions</CardTitle>
              <CardDescription className='pb-2 pt-1 text-xl'>
                Let&apos;s Sign You Up
              </CardDescription>
              <Button
                onClick={() => handleSubmit(true)}
                className='relative bg-[#fafafa] p-5 hover:bg-[#fafafa]/90 active:bg-[#fafafa]/80'
              >
                <div className='place-content-center text-3xl'>
                  <FcGoogle size='' />
                </div>
                {lastUsed === 'google' && <LastUsed />}
              </Button>
              <div className='border-b-[0.5px] border-white border-opacity-70 pb-1 pt-1'></div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(false);
                }}
              >
                <div>
                  <div className='mb-5'>
                    <div className='mb-1.5'>
                      <Label htmlFor='email' className='font-thin'>
                        Email Address
                      </Label>
                    </div>
                    <Input
                      type='email'
                      id='email'
                      placeholder='Enter your Email Address'
                      ref={emailRef}
                      className='border-2 font-medium placeholder:text-white placeholder:opacity-70'
                    />
                  </div>
                  <div className='relative mb-5'>
                    <div className='mb-1.5'>
                      <Label htmlFor='password' className='font-thin'>
                        Your Password
                      </Label>
                    </div>
                    <Input
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Enter your Password'
                      ref={passwordRef}
                      className='border-2 pr-8 font-medium placeholder:text-white placeholder:opacity-70'
                    />
                    <Button
                      type='button'
                      className='absolute bottom-1 right-1 h-7 w-7'
                      size='icon'
                      variant='ghost'
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                      <span className='sr-only'>Toggle password visibility</span>
                    </Button>
                  </div>
                  <div className='relative mb-5'>
                    <div className='mb-1.5'>
                      <Label htmlFor='confirmPassword' className='font-thin'>
                        Confirm Password
                      </Label>
                    </div>
                    <Input
                      id='confirmPassword'
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder='Confirm your Password'
                      ref={confirmPasswordRef}
                      className='border-2 pr-8 font-medium placeholder:text-white placeholder:opacity-70'
                    />
                    <Button
                      type='button'
                      className='absolute bottom-1 right-1 h-7 w-7'
                      size='icon'
                      variant='ghost'
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                      <span className='sr-only'>Toggle password visibility</span>
                    </Button>
                  </div>
                </div>
                <Button
                  type='submit'
                  className='relative w-full rounded-none p-5 text-center text-xl font-[550] active:bg-primary/80'
                  onClick={() => setIsAnewUser(true)}
                >
                  Sign Up
                  {lastUsed === 'email' ? <LastUsed /> : null}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoginCard;
