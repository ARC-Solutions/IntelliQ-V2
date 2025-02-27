import { cn } from '@/lib/utils';
import Hero from './hero';
import AnimatedGridPattern from './ui/animated-grid-pattern';
import { Testimonials } from './testimonials';
import { SupportForm } from './support-form';

export default function StartPage() {
  return (
    <div className='relative'>
      <div className='px-4'>
        <Hero />
      </div>
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.6}
        duration={3}
        repeatDelay={1}
        className={cn(
          '[mask-image:radial-gradient(750px_circle_at_center,white,transparent)]',
          'inset-x-0 inset-y-[-40%] h-[90%] skew-y-12 -z-10',
        )}
      />
      <div className='mt-[75px]'>
        <Testimonials />
      </div>
      <SupportForm/>
    </div>
  );
}
