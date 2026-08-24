import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Index" },
  { href: "/discover", label: "All" },
  { href: "/about", label: "About" },
] as const;

/** Fixed top nav with a hover-swap "flip up" text effect on each link. */
export function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 m-4 lg:mx-6 lg:my-6">
      <nav>
        <ul className="grid grid-cols-[1fr_auto_1fr] items-center">
          {NAV_LINKS.map((link, i) => (
            <li
              key={link.href}
              className={
                i === 1
                  ? "overflow-hidden justify-self-center"
                  : i === 2
                    ? "overflow-hidden justify-self-end pr-2"
                    : "overflow-hidden pr-2"
              }
            >
              <Link
                href={link.href}
                className="group relative inline-block cursor-pointer leading-none p-4 font-neue-montreal font-bold text-[13.05px] uppercase text-[#F2EEDE]"
              >
                <div className="relative h-[1em] overflow-hidden">
                  <div className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1/2">
                    <span>{link.label}</span>
                    <span>{link.label}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
