"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { SocialLinks } from "./social-links";
import { Wordmark } from "./wordmark";
import { ROUTES } from "../../constants/routes";

const navigation = [
  {
    title: "Features",
    links: [
      { name: "Dashboard", href: ROUTES.HOME },
      { name: "Singleplayer", href: ROUTES.SINGLEPLAYER },
      { name: "Multiplayer", href: ROUTES.MULTIPLAYER },
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
  const { resolvedTheme } = useTheme();
  return (
    <div className="ml-5 mr-5">
      <footer className="border-t-[1px] border-border px-4 md:px-6 pt-10 md:pt-16 overflow-hidden md:max-h-[820px]">
        <div className="container w-full mx-auto">
          <div className="flex justify-between items-center border-border border-b-[1px] pb-10 md:pb-16 mb-12">
            <Link href="/" className="scale-50 -ml-[52px] md:ml-0 md:scale-100">
              <Image
                src={resolvedTheme === "dark" ? "/logo.svg" : "/logo-dark.svg"}
                alt="IntelliQ"
                width={100}
                height={100}
              />
            </Link>
            <span className="font-normal text-right md:text-2xl">
              Start your AI quiz today!
            </span>
          </div>
          <div className="flex flex-col w-full md:flex-row">
            <div className="flex flex-col justify-between space-y-8 leading-8 md:space-y-0 md:flex-row md:w-6/12">
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
            <div className="flex mt-8 md:w-6/12 md:mt-0 md:justify-end">
              <div className="flex flex-col md:items-end">
                <div className="flex flex-col items-start mb-8 space-y-6 md:items-center md:flex-row md:space-y-0">
                  <SocialLinks />
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <div className="container mt-8 h-[200px] mx-auto w-full">
        <Wordmark className="flex w-full text-gray-800 dark:text-white" />
      </div>
    </div>
  );
}
