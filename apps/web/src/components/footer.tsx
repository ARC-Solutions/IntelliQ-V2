import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { SocialLinks } from "./social-links";
import { Wordmark } from "./wordmark";

const navigation = [
  {
    title: "Features",
    links: [
      { name: "Dashboard", href: "/dashboard" },
      { name: "Singleplayer", href: "/singleplayer" },
      { name: "Multiplayer", href: "/multiplayer" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Github", href: "https://github.com/ARC-Solutions/IntelliQ-V2" },
      { name: "Contact us", href: "mailto:contact@arc-solutions.xyz" },
      {
        name: "Feature Request",
        href: "https://github.com/ARC-Solutions/IntelliQ-V2/issues",
        target: "_blank",
      },
    ],
  },
  {
    title: "Company",
    links: [{ name: "About us", href: "/about" }],
  },
];

export function Footer() {
  return (
    <>
      <footer className="border-t-[1px] border-border px-4 md:px-6 pt-10 md:pt-16 overflow-hidden md:max-h-[820px]">
        <div className="container mx-auto w-full">
          <div className="flex justify-between items-center border-border border-b-[1px] pb-10 md:pb-16 mb-12">
            <Link href="/" className="scale-50 -ml-[52px] md:ml-0 md:scale-100">
              <Image src="/logo.svg" alt="Midday" width={100} height={100} />
            </Link>
            <span className="font-normal md:text-2xl text-right">
              Start your AI quiz today!
            </span>
          </div>
          <div className="flex flex-col md:flex-row w-full">
            <div className="flex flex-col space-y-8 md:space-y-0 md:flex-row md:w-6/12 justify-between leading-8">
              {navigation.map((section) => (
                <div key={section.title}>
                  <span className="font-medium">{section.title}</span>
                  <ul>
                    {section.links.map((link) => (
                      <li
                        key={link.name}
                        className="transition-colors text-[#878787]"
                      >
                        <Link href={link.href} target={link.target}>
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
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
      </footer>
      <div className="container mt-8 h-[200px] mx-auto w-full">
        <Wordmark className="flex w-full" />
      </div>
    </>
  );
}
