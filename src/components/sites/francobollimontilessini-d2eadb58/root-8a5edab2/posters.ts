import { assetPath } from "@/lib/asset-path";

/**
 * The stamps, in carousel order.
 *
 * `words` is the title split the way the site's two parallax lines split it: the first
 * word rides the top line, everything else rides the bottom one. A single-word title
 * leaves the bottom line empty — that is the source's behaviour, not an omission.
 *
 * `ground`/`title`/`trail` are the site's own `bg`/`fg`/`path` triple: the canvas colour
 * behind a stamp, its giant lettering, and the footpath that leads to it.
 */
export interface Poster {
  slug: string;
  /**
   * Basename under `public/sites/.../posters/`. The stamp: on the reel it is never wider
   * than a 340px slot, so ~800px of source covers a 2-3x phone and there is no reason for
   * it to be larger — five of these load on the index at once.
   */
  image: string;
  /**
   * A higher-resolution copy of the same artwork, same crop, for the opened page's
   * full-bleed hero. Optional; without one the hero falls back to `image`.
   *
   * The two uses are far apart in size — a stamp is a few hundred pixels wide, the hero is
   * the whole screen, which is ~1200px on a 3x phone — and one file cannot serve both:
   * sized for the hero it makes the index pay four times over for detail no stamp can
   * show, and sized for the stamp it arrives on the hero visibly soft.
   */
  hero?: string;
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
  /**
   * Whether to print the "ITALIA" wordmark and "Monti Lessini" caption over the artwork.
   * The Malaysia set carries its own title inside the image, where that lettering would
   * be both wrong and invisible.
   */
  lettering?: boolean;
  /**
   * `object-position` on the stamp. Most posters are already near the stamp's 496:661, so
   * the default centre crop takes nothing; a square one loses a quarter of its width and
   * needs anchoring away from whatever sits in the corners.
   */
  focus?: string;
  /**
   * `object-position` when the poster is opened out full-screen. A landscape screen crops
   * this portrait artwork the other way — top and bottom rather than the sides, and hard:
   * a 3:4 poster shows about two-fifths of its height. This picks which two-fifths.
   */
  focusWide?: string;

  // ---- the opened page ----------------------------------------------------
  // Everything below is copy and photographs, not structure. Rewrite freely: nothing
  // else in the app reads these, so changing them cannot break a layout.

  /**
   * The body copy on the opened page. Rendered uppercase, so write it however reads best
   * in the file — CSS `text-transform: uppercase` is a no-op on CJK text.
   * `\n\n` splits it into separate paragraphs; the section has no fixed height, so extra
   * paragraphs simply push the gallery and next-stamp teaser further down the page.
   */
  story: string;
  /**
   * Extra photographs for the opened page's gallery, as basenames of `.jpg` files in
   * `public/sites/.../root-8a5edab2/posters/`. The poster artwork is always the first
   * slide, so list only what comes after it — three or four is about right.
   */
  gallery?: readonly string[];
  /**
   * Where the two buttons over the gallery point. Both buttons are always drawn; one
   * without a destination is shown dimmed and inert rather than leading nowhere.
   */
  links?: { ctrip?: string; map?: string };
  /**
   * What fills the panel below the story. Defaults to the photo strip; the map page puts
   * an atlas of the collection's places there instead.
   */
  panel?: "gallery" | "map";
}

/** The collection's blue ground, sampled from the reference sheet. */
export const GROUND_BLUE = "#4C7CAB";

export const POSTERS: readonly Poster[] = [
  {
    slug: "attraction-map",
    story:
      "开启马来西亚双城之旅，感受多元文化的独特魅力。\n\n在槟城，穿梭于乔治市的百年街巷寻找世界遗产的印记，登上升旗山俯瞰全岛美景，或漫步USM理科大学感受静谧的学术氛围。傍晚，在峇都丁宜沙滩欣赏绝美落日，下榻香格里拉沙洋酒店享受热带奢华，再前往槟城奥特莱斯尽情购物。\n\n转场吉隆坡，仰望璀璨夺目的地标双子塔感受现代都市繁华，漫步独立广场触摸这座国家的历史脉搏。自然、人文与现代在此完美交融。",
    image: "attraction-map",
    words: ["Map", "Attraction"],
    place: "Penang & Kuala Lumpur, Malaysia",
    coords: "N 4° 12' 36\" - E 101° 58' 30\"",
    caption: "dust",
    ground: GROUND_BLUE,
    title: "#F9CD6C",
    trail: "#F9CD6C",
    lettering: false,
    // No crop anchor on purpose: this artwork is also the homepage cover, and the two have
    // to frame it identically for the opening flight to land without a jump.
    // The map of the places this page is about, in place of a strip of photographs.
    panel: "map",
  },
  {
    slug: "batu-ferringhi",
    story:
      "这里拥有槟城最迷人的海岸线，以丰富的水上运动和绝美日落闻名。白天你可以尽情体验滑翔伞、香蕉船等刺激项目。\n\n傍晚时分，最适合漫步于柔软的沙滩上欣赏夕阳余晖。夜幕降临后，热闹的露天夜市更是体验当地风情的好去处。",
    image: "batu-ferringhi-v3",
    words: ["Batu", "Ferringhi"],
    place: "Batu Ferringhi, Penang",
    coords: "N 5° 28' 21\" - E 100° 14' 37\"",
    caption: "dust",
    ground: "#DD92AC",
    title: "#F9CD6C",
    trail: "#F9CD6C",
    lettering: false,
    // Low enough to keep the bonfire and the firewalkers, not just the sunset above them.
    focusWide: "center 62%",
    gallery: [
      "batu-ferringhi-gallery-1",
      "batu-ferringhi-gallery-2",
      "batu-ferringhi-gallery-3",
      "batu-ferringhi-gallery-4",
      "batu-ferringhi-gallery-5",
      "batu-ferringhi-gallery-6",
    ],
    links: {
      map: "https://surl.amap.com/hj20QjQqaJ1",
      ctrip:
        "https://m.ctrip.com/webapp/you/gspoi/sight/57609/0.html?poiId=76091&seo=0&isHideNavBar=YES&poiType=3&allianceid=3813947&sharecid=32001158890377458623&sid=21516932&sharecid=32001158890377458623&scene=search&s_guid=8e5a6e4e-65c4-4086-9c98-27f3192468b7",
    },
  },
  {
    slug: "petronas-twin-towers",
    story:
      "作为马来西亚最耀眼的城市地标，这座雄伟的双塔展现了极致的现代建筑美学。无论日夜，其璀璨的身姿都极具震撼力。\n\n你可以尽情在底层的高级购物中心探索，或买票登上天空之桥与观景台，将繁华的吉隆坡迷人市景一览无遗。",
    image: "petronas-twin-towers",
    words: ["Petronas", "Twin Towers"],
    place: "Kuala Lumpur City Centre",
    coords: "N 3° 09' 28\" - E 101° 42' 42\"",
    caption: "dust",
    ground: "#51B37C",
    title: "#F9CD6C",
    trail: "#F9CD6C",
    lettering: false,
    // High enough to keep the spires, which are the whole silhouette.
    focusWide: "center 30%",
    gallery: [
      "petronas-twin-towers-gallery-1",
      "petronas-twin-towers-gallery-2",
      "petronas-twin-towers-gallery-3",
      "petronas-twin-towers-gallery-4",
    ],
    links: {
      map: "https://surl.amap.com/2FdmLE1a5fI",
      ctrip:
        "https://m.ctrip.com/webapp/you/gspoi/sight/45/0.html?poiId=76109&seo=0&isHideNavBar=YES&poiType=3&allianceid=3813947&sharecid=32001158890377458623&sid=21516932&sharecid=32001158890377458623&scene=search&s_guid=fb9b4c5b-3ee5-4525-a7dc-9d4c319cfc6d",
    },
  },
  {
    slug: "putra-square",
    story:
      "这里是马来西亚国家独立的诞生地，承载着这座国家厚重的历史意义，广场上飘扬着高耸的马来西亚国旗。\n\n广场周围环绕着苏丹阿都沙末大厦等众多精美的历史建筑。站在这片绿草如茵的开阔空间，是感受吉隆坡历史沉淀的最佳起点。",
    image: "putra-square",
    words: ["Putra", "Square"],
    place: "Merdeka Square, Kuala Lumpur",
    coords: "N 3° 08' 51\" - E 101° 41' 38\"",
    caption: "dust",
    ground: "#DF6A69",
    title: "#F9CD6C",
    trail: "#F9CD6C",
    lettering: false,
    // The dome and the arcade under it; drop the bare sky and most of the railings.
    focusWide: "center 32%",
    gallery: [
      "putra-square-gallery-1",
      "putra-square-gallery-2",
      "putra-square-gallery-3",
      "putra-square-gallery-4",
      "putra-square-gallery-5",
      "putra-square-gallery-6",
    ],
    links: {
      map: "https://surl.amap.com/F7onM2x4e6",
      ctrip:
        "https://m.ctrip.com/webapp/you/gspoi/sight/45/0.html?poiId=76122&seo=0&isHideNavBar=YES&poiType=3&allianceid=3813947&sharecid=32001158890377458623&sid=21516932&sharecid=32001158890377458623&scene=search&s_guid=87164fef-aa3c-4ca6-a7db-32f817bd8651",
    },
  },
  {
    slug: "george-town",
    story:
      "这是一座被联合国教科文组织认证的世界文化遗产之城，充满了浓郁的南洋风情与复古韵味。\n\n漫步街头，中式宗祠、清真寺与英式建筑和谐共存；穿梭巷弄，寻找生动的街头壁画和地道的槟城美食，你能真切触摸到这里的多元文化脉搏。",
    image: "george-town-v2",
    words: ["George", "Town"],
    place: "George Town, Penang",
    coords: "N 5° 24' 51\" - E 100° 19' 44\"",
    caption: "dust",
    ground: "#DF92B6",
    title: "#F9CD6C",
    trail: "#F9CD6C",
    lettering: false,
    gallery: [
      "george-town-gallery-1",
      "george-town-gallery-2",
      "george-town-gallery-3",
      "george-town-gallery-4",
      "george-town-gallery-5",
      "george-town-gallery-6",
      "george-town-gallery-7",
      "george-town-gallery-8",
    ],
    links: {
      map: "https://surl.amap.com/kjB5Y5g38JZ",
      ctrip:
        "https://m.ctrip.com/webapp/you/gspoi/sight/57611/0.html?poiId=23895639&seo=0&isHideNavBar=YES&poiType=3&allianceid=3813947&sharecid=32001158890377458623&sid=21516932&sharecid=32001158890377458623&scene=sightStore&s_guid=c95d623c-e1c4-4d2d-bc9a-5cedc646ea10",
    },
  },
  {
    slug: "sayang-hotel",
    story:
      "这是一家隐匿于热带雨林与百年雨树之间的奢华五星级度假村。酒店融合了传统建筑风格，并紧邻宁静的峇都丁宜海滩。\n\n在这里，你可以享受顶级的设施与卓越的服务。无论是家庭度假还是浪漫之旅，这里都是一处静谧的海滨天堂。",
    image: "sayang-hotel-v2",
    hero: "sayang-hotel-hero",
    words: ["Sayang", "Hotel"],
    place: "Shangri-La Rasa Sayang, Batu Ferringhi",
    coords: "N 5° 28' 33\" - E 100° 14' 40\"",
    caption: "dust",
    ground: GROUND_BLUE,
    title: "#DD92AC",
    trail: "#F9CD6C",
    lettering: false,
    gallery: [
      "sayang-hotel-gallery-1",
      "sayang-hotel-gallery-2",
      "sayang-hotel-gallery-3",
      "sayang-hotel-gallery-4",
      "sayang-hotel-gallery-5",
    ],
    links: {
      map: "https://surl.amap.com/hpGPOYC1h0U5",
      ctrip:
        "https://m.ctrip.com/webapp/hotels/detail?hotelid=697535&atime=20261003&days=2&rankid=100200148440&shareId=Njk3NTM1fGhvdGVsX292ZXJzZWFfZGV0YWlsfDEyOHwyMDI2MDgyNVQxOTI4MjA=&uid=FE7ED587961132E482E1914E048254743EDA3668A2764ECF2AA75ABE24C343EB&intographicshow=1&sharersid=425&sharerpvid=18039&sharercid=32001158890377458623&sharerdate=20260825",
    },
  },
  {
    slug: "usm-campus",
    story:
      "这是马来西亚顶尖的高等学府，被誉为\"亚洲最美大学\"之一。校园内绿树成荫，建筑风格巧妙融合了现代与传统元素。\n\n漫步其中，你不仅能深切感受浓厚的学术氛围，还能在开阔的绿地中享受远离城市喧嚣的宁静与惬意。",
    image: "usm-campus-v2",
    words: ["USM", "Campus"],
    place: "Universiti Sains Malaysia, Gelugor",
    coords: "N 5° 21' 23\" - E 100° 18' 06\"",
    caption: "dust",
    ground: "#DF6A69",
    title: "#F9CD6C",
    trail: "#F9CD6C",
    lettering: false,
    gallery: [
      "usm-campus-gallery-1",
      "usm-campus-gallery-2",
      "usm-campus-gallery-3",
      "usm-campus-gallery-4",
      "usm-campus-gallery-5",
      "usm-campus-gallery-6",
    ],
    links: {
      map: "https://surl.amap.com/hi0SupEigTC",
      ctrip:
        "https://m.ctrip.com/webapp/you/gspoi/poiDetail/15053195.html?seo=0&ishidenavbar=yes&popup=close&autoawaken=close&s_guid=aaf6d147-8835-4595-87b1-95ca31af46d3",
    },
  },
  {
    slug: "penang-hill",
    story:
      "作为槟城的制高点，这里气候凉爽宜人。乘坐历史悠久的百年缆车穿梭于热带雨林之间，是不可错过的独特体验。\n\n登顶后，你可将乔治市及马六甲海峡的壮丽全景尽收眼底。这里不仅是避暑胜地，更是摄影与自然爱好者的天堂。",
    image: "penang-hill-v2",
    words: ["Penang", "Hill"],
    place: "Bukit Bendera, Penang",
    coords: "N 5° 25' 26\" - E 100° 16' 34\"",
    caption: "dust",
    ground: "#51B37C",
    title: "#DF6A69",
    trail: "#F9CD6C",
    lettering: false,
    gallery: [
      "penang-hill-gallery-1",
      "penang-hill-gallery-2",
      "penang-hill-gallery-3",
      "penang-hill-gallery-4",
      "penang-hill-gallery-5",
      "penang-hill-gallery-6",
    ],
    links: {
      map: "https://surl.amap.com/bRjDHbUe5mR",
      ctrip:
        "https://m.ctrip.com/webapp/you/gspoi/sight/1453378/0.html?poiId=76093&seo=0&isHideNavBar=YES&poiType=3&allianceid=3813947&sharecid=32001158890377458623&sid=21516932&sharecid=32001158890377458623&scene=search&s_guid=b4a2ce57-1597-4b3c-9061-2c6485c6c1a7",
    },
  },
  {
    slug: "penang-outlets",
    story:
      "作为北马最大的名牌折扣购物中心，这里汇聚了众多国际知名品牌和本土精选商铺，全年提供诱人的折扣优惠。\n\n商城采用绿意盎然的开放式空间设计，让你的购物体验如同在热带花园中漫步一般轻松，是休闲和血拼的不二之选。",
    image: "penang-outlets-v2",
    words: ["Outlets", "Penang"],
    place: "Design Village, Batu Kawan",
    coords: "N 5° 16' 21\" - E 100° 26' 07\"",
    caption: "dust",
    ground: "#DF6A69",
    title: "#51B37C",
    trail: "#F9CD6C",
    lettering: false,
    gallery: [
      "penang-outlets-gallery-1",
      "penang-outlets-gallery-2",
      "penang-outlets-gallery-3",
      "penang-outlets-gallery-4",
    ],
    links: {
      map: "https://surl.amap.com/hmOwT9kb8Ha",
      ctrip:
        "https://m.ctrip.com/webapp/you/gsshopping/shops/2/0.html?seo=0&ishidenavbar=yes&poiId=39588787&share=1&bid=12&pid=9&cid=2&s_guid=0673a659-e10a-41dc-87b0-9b73f5e1a131",
    },
  },
  // The one Italian stamp kept from the original collection, as a placeholder.
  {
    slug: "passo-malera",
    story:
      "The stamp we kept from the first collection — green hills, a mountain house, and cows that have never once moved out of the way.",
    image: "PassoMalera",
    words: ["Passo", "Malera"],
    place: "S.Giorgio di Boscochiesanuova",
    coords: "N 45° 41' 10.93\" - E 11° 6' 23.18\"",
    caption: "dust",
    ground: "#51B37C",
    title: "#DF6A69",
    trail: "#F9CD6C",
  },
] as const;

export const POSTER_BASE = "/sites/francobollimontilessini-d2eadb58/root-8a5edab2/posters";

/** Resolves one `.jpg` basename in the posters folder. */
export const posterImage = (basename: string) => assetPath(`${POSTER_BASE}/${basename}.jpg`);

export const posterSrc = (poster: Poster) => posterImage(poster.image);

/**
 * The artwork for the opened page's full-bleed hero — the high-resolution copy where one
 * has been supplied, and the stamp's own file where it has not.
 */
export const posterHero = (poster: Poster) => posterImage(poster.hero ?? poster.image);

/** Every slide on a poster's opened page: its own artwork, then any extra photographs. */
export const galleryFor = (poster: Poster) => [poster.image, ...(poster.gallery ?? [])];

/** The stamp the "Scopri" button leads to — the collection wraps around. */
export const nextPoster = (poster: Poster) => {
  const i = POSTERS.findIndex((p) => p.slug === poster.slug);
  return POSTERS[(i + 1) % POSTERS.length];
};

/**
 * The stamp the homepage cover is showing, and lands on.
 *
 * The cover and that stamp deliberately share one file and one crop. They used to be two
 * near-identical photographs, and the swap at the end of the opening flight — different
 * file, different `object-position` — showed up as a jolt exactly when the two were
 * supposed to become the same thing.
 */
export const COVER_POSTER = POSTERS[0];
export const COVER_SRC = posterSrc(COVER_POSTER);
