"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { toast, useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useSupabase } from "./supabase-context";
import { useRouter } from "next/navigation";
type Props = {
  children: React.ReactNode;
};
interface User {
  id: string;
  email: string;
  img: string | null;
  name: string | null;
}

interface AuthContextValue {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  signinUsingOAuth: () => void;
  signout: () => void;
  signInWithOTP: (userInput: UserInput, isNewUser: boolean) => void;
  isOTPVerified: boolean;
  verifyOTP: (otp: string, email: string) => void;
  otpSent: boolean;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isNewUser: boolean;
  setIsNewUser: React.Dispatch<React.SetStateAction<boolean>>;
}

interface UserInput {
  email: string;
  firstName: string;
  lastName: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);
export const AuthProvider = ({ children }: Props) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean>(true);
  const [isOTPVerified, setIsOTPVerified] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { supabase } = useSupabase();
  const router = useRouter();

  const signInWithOTP = async (userInput: UserInput, isNewUser: boolean) => {
    setIsOTPVerified(false);
    setOtpSent(false);
    try {
      console.log(userInput.email);
      console.log(isNewUser);
      const options = {
        shouldCreateUser: isNewUser,
        ...(isNewUser
          ? {
              data: {
                email: userInput.email,
                firstName: userInput.firstName,
                lastName: userInput.lastName,
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
          title: "Error",
          description: "Account not found, did you mean to sign up?",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      toast({
        title: "OTP sent to email",
        description: "Please check your email for the OTP",
      });
      setOtpSent(true);
    } catch (error) {
      console.log(error);
    }
  };

  const verifyOTP = async (otp: string, email: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      setIsOTPVerified(true);
    } catch (error) {
      console.log(error);
      setIsOTPVerified(false);
    }
  };

  const signinUsingOAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3000/dashboard",
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
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
      setCurrentUser(null);
      toast({
        title: "User signed out",
        description: "You have been signed out",
      });
      router.push("/");
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
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    const user = session?.user;
    const avatar = user.user_metadata.avatar_url as string;
    const name = user.user_metadata.full_name as string;
    const userID = user?.id as string;
    const userEmail = user?.email as string;
    setCurrentUser({
      id: userID,
      email: userEmail,
      img: avatar || null,
      name: name || null,
    });
  };
  const value = {
    currentUser,
    setCurrentUser,
    signinUsingOAuth,
    signout,
    signInWithOTP,
    isOTPVerified,
    verifyOTP,
    otpSent,
    isLoading,
    setIsLoading,
    isNewUser,
    setIsNewUser,
  };

  useEffect(() => {
    getUserInfo();
  }, []);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const authContext = useContext(AuthContext);
  if (authContext === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return authContext as AuthContextValue;
};
