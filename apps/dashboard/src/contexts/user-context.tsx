'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { toast, useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useSupabase } from './supabase-context';
import { useRouter } from 'next/navigation';
import { log } from 'console';
type Props = {
  children: React.ReactNode;
};
interface User {
  id: string;
  email: string;
  img: string;
  name: string;
}

interface AuthContextValue {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  signinUsingOAuth: () => void;
  signout: () => void;
  signInWithOTP: (userInput: UserInput, isNewUser: boolean) => void;
  otpSent: boolean;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isNewUser: boolean;
  setIsNewUser: React.Dispatch<React.SetStateAction<boolean>>;
  getUserInfo: () => void;
}

interface SignUpInput {
  email: string;
  firstName: string;
  lastName: string;
}

interface SignInInput {
  email: string;
}

type UserInput = SignUpInput | SignInInput;

const AuthContext = createContext<AuthContextValue | null>(null);
export const AuthProvider = ({ children }: Props) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean>(true);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLobbyCreator, setIsLobbyCreator] = useState<boolean>(false);

  const { supabase } = useSupabase();
  const router = useRouter();

  const signInWithOTP = async (userInput: UserInput, isNewUser: boolean) => {
    setOtpSent(false);
    try {
      console.log(userInput.email);
      console.log(isNewUser);
      const options = {
        shouldCreateUser: isNewUser,
        ...(isNewUser && 'firstName' in userInput
          ? {
              data: {
                email: userInput.email,
                name: `${userInput.firstName} ${userInput.lastName}`,
              },
            }
          : {}),
      };

      const { data, error } = await supabase.auth.signInWithOtp({
        email: userInput.email,
        options: options,
      });
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      toast({
        title: 'OTP sent to email',
        description: 'Please check your email for the OTP',
      });
      setOtpSent(true);
    } catch (error) {
      console.log(error);
    }
  };

  const signinUsingOAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/dashboard',
        },
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const signout = async () => {
    try {
      await supabase.auth.signOut();
      setOtpSent(false);
      setIsLoading(false);
      toast({
        title: 'User signed out',
        description: 'You have been signed out',
      });
      router.push('/login');
    } catch (error) {
      console.log(error);
    }
  };
  const getUserInfo = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (!session) {
      return;
    }
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
    const user = session?.user;

    const avatar = user.user_metadata.avatar_url as string;
    const name = user.user_metadata.name as string;
    const userID = user?.id as string;
    const userEmail = user?.email as string;
    setCurrentUser({
      id: userID,
      email: userEmail,
      img: avatar,
      name: name,
    });
  };
  const value = {
    currentUser,
    setCurrentUser,
    signinUsingOAuth,
    signout,
    signInWithOTP,
    otpSent,
    isLoading,
    setIsLoading,
    isNewUser,
    setIsNewUser,
    getUserInfo,
  };

  useEffect(() => {
    getUserInfo();
  }, []);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const authContext = useContext(AuthContext);
  if (authContext === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return authContext as AuthContextValue;
};
