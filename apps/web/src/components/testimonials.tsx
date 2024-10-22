import { cn } from "@/lib/utils";
import Marquee from "@/components/ui/marquee";

const reviews = [
  {
    name: "Pori Shobha",
    username: "@pori_shobha",
    body: "For all the quiz lovers watch out this is a game changer and will increase your curiosity quotient and the game.",
    img: "/testimonials/pori-shobha.jpeg",
    alt: "Pori Shobha",
  },
  {
    name: "Mark",
    username: "@splatmark2",
    body: "Very nice, I witnessed the early stages of this project and I'm happy about the development! Congrats!",
    img: "/testimonials/mark.png",
    alt: "Mark",
  },
  {
    name: "Ricky",
    username: "@rickyraveanu",
    body: "Full-stack guy. It's been amazing to contribute across the entire project!",
    img: "/testimonials/ricky.jpg",
    alt: "Ricky",
  },
  {
    name: "Nippon",
    username: "@noppin7",
    body: "Hey there! Lead Frontend Developer here. Developing IntelliQ with an incredible team has been an amazing journey!",
    img: "/testimonials/nippon.jpg",
    alt: "Nippon",
  },
  {
    name: "Nikola",
    username: "@nikola-petro",
    body: "Just tagging along. Thanks for the great work and project!",
    img: "https://avatar.vercel.sh/jack",
    alt: "Nikola",
  },
  {
    name: "Pauli",
    username: "@lilshadowws",
    body: "IntelliQ exceeded my expectations with its outstanding quality, ease of use, and impressive results!",
    img: "/testimonials/pauli.jpeg",
    alt: "Pauli",
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  img,
  name,
  username,
  body,
  alt,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
  alt: string;
}) => {
  return (
    <figure
      className={cn(
        "relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
        // light styles
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        // dark styles
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <img
          className="rounded-full"
          width="32"
          height="32"
          alt={alt}
          src={img}
        />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm">{body}</blockquote>
    </figure>
  );
};

export function Testimonials() {
  return (
    // <div className="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-lg md:shadow-xl">
    <div className="relative h-[400px] w-full flex-col items-center justify-center overflow-hidden rounded-lg md:shadow-xl">
      <Marquee pauseOnHover className="[--duration:20s]">
        {firstRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:20s]">
        {secondRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white dark:from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white dark:from-background"></div>
    </div>
  );
}
