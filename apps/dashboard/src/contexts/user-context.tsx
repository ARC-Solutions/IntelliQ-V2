'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSupabase } from './supabase-context';

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
  getUserInfo: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: Props) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { supabase } = useSupabase();
  const { toast } = useToast();

  const getUserInfo = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log(error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
    
    const user = data?.session?.user;
    console.log(user);
    const avatar = user?.user_metadata.avatar_url as string;
    const name = user?.user_metadata.name as string;
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
    getUserInfo,
  };

  useEffect(() => {
    getUserInfo();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          getUserInfo();
        } else {
          setCurrentUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
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
