import { assetPath } from "@/lib/asset-path";

/**
 * The sixteen stamps, in the target site's carousel order.
 *
 * `words` is the title split the way the site's two parallax lines split it: the first
 * word rides the top line, everything else rides the bottom one. Giazza is a single
 * word, so its bottom line is empty — that is the source's behaviour, not an omission.
 *
 * `ground`/`title`/`trail` are the site's own `bg`/`fg`/`path` triple, lifted from the
 * flight payload embedded in its homepage and matched to each poster by coordinate.
 */
export interface Poster {
  slug: string;
  /** Basename under `public/sites/.../posters/`. */
  image: string;
  words: readonly [string, string];
  place: string;
  coords: string;
  /** Tint for the "Monti Lessini" caption — the pale posters use slate over dust. */
  caption: "dust" | "slate";
  /** Canvas ground behind this stamp. */
  ground: string;
  /** The giant title lettering. */
  title: string;
  /** The footpath tiles leading to this stamp. */
  trail: string;
  /** Where the stamp links to. Omit for stamps that are not clickable. */
  href?: string;
  /**
   * Whether to print the "ITALIA" wordmark and "Monti Lessini" caption over the artwork.
   * The Penang set carries its own title inside the image and sits on a dust-coloured
   * ground, where that lettering would be both wrong and invisible.
   */
  lettering?: boolean;
}

export const POSTERS: readonly Poster[] = [
  {
    slug: "passo-malera",
    image: "PassoMalera",
    words: ["Passo", "Malera"],
    place: "S.Giorgio di Boscochiesanuova",
    coords: "N 45° 41' 10.93\" - E 11° 6' 23.18\"",
    caption: "dust",
    ground: "#51B37C",
    title: "#DF6A69",
    trail: "#F9CD6C",
  },
  {
    slug: "batu-ferringhi",
    image: "batu-ferringhi-v2",
    words: ["Batu", "Ferringhi"],
    place: "Batu Ferringhi, Penang",
    coords: "N 5° 28' 21\" - E 100° 14' 37\"",
    caption: "dust",
    ground: "#5D8BBA",
    title: "#E190B9",
    trail: "#F9CD6C",
    href: "https://you.ctrip.com/sightlist/batuferringhi57609.html",
    lettering: false,
  },
  {
    slug: "george-town",
    image: "george-town-v2",
    words: ["George", "Town"],
    place: "George Town, Penang",
    coords: "N 5° 24' 51\" - E 100° 19' 44\"",
    caption: "dust",
    ground: "#DF92B6",
    title: "#F9CD6C",
    trail: "#F9CD6C",
    href: "https://you.ctrip.com/sightlist/georgetown57611.html",
    lettering: false,
  },
  {
    slug: "sayang-hotel",
    image: "sayang-hotel-v2",
    words: ["Sayang", "Hotel"],
    place: "Shangri-La Rasa Sayang, Batu Ferringhi",
    coords: "N 5° 28' 33\" - E 100° 14' 40\"",
    caption: "dust",
    ground: "#5D8BBA",
    title: "#DD92AC",
    trail: "#F9CD6C",
    lettering: false,
  },
  {
    slug: "usm-campus",
    image: "usm-campus-v2",
    words: ["USM", "Campus"],
    place: "Universiti Sains Malaysia, Gelugor",
    coords: "N 5° 21' 23\" - E 100° 18' 06\"",
    caption: "dust",
    ground: "#DF6A69",
    title: "#F9CD6C",
    trail: "#F9CD6C",
    lettering: false,
  },
  {
    slug: "penang-hill",
    image: "penang-hill-v2",
    words: ["Penang", "Hill"],
    place: "Bukit Bendera, Penang",
    coords: "N 5° 25' 26\" - E 100° 16' 34\"",
    caption: "dust",
    ground: "#51B37C",
    title: "#DF6A69",
    trail: "#F9CD6C",
    lettering: false,
  },
  {
    slug: "penang-outlets",
    image: "penang-outlets-v2",
    words: ["Outlets", "Penang"],
    place: "Design Village, Batu Kawan",
    coords: "N 5° 16' 21\" - E 100° 26' 07\"",
    caption: "dust",
    ground: "#DF6A69",
    title: "#51B37C",
    trail: "#F9CD6C",
    lettering: false,
  },
  {
    slug: "malga-buse",
    image: "MalgaBuse",
    words: ["Malga", "Buse"],
    place: "Velo Veronese",
    coords: "N 45° 38' 14.86\" - E 11° 6' 1.00\"",
    caption: "dust",
    ground: "#DF6A69",
    title: "#F9CD6C",
    trail: "#F9CD6C",
  },
  {
    slug: "corno-daquilio",
    image: "Corno-DAquilio",
    words: ["Corno", "D'Aquilio"],
    place: "Località Tomasi",
    coords: "N 45° 40' 29.91\" - E 10° 56' 37.77\"",
    caption: "dust",
    ground: "#7B8024",
    title: "#4EA16F",
    trail: "#F9CD6C",
  },
  {
    slug: "cascate-di-molina",
    image: "CascatediMolina",
    words: ["Cascate", "di Molina"],
    place: "Molina",
    coords: "N 45° 36' 33.50\" - E 10° 54' 58.14\"",
    caption: "dust",
    ground: "#51B37C",
    title: "#DF6A69",
    trail: "#F9CD6C",
  },
  {
    slug: "rifugio-gaibana",
    image: "RifugioGaibana",
    words: ["Rifugio", "Gaibana"],
    place: "Molina",
    coords: "N 45° 41' 32.23\" - E 11° 5' 52.34\"",
    caption: "slate",
    ground: "#5D8BBA",
    title: "#DD92AC",
    trail: "#F9CD6C",
  },
  {
    slug: "malga-brusa",
    image: "MalgaBrusa",
    words: ["Malga", "Brusà"],
    place: "S.Giorgio di Boscochiesanuova",
    coords: "N 45° 43' 13.05\" - E 11° 5' 20.63\"",
    caption: "dust",
    ground: "#51B37C",
    title: "#DF6A69",
    trail: "#DF6A69",
  },
  {
    slug: "casetta-delle-fade",
    image: "CasettadelleFadedelvajodellaPissarota",
    words: ["Casetta", "delle Fade"],
    place: "Vajo della Pissadora Val Squaranto",
    coords: "N 45° 35' 58.52\" - E 11° 2' 38.46\"",
    caption: "dust",
    ground: "#F9CD6C",
    title: "#4CB57A",
    trail: "#F9CD6C",
  },
  {
    slug: "grotta-del-ciabattino",
    image: "GrottadelCiabattino",
    words: ["Grotta", "Ciabattino"],
    place: "Sant'Anna d'Alfaedo",
    coords: "N 45° 40' 37.74\" - E 10° 56' 56.78\"",
    caption: "dust",
    ground: "#D1726D",
    title: "#4CB57A",
    trail: "#DF6A69",
  },
  {
    slug: "giazza",
    image: "Giazza",
    words: ["Giazza", ""],
    place: "Selva di Progno",
    coords: "N 45° 39' 12.17\" - E 11° 7' 19.71\"",
    caption: "dust",
    ground: "#EBC46D",
    title: "#51B37C",
    trail: "#F9CD6C",
  },
  {
    slug: "busoni-di-sega-di-ala",
    image: "BusonidiSegadiAla",
    words: ["Busoni", "Sega di Ala"],
    place: "Sega di Ala",
    coords: "N 45° 42' 51.53\" - E 10° 57' 59.03\"",
    caption: "dust",
    ground: "#DD92AC",
    title: "#F9CD6C",
    trail: "#F9CD6C",
  },
] as const;

export const POSTER_BASE = "/sites/francobollimontilessini-d2eadb58/root-8a5edab2/posters";

export const posterSrc = (poster: Poster) => assetPath(`${POSTER_BASE}/${poster.image}.jpg`);
