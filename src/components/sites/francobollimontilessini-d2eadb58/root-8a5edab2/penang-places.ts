/**
 * The places the Penang map pins.
 *
 * Coordinates are approximate — good to a block or so, which is enough to put a pin on the
 * right building at street zoom, but they have not been surveyed. Check any you intend to
 * navigate by.
 *
 * Most of these sit inside George Town's old quarter and are only a few hundred metres
 * apart, so they separate out as you zoom in rather than at first sight.
 */
export interface Place {
  id: string;
  /** The label on the pin. */
  name: string;
  /** English name, under the label. */
  english: string;
  lat: number;
  lng: number;
  /** Set for the places that also have a stamp, so the pin can point at its page. */
  slug?: string;
}

export const PENANG_PLACES: readonly Place[] = [
  {
    id: "penang-hill",
    name: "升旗山",
    english: "Penang Hill",
    lat: 5.4239,
    lng: 100.2686,
    slug: "penang-hill",
  },
  {
    id: "usm",
    name: "USM 理科大学",
    english: "Universiti Sains Malaysia",
    lat: 5.356,
    lng: 100.302,
    slug: "usm-campus",
  },
  {
    id: "batu-ferringhi",
    name: "峇都丁宜沙滩",
    english: "Batu Ferringhi Beach",
    lat: 5.472,
    lng: 100.25,
    slug: "batu-ferringhi",
  },
  {
    id: "design-village",
    name: "槟城奥特莱斯",
    english: "Design Village Outlet Mall",
    lat: 5.273,
    lng: 100.436,
    slug: "penang-outlets",
  },
  {
    id: "sayang-hotel",
    name: "香格里拉沙洋酒店",
    english: "Shangri-La Rasa Sayang",
    lat: 5.4781,
    lng: 100.2536,
    slug: "sayang-hotel",
  },
  {
    id: "st-george",
    name: "圣乔治教堂",
    english: "St. George's Church",
    lat: 5.4188,
    lng: 100.3383,
  },
  {
    id: "street-art",
    name: "壁画街",
    english: "Armenian Street Art",
    lat: 5.4148,
    lng: 100.3378,
  },
  {
    id: "city-hall",
    name: "市政厅",
    english: "City Hall",
    lat: 5.4211,
    lng: 100.3419,
  },
  {
    id: "clan-jetties",
    name: "姓氏桥",
    english: "Chew Jetty",
    lat: 5.413,
    lng: 100.3405,
  },
  {
    id: "khoo-kongsi",
    name: "龙山堂邱公司",
    english: "Khoo Kongsi",
    lat: 5.4152,
    lng: 100.3374,
  },
  {
    id: "peranakan",
    name: "侨生博物馆",
    english: "Pinang Peranakan Mansion",
    lat: 5.4194,
    lng: 100.339,
  },
  {
    id: "blue-mansion",
    name: "蓝屋",
    english: "Cheong Fatt Tze Mansion",
    lat: 5.421,
    lng: 100.335,
  },
] as const;

/**
 * How far the map is allowed to travel: Penang island plus the strip of mainland that
 * Design Village sits on, and nothing else.
 */
export const PENANG_BOUNDS = {
  south: 5.12,
  west: 100.13,
  north: 5.62,
  east: 100.58,
} as const;

/** Great-circle distance in kilometres. */
export function distanceKm(a: Place, b: Place) {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
