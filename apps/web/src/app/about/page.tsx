import MembersSection from "@/components/members-section";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About IntelliQ",
};

export default function AboutPage() {
  return <MembersSection />;
}
