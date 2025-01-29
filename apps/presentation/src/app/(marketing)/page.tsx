import HeroSection from "@/components/landing/hero-section";
import MembersSection from "@/components/landing/members-section";
import PoweringIntelliq from "@/components/landing/powering-intelliq";
import VisualEnhance from "@/components/landing/visual-section";
import Particles from "@/components/magicui/particles";
import { SphereMask } from "@/components/magicui/sphere-mask";

export default async function Page() {
  return (
    <>
      <HeroSection />
      <VisualEnhance />

      <PoweringIntelliq />
      <MembersSection />
      <SphereMask />
      {/* <CallToActionSection /> */}
      <Particles
        className='absolute inset-0 -z-10'
        quantity={50}
        ease={70}
        size={0.05}
        staticity={40}
        color={'#ffffff'}
      />
    </>
  );
}
