import Link from 'next/link';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import ChangeTheme from './change-theme';

const Cube = dynamic(() => import('./cube').then((mod) => mod.Cube), {
  ssr: false,
});

export default function Hero() {
  return (
    <section className='md:mt-[250px] relative md:min-h-[375px]'>
      {/* <div className="hero-slide-up flex flex-col mt-[240px]"> */}
      <div className='flex flex-col mt-[240px]'>
        <Link href='/'>
          <Button
            variant='outline'
            className='rounded-full border-border flex space-x-2 items-center'
          >
            <span className='text-sm'>Introducing Multiplayer</span>
            <ArrowRight />
          </Button>
        </Link>

        <h1 className='text-[30px] md:text-[90px] font-medium mt-6 leading-none'>
          Start your
          <br /> AI quiz today!
        </h1>

        <p className='mt-4 md:mt-6 max-w-[600px] text-[#878787]'>
          IntelliQ is an AI-powered platform that transforms the way you learn by offering
          personalized quizzes and multiplayer modes to engage with your peers.
        </p>

        <div className='mt-8'>
          <div className='flex items-center space-x-4'>
            <Link href='mailto:contact@arc-solutions.xyz'>
              <Button variant='outline' className='border border-primary h-12 px-6'>
                Talk to us
              </Button>
            </Link>

            <a href='https://app.intelliq.dev'>
              <Button className='h-12 px-5'>Get Started</Button>
            </a>
          </div>
        </div>
        <div
          className='absolute pointer-events-none transform-gpu w-auto h-auto
                  -top-[325px] -right-[300px] scale-[0.5]
                  sm:-right-[250px] sm:scale-[0.5] sm:flex sm:-top-[175px]
                  md:-top-[125px] md:-right-[250px] md:scale-[0.5] 
                  lg:-right-[225px] lg:scale-[0.6] lg:animate-[open-scale-up-fade_1.5s_ease-in-out]
                  xl:-right-[190px] xl:scale-[1.6] xl:-top-[200px]'
        >
          <div className='clip-cube'>
            <Cube />
          </div>
        </div>
      </div>
    </section>
  );
}
