import Image from "next/image";
import Link from "next/link";
import { SocialLinks } from "./social-links";

export function Footer() {
  return (
    <footer className="border-t-[1px] border-border px-4 md:px-6 pt-10 md:pt-16 overflow-hidden md:max-h-[820px]">
      <div className="container mx-auto w-full">
        <div className="flex justify-between items-center border-border border-b-[1px] pb-10 md:pb-16 mb-12">
          <Link href="/" className="scale-50 -ml-[52px] md:ml-0 md:scale-100">
            <Image src="/vercel.svg" alt="Midday" width={100} height={100} />
          </Link>

          <span className="font-normal md:text-2xl text-right">
            Run and never come back.
          </span>
        </div>
        <div className="flex flex-col md:flex-row w-full">
          <div className="flex flex-col space-y-8 md:space-y-0 md:flex-row md:w-6/12 justify-between leading-8">
            <div>
              <span className="font-medium">Features</span>
              <ul>
                <li className="transition-colors text-[#878787]">
                  <Link href="/dashboard">Dashboard</Link>
                </li>
                <li className="transition-colors text-[#878787]">
                  <Link href="/singleplayer">Singleplayer</Link>
                </li>
                <li className="transition-colors text-[#878787]">
                  <Link href="/multiplayer">Multiplayer</Link>
                </li>
              </ul>
            </div>

            <div>
              <span>Resources</span>
              <ul>
                <li className="transition-colors text-[#878787]">
                  <Link href="https://github.com/ARC-Solutions/IntelliQ-V2">
                    Github
                  </Link>
                </li>
                <li className="transition-colors text-[#878787]">
                  <Link href="mailto:contact@arc-solutions.xyz">
                    Contact us
                  </Link>
                </li>
                <li className="transition-colors text-[#878787]">
                  <Link
                    href="https://github.com/ARC-Solutions/IntelliQ-V2/issues"
                    target="_blank"
                  >
                    Feature Request
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="md:w-6/12 flex mt-8 md:mt-0 md:justify-end">
            <div className="flex md:items-end flex-col">
              <div className="flex items-start md:items-center flex-col md:flex-row space-y-6 md:space-y-0 mb-8">
                <SocialLinks />
              </div>
            </div>
          </div>
        </div>
      </div>
      <h5 className="text-[#161616] text-[500px] leading-none text-center pointer-events-none py-1.5">
        IntelliQ
      </h5>
    </footer>
  );
}
