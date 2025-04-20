import { Footer } from "@/components/site-footer";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default async function MarketingLayout({
  children,
}: MarketingLayoutProps) {
  return (
    <>
      {/* <SiteBanner /> */}
      <main className="mx-auto flex-1 overflow-hidden">{children}</main>
      <Footer />
    </>
  );
}
