"use client";

import { useInView } from "framer-motion";
import { useRef } from "react";
import { GitHubLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";

export default function MembersSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const members = [
    {
      name: "Ricky Raveanu",
      image: "./members/ricky.jpg",
      skills: [
        "Lead System Architect",
        "Full-Stack Engineer",
        "Platform Engineer",
      ],
    },
    {
      name: "Nippon Lama",
      image: "./members/nippon.jpg",
      skills: ["Frontend Engineer", "Full-Stack Developer", "Designer"],
    },
    {
      name: "Nikola Petrovic",
      image: "./members/nikolaPFP.png",
      skills: ["Frontend Developer", "Designer", "Backend Developer"],
    },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0  from-black/[0.02] to-transparent dark:from-white/[0.02] pointer-events-none" />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px] pointer-events-none" />

      <div ref={ref} className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-800 to-neutral-500 dark:from-neutral-100 dark:to-neutral-400">
            Meet Our Team
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {members.map((member, index) => (
            <div
              key={member.name}
              style={{
                transform: inView ? "none" : "translateY(50px)",
                opacity: inView ? 1 : 0,
                transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.2}s`,
              }}
              className="group"
            >
              <div className="relative p-6 rounded-2xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors">
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 animate-pulse" />
                  <img
                    src={member.image}
                    alt={member.name}
                    className="relative rounded-full object-cover w-full h-full border-2 border-neutral-200 dark:border-neutral-800 group-hover:border-neutral-400 dark:group-hover:border-neutral-600 transition-colors"
                  />
                </div>

                <div className="text-center">
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                    {member.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 justify-center mb-6">
                    {member.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 text-sm rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
