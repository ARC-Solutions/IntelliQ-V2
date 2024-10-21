"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";

// Define Zod schema for validation
const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  name: z.string().min(1, { message: "Name is required" }),
  socialMedia: z.string().refine((value) => value.includes("@"), {
    message: "Social Media handle must include '@'",
  }),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters" }),
});

export function SupportForm() {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      socialMedia: "",
      message: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const nameParts = values.name.trim().split(" ");
      const firstName =
        nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
      const lastName = nameParts
        .slice(1)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

      await fetch("/api/send", {
        method: "POST",
        body: JSON.stringify({
          email: values.email,
          firstName,
          lastName,
          socialMedia: values.socialMedia,
          message: values.message,
        }),
      });
      toast({
        title: "Feedback Submitted",
        variant: "success",
        description: "Thank you for your feedback! We appreciate your input.",
      });
      form.reset();
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      toast({
        title: "An Error Occured",
        variant: "destructive",
        description: "Please try again!",
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center pb-10">
      <h1 className="text-[20px] md:text-[50px] font-medium mb-10">
        Submit Your Testimonial
      </h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 w-full max-w-3xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="mb-2">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Email"
                      {...field}
                      className="w-full border border-gray-600 border-opacity-70"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Full Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="mb-2">Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                      className="w-full border border-gray-600 border-opacity-70"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Subject Field */}
          <FormField
            control={form.control}
            name="socialMedia"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="mb-2">Social Media</FormLabel>
                <FormControl>
                  <Input
                    placeholder="@alanthedev"
                    {...field}
                    className="w-full border border-gray-600 border-opacity-70"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Message Field */}
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="mb-2">Message</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the issue you're facing, along with any relevant information."
                    className="resize-none min-h-[150px] w-full border border-gray-500 border-opacity-70"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
