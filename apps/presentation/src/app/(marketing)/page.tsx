import ClientSection from "@/src/components/landing/client-section";
import CallToActionSection from "@/src/components/landing/cta-section";
import HeroSection from "@/src/components/landing/hero-section";
import PricingSection from "@/src/components/landing/pricing-section";
import Particles from "@/src/components/magicui/particles";
import { SphereMask } from "@/src/components/magicui/sphere-mask";
import PoweringIntelliq from "@/src/components/landing/powering-intelliq";
export default async function Page() {
  return (
    <>
      <HeroSection />
      <PoweringIntelliq />
      <SphereMask />
      {/* <CallToActionSection /> */}
      <Particles
        className="absolute inset-0 -z-10"
        quantity={50}
        ease={70}
        size={0.05}
        staticity={40}
        color={"#ffffff"}
      />
    </>
  );
}
