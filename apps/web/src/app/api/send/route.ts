import { EmailTemplate } from "@/emails/feedback";
import { SupportEmailTemplate } from "@/emails/support";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(res: Request, req: Response) {
  const { email, firstName, lastName, socialMedia, message } = await res.json();
  try {
    await resend.contacts.create({
      firstName,
      lastName,
      email,
      audienceId: "898e7903-c7dc-4068-b496-a1e8da079e0f",
      unsubscribed: false,
    });

    const { data, error } = await resend.batch.send([
      {
        from: "IntelliQ <support@intelliq.dev>",
        to: [email],
        subject: "We Appreciate Your Feedback – IntelliQ by ARC Solutions",
        react: EmailTemplate({ name: `${firstName} ${lastName}` }),
      },
      {
        from: "IntelliQ Support <support@intelliq.dev>",
        to: ["support@intelliq.dev"],
        replyTo: [email],
        subject: `New Testimonial: ${socialMedia}`,
        react: SupportEmailTemplate({
          email,
          fullName: `${firstName} ${lastName}`,
          socialMedia,
          message,
          imageInstructions: true,
        }),
      },
    ]);

    if (error) {
      console.log(error);
      return Response.json({ error }, { status: 500 });
    }

    console.log(data);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
