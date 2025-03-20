"use client";

import { verifyOtpAction } from "@/app/actions/verify-otp-action";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "../ui/input-otp";

export default function VerifyOTPForm({ email }: { email: string }) {
  const verifyOtp = useAction(verifyOtpAction);
  const [otp, setOtp] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();

  const handleContinue = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Please Complete the OTP",
        variant: "destructive",
      });
      return;
    }

    verifyOtp.execute({
      email,
      token: otp,
    });
  };

  useEffect(() => {
    if (verifyOtp.result.validationErrors || verifyOtp.result.serverError) {
      // extract validation error message if it exists
      const validationMessage =
        verifyOtp.result.validationErrors?._errors?.[0] ||
        verifyOtp.result.validationErrors?.email?._errors?.[0] ||
        verifyOtp.result.validationErrors?.token?._errors?.[0];

      toast({
        title: "Verification Failed",
        description:
          validationMessage ||
          verifyOtp.result.serverError ||
          "Please try again",
        variant: "destructive",
      });
    }
  }, [verifyOtp.result, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen text-white">
      <div className="p-8 space-y-6">
        <h1 className="text-4xl font-bold text-center mb-6">
          Security code sent!
        </h1>
        <p className="text-gray-400 text-center">
          To continue, please enter the 6 digit verification code sent to the
          provided email.
        </p>
        <div className="space-y-2">
          <Label htmlFor="otp-1" className="sr-only">
            OTP
          </Label>
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => setOtp(value)}
            
          >
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
        <div className="text-center">
          <Button variant="link" className="text-gray-400 hover:text-white">
            Didn't receive the code? Resend
          </Button>
        </div>
        <Button
          onClick={handleContinue}
          className="w-full bg-primary text-black hover:bg-gray-200"
          disabled={verifyOtp.status === "executing"}
        >
          {verifyOtp.status === "executing" ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Continue"
          )}
        </Button>
        <p className="text-xs text-gray-500 text-center">
          By continuing, you agree to IntelliQ's{" "}
          <a href="#" className="underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
