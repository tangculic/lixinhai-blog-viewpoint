import type { SVGProps } from "react";

/** Three overlapping mountain peaks — the site's logo mark. */
export function MountainPeaksIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="223"
      height="74"
      viewBox="0 0 223 74"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M91.0094 11.2009L54.8613 73.8095H165.942L129.794 11.2009C121.177 -3.72581 99.6266 -3.72581 91.0094 11.2009Z"
        fill="currentColor"
      />
      <path
        d="M20.2304 40.0524L0.742188 73.8093H78.5034L59.0152 40.0524C50.398 25.1257 28.8476 25.1257 20.2304 40.0524Z"
        fill="currentColor"
      />
      <path
        d="M163.846 40.0524L144.357 73.8093H222.119L202.63 40.0524C194.013 25.1257 172.463 25.1257 163.846 40.0524Z"
        fill="currentColor"
      />
    </svg>
  );
}
