import { EmailTemplate } from '@/emails/feedback';
import { Resend } from 'resend';
import { log } from 'util';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(res: Request, req: Response) {
  const { email, userName } = await res.json();
  try {
    const { data, error } = await resend.emails.send({
      from: 'IntelliQ <support@intelliq.dev>',
      to: [email],
      subject: 'We Appreciate Your Feedback – IntelliQ by ARC Solutions',
      react: EmailTemplate({ name: userName }),
    });

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
