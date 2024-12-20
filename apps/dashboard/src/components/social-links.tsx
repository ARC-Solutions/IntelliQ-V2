import { FaGithub } from "react-icons/fa";
import { FaProductHunt } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

export function SocialLinks() {
  return (
    <ul className="flex space-x-4 items-center md:ml-5">
      <li>
        <a target="_blank" rel="noreferrer" href="https://go.midday.ai/lS72Toq">
          <span className="sr-only">Twitter</span>
          <FaXTwitter size={22} className="fill-[#878787]" />
        </a>
      </li>
      <li>
        <a target="_blank" rel="noreferrer" href="https://go.midday.ai/7rhA3rz">
          <span className="sr-only">Producthunt</span>
          <FaProductHunt size={22} className="fill-[#878787]" />
        </a>
      </li>
      <li>
        <a target="_blank" rel="noreferrer" href="https://git.new/midday">
          <span className="sr-only">Github</span>
          <FaGithub size={22} className="fill-[#878787]" />
        </a>
      </li>
    </ul>
  );
}
