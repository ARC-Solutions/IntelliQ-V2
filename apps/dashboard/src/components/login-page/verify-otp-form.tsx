'use client';

import { use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '../ui/input-otp';
import { useAuth } from '@/contexts/user-context';
import { useRouter } from 'next/navigation';
import { toast, useToast } from '@/components/ui/use-toast';
import { verifyOTP } from '@/actions/auth-action';

export default function VerifyOTPForm({ email }: { email: string }) {
  const [otp, setOtp] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleContinue = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Please Complete the OTP',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('email', email);
    formData.append('otp', otp);

    try {
      const result = await verifyOTP(formData);
      if (result?.error) {
        toast({
          title: 'Verification Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
      // Successful verification will automatically redirect to dashboard
    } catch (error) {
      toast({
        title: 'Something went wrong',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-black text-white'>
      <div className='w-full max-w-md p-8 space-y-6'>
        <h1 className='text-4xl font-bold text-center mb-6'>Security code sent!</h1>
        <p className='text-gray-400 text-center'>
          To continue, please enter the 6 digit verification code sent to the provided email.
        </p>
        <div className='space-y-2'>
          <Label htmlFor='otp-1' className='sr-only'>
            OTP
          </Label>
          <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <div className='text-center'>
          <Button variant='link' className='text-gray-400 hover:text-white'>
            Didn't receive the code? Resend
          </Button>
        </div>
        <Button 
          onClick={handleContinue} 
          className='w-full bg-primary text-black hover:bg-gray-200'
          disabled={isLoading}
        >
          {isLoading ? 'Verifying...' : 'Continue'}
        </Button>
        <p className='text-xs text-gray-500 text-center'>
          By continuing, you agree to IntelliQ&copy;s
          <a href='#' className='underline'>
            Terms of Service
          </a>{' '}
          and{' '}
          <a href='#' className='underline'>
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
