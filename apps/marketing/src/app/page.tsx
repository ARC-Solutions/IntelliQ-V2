import {redirect} from "next/navigation";

export default function RootPage() {
  redirect(process.env.NEXT_PUBLIC_WEBAPP_URL ?? "https://www.intelliq.dev");
}
