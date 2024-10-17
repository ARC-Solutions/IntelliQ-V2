"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LastUsed, useLastUsed } from "./last-used";
import { useAuth } from "@/contexts/user-context";
import VerifyOTPForm from "./verify-otp-form";
interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  email: z.string().email(),
  firstName: z
    .string()
    .min(3, { message: "First name must be at least 3 characters" }),
  lastName: z
    .string()
    .min(3, { message: "Last name must be at least 3 characters" }),
});

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [lastUsed, setLastUsed] = useLastUsed();
  const [mounted, setMounted] = React.useState<boolean>(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  const {
    signInWithOTP,
    signinUsingOAuth,
    isOTPVerified,
    otpSent,
    isLoading,
    setIsLoading,
    isNewUser,
    setIsNewUser,
  } = useAuth();
  const oauthSignIn = async () => {
    try {
      setIsLoading(true);
      setLastUsed("google");
      signinUsingOAuth();
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      setLastUsed("email");
      signInWithOTP(
        {
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
        },
        isNewUser
      );
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  if (otpSent) {
    return <VerifyOTPForm email={email} />;
  }
  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {" "}
          {isNewUser ? "Create an account" : "Sign in to your account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isNewUser
            ? "Enter your email below to create your account"
            : "Enter your email below to sign in to your account"}
        </p>
      </div>

      <div className={cn("grid gap-6", className)} {...props}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 flex-col">
              {isNewUser && (
                <div className="grid gap-1">
                  <div className="flex justify-between gap-5">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-400">
                            First Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John"
                              {...field}
                              disabled={isLoading}
                              className="mt-2"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-400">
                            Last Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Doe"
                              {...field}
                              disabled={isLoading}
                              className="mt-2"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    {isNewUser && (
                      <FormLabel className="text-gray-400">Email</FormLabel>
                    )}
                    <FormControl>
                      <Input
                        placeholder="name@example.com"
                        type="email"
                        {...field}
                        disabled={isLoading}
                        className="mt-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="relative">
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isNewUser ? "Sign up" : "Sign in"} with Email
                {lastUsed === "email" && mounted && <LastUsed />}
              </Button>

              <Label className="text-gray-400 " htmlFor="password">
                {isNewUser
                  ? "Already have an account? "
                  : "Don't have an account? "}
                <span
                  onClick={() => setIsNewUser(!isNewUser)}
                  className="text-primary cursor-pointer"
                >
                  {isNewUser ? "Sign in" : "Sign up"}
                </span>
              </Label>
            </div>
          </form>
        </Form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={() => {
            oauthSignIn();
          }}
          className="relative"
        >
          {isLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.google className="mr-2 h-4 w-4" />
          )}{" "}
          Google {lastUsed === "google" && mounted && <LastUsed />}
        </Button>
      </div>
      <p className="px-8 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <span className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </span>{" "}
        and{" "}
        <span className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </span>
        .
      </p>
    </>
  );
}
