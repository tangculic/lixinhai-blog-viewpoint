/**
 * The Penang trip, as data.
 *
 * Every coordinate here was read out of the Amap share link listed beside it — the `p=`
 * parameter of the page `surl.amap.com/…` redirects to carries `POIID,lat,lng,name,address`
 * — so a pin lands on Amap's own idea of the place rather than on an eyeballed guess.
 *
 * These are plain WGS-84. Amap serves GCJ-02 inside China, which would throw every pin
 * ~130m off, but that shift stops at the border: checked against Petronas (Amap
 * 3.157987/101.711832 vs the surveyed 3.15785/101.71167, ~20m apart) the offset simply is
 * not being applied over Malaysia. Carto, which draws the tiles, is WGS-84 throughout.
 */
export interface Stop {
  id: string;
  /** The label on the pin, and on the jump button under the map. */
  name: string;
  lat: number;
  lng: number;
  /**
   * Where tapping the place goes. A stop that has a stamp in this collection opens that
   * stamp's page; everything else opens its Amap listing.
   */
  slug?: string;
  amap?: string;
  /**
   * Which way the name hangs off the dot. Defaults to `up`.
   *
   * Set wherever two stops sit close enough that their names would print over each other —
   * Beryl's and the Blue Mansion are 100m apart, the USM gift shop and the ZUS counter are
   * 53m apart, which on a phone is fifteen pixels. Pushing the two names to opposite sides
   * of their dots separates them without moving either pin off its coordinate.
   */
  labelSide?: "up" | "down" | "left" | "right";
}

/** One hop between two consecutive stops on a route. */
export interface Leg {
  /** "19km" for the driving days, "706m" for the walks. */
  distance: string;
  /** "37分钟", "1小时". */
  duration: string;
  mode: "car" | "walk";
  /**
   * How far along the leg its label sits, 0-1. Only set where a day doubles back over a
   * road it already used — two labels at the same midpoint would print over each other.
   */
  at?: number;
}

export interface Route {
  id: string;
  /** Shown in the legend; several routes may share one (10.6 has two possible endings). */
  label: string;
  color: string;
  /** Drawn as a dashed line — used for the day that is not settled yet. */
  dashed?: boolean;
  /** Stop ids in travel order. A stop may repeat: day 5 returns to the guest house twice. */
  stops: readonly string[];
  /** One entry per gap between consecutive stops, or omitted where none were measured. */
  legs?: readonly Leg[];
}

// ---------------------------------------------------------------------------
// The island: the seven places the four days move between.
// ---------------------------------------------------------------------------

export const PENANG_STOPS: readonly Stop[] = [
  {
    id: "airport",
    name: "槟城机场",
    lat: 5.295734,
    lng: 100.274636,
    amap: "https://surl.amap.com/1sQBc9Qc11P",
  },
  {
    id: "homestay",
    name: "乔治市民宿",
    lat: 5.42173,
    lng: 100.329064,
    amap: "https://surl.amap.com/1kx1i6mX5S0",
    labelSide: "right",
  },
  {
    id: "usm",
    name: "USM 理科大学",
    lat: 5.355594,
    lng: 100.302545,
    slug: "usm-campus",
  },
  {
    id: "queensbay",
    name: "皇后湾广场",
    lat: 5.333133,
    lng: 100.306978,
    amap: "https://surl.amap.com/1mNI8Xw1zeix",
    labelSide: "down",
  },
  {
    id: "penang-hill",
    name: "升旗山",
    lat: 5.408519,
    lng: 100.277174,
    slug: "penang-hill",
  },
  {
    id: "gurney",
    name: "Gurney Plaza",
    lat: 5.438042,
    lng: 100.310023,
    amap: "https://surl.amap.com/1p7oCF4naTk",
    labelSide: "left",
  },
  {
    id: "golden-sands",
    // Not the same property as the `sayang-hotel` stamp, which is Rasa Sayang next door —
    // so this one points at its own Amap listing rather than at that page.
    name: "香格里拉金沙酒店",
    lat: 5.476304,
    lng: 100.251153,
    amap: "https://surl.amap.com/1kNTfdwm5s1",
  },
] as const;

/** The collection's own palette, one tone per day, so the lines read as a legend. */
export const DAY_COLORS = {
  d3: "#F9CD6C",
  d4: "#51B37C",
  d5: "#DF6A69",
  d6: "#8FC7E8",
} as const;

export const DAY3_ROUTE: Route = {
  id: "d3",
  label: "10.3",
  color: DAY_COLORS.d3,
  stops: ["airport", "homestay"],
  // Pushed off the midpoint, which falls within a few hundred metres of the USM pin and
  // printed straight over its name.
  legs: [{ distance: "19km", duration: "37分钟", mode: "car", at: 0.85 }],
};

export const DAY4_ROUTE: Route = {
  id: "d4",
  label: "10.4",
  color: DAY_COLORS.d4,
  stops: ["homestay", "usm", "queensbay", "homestay"],
  legs: [
    { distance: "10km", duration: "21分钟", mode: "car" },
    { distance: "4.4km", duration: "10分钟", mode: "car" },
    { distance: "15km", duration: "31分钟", mode: "car" },
  ],
};

export const DAY5_ROUTE: Route = {
  id: "d5",
  label: "10.5",
  color: DAY_COLORS.d5,
  stops: ["homestay", "penang-hill", "homestay", "gurney", "golden-sands"],
  legs: [
    // Out and back over one road. Both sit a quarter of the way along — which is a
    // quarter from opposite ends, since the second leg runs the other way — so one label
    // ends up near the guest house and the other near the hill. Reading them as 0.34 and
    // 0.68 of the *same* line put them within thirty metres of each other.
    { distance: "6.7km", duration: "20分钟", mode: "car", at: 0.25 },
    { distance: "6.7km", duration: "20分钟", mode: "car", at: 0.25 },
    { distance: "3.5km", duration: "9分钟", mode: "car" },
    { distance: "11km", duration: "24分钟", mode: "car" },
  ],
};

/** The last morning has two possible endings, so it is two routes rather than one. */
export const DAY6_ROUTES: readonly Route[] = [
  {
    id: "d6-airport",
    label: "10.6",
    color: DAY_COLORS.d6,
    dashed: true,
    stops: ["golden-sands", "airport"],
    legs: [{ distance: "31km", duration: "1小时", mode: "car" }],
  },
  {
    id: "d6-queensbay",
    label: "10.6",
    color: DAY_COLORS.d6,
    dashed: true,
    stops: ["golden-sands", "queensbay"],
    // The midpoint of this one lands almost exactly on Penang Hill.
    legs: [{ distance: "26km", duration: "50分钟", mode: "car", at: 0.72 }],
  },
];

export const PENANG_ROUTES: readonly Route[] = [
  DAY3_ROUTE,
  DAY4_ROUTE,
  DAY5_ROUTE,
  ...DAY6_ROUTES,
];

// ---------------------------------------------------------------------------
// The two walks, each its own small map.
// ---------------------------------------------------------------------------

export const USM_STOPS: readonly Stop[] = [
  {
    id: "usm-gate",
    name: "西门 K19&18",
    lat: 5.353051,
    lng: 100.297038,
    amap: "https://surl.amap.com/1lNVHXYmgKB",
  },
  {
    id: "usm-park",
    name: "公园 Tasik Aman",
    lat: 5.354456,
    lng: 100.29832,
    amap: "https://surl.amap.com/1lLRM7M13e3K",
    labelSide: "down",
  },
  {
    id: "usm-library",
    name: "图书馆",
    lat: 5.357412,
    lng: 100.303169,
    amap: "https://surl.amap.com/1m5t27oS5ea",
  },
  {
    id: "usm-shop",
    name: "纪念品店",
    lat: 5.35606,
    lng: 100.302917,
    amap: "https://surl.amap.com/1mfsYDUA86a",
    labelSide: "down",
  },
  {
    id: "usm-zus",
    name: "ZUS 咖啡店",
    lat: 5.356538,
    lng: 100.30295,
    amap: "https://surl.amap.com/1md8lqa1bbn5",
  },
  {
    id: "usm-nasi",
    name: "印尼餐厅（印度飞饼）",
    lat: 5.356721,
    lng: 100.304264,
    amap: "https://surl.amap.com/1miAEY27geJ",
    labelSide: "right",
  },
  {
    id: "usm-cafe",
    name: "咖啡厅（足球场）",
    lat: 5.36211,
    lng: 100.306941,
    amap: "https://surl.amap.com/1mttjN8I7yV",
  },
] as const;

export const USM_ROUTE: Route = {
  id: "usm-walk",
  label: "USM 游览 2h",
  color: DAY_COLORS.d4,
  stops: USM_STOPS.map((s) => s.id),
};

export const GEORGE_TOWN_STOPS: readonly Stop[] = [
  {
    id: "homestay",
    name: "乔治市民宿",
    lat: 5.42173,
    lng: 100.329064,
    amap: "https://surl.amap.com/1kx1i6mX5S0",
    labelSide: "right",
  },
  {
    id: "gt-beryls",
    name: "Beryl's 巧克力店",
    lat: 5.42082,
    lng: 100.33417,
    amap: "https://surl.amap.com/1mXuxdgocdZ",
    labelSide: "down",
  },
  {
    id: "gt-blue",
    name: "蓝屋",
    lat: 5.42145,
    lng: 100.334893,
    amap: "https://surl.amap.com/1n7u8VsS20M",
  },
  {
    id: "gt-love",
    name: "爱情巷",
    lat: 5.419758,
    lng: 100.337095,
    amap: "https://surl.amap.com/1n1uIPw33Fa",
    labelSide: "down",
  },
  {
    id: "gt-stgeorge",
    name: "圣乔治教堂",
    lat: 5.419765,
    lng: 100.339143,
    amap: "https://surl.amap.com/1nbRK9I5dDz",
  },
  {
    id: "gt-townhall",
    name: "市政厅",
    lat: 5.421178,
    lng: 100.341156,
    amap: "https://surl.amap.com/1nmWJOa1r5Yz",
  },
  {
    id: "gt-fort",
    name: "康华丽斯堡",
    lat: 5.420414,
    lng: 100.344548,
    amap: "https://surl.amap.com/1nrfISuR9FZ",
  },
  {
    id: "gt-clock",
    name: "旧关仔角钟楼",
    lat: 5.419369,
    lng: 100.344262,
    amap: "https://surl.amap.com/1noQBiG1edeZ",
    labelSide: "down",
  },
  {
    id: "gt-peranakan",
    name: "侨生博物馆",
    lat: 5.417826,
    lng: 100.341205,
    amap: "https://surl.amap.com/1nz8XREB7yM",
    labelSide: "left",
  },
  {
    id: "gt-streetart",
    name: "壁画街",
    lat: 5.414596,
    lng: 100.338255,
    amap: "https://surl.amap.com/1nKL6Fs1s4id",
    labelSide: "left",
  },
  {
    id: "gt-littleindia",
    name: "小印度",
    lat: 5.416291,
    lng: 100.340407,
    amap: "https://surl.amap.com/1nRaKFQ5cLQ",
    labelSide: "right",
  },
  {
    id: "gt-durian",
    // Amap has no listing for the durian hall itself; this is the anchor next door.
    name: "榴莲天下",
    lat: 5.413737,
    lng: 100.337546,
    amap: "https://surl.amap.com/1oJ2LQ6vb8n",
    labelSide: "down",
  },
  {
    id: "gt-jetty",
    name: "姓氏桥",
    lat: 5.412778,
    lng: 100.33985,
    amap: "https://surl.amap.com/1oBoyaS1idna",
    labelSide: "right",
  },
] as const;

export const GEORGE_TOWN_ROUTE: Route = {
  id: "gt-walk",
  label: "乔治市游览 4h",
  color: DAY_COLORS.d5,
  stops: GEORGE_TOWN_STOPS.map((s) => s.id),
  legs: [
    { distance: "706m", duration: "9分钟", mode: "walk" },
    { distance: "100m", duration: "2分钟", mode: "walk" },
    { distance: "700m", duration: "9分钟", mode: "walk" },
    { distance: "600m", duration: "6分钟", mode: "walk" },
    { distance: "900m", duration: "10分钟", mode: "walk" },
    { distance: "400m", duration: "4分钟", mode: "walk" },
    { distance: "100m", duration: "1分钟", mode: "walk" },
    { distance: "650m", duration: "7分钟", mode: "walk" },
    { distance: "250m", duration: "3分钟", mode: "walk" },
    { distance: "450m", duration: "5分钟", mode: "walk" },
    { distance: "300m", duration: "3分钟", mode: "walk" },
    { distance: "900m", duration: "10分钟", mode: "walk" },
  ],
};

// ---------------------------------------------------------------------------
// The written itinerary, day by day.
// ---------------------------------------------------------------------------

export interface Day {
  id: string;
  /** "26年10月3日" */
  date: string;
  /** The one-line summary under the date. */
  summary: string;
  color: string;
  lines: readonly string[];
  /** The route drawn above the text, where the day has a map of its own. */
  route?: Route;
}

export const DAYS: readonly Day[] = [
  {
    id: "day3",
    date: "26年10月3日",
    summary: "落地槟城 · 入住乔治市",
    color: DAY_COLORS.d3,
    lines: [
      "晚上 6:30　到槟城机场",
      "晚上 7:00　打车前往民宿，7:30 到达",
      "晚上 8:00　出发：吃晚饭 + 酒吧 / 步行市政厅",
    ],
  },
  {
    id: "day4",
    date: "26年10月4日",
    summary: "USM 理科大学 · 皇后湾 · 乔治市老城",
    color: DAY_COLORS.d4,
    route: DAY4_ROUTE,
    lines: [
      "早上 8:00　从民宿出发，8:30 到达 USM（马来西亚理科大学）",
      "早上 8:30　USM 游览 · 游览时间 2h",
      "路线：西门 K19&18 → 公园 → 图书馆 → 纪念品店 → ZUS 咖啡店 → 印尼餐厅（印度飞饼）→ 咖啡厅（足球场）",
      "早上 11:00　前往皇后湾广场吃午饭",
      "下午 1:30　打车返回乔治市民宿，约 2:00 到达",
      "下午 3:00　乔治市游览 · 游览时间 4h",
      "路线：民宿 → Beryl's 巧克力店 → 蓝屋 → 爱情巷 → 圣乔治教堂 → 市政厅 → 康华丽斯堡 → 旧关仔角钟楼 → 侨生博物馆 → 壁画街 → 小印度 → 榴莲天下 → 姓氏桥",
      "晚上 7:00　周边吃饭 + 闲逛",
    ],
  },
  {
    id: "day5",
    date: "26年10月5日",
    summary: "升旗山日出 · Gurney · 峇都丁宜沙滩",
    color: DAY_COLORS.d5,
    route: DAY5_ROUTE,
    lines: [
      "早上 6:00　打车到升旗山看日出，坐缆车前往山顶",
      "早上 7:00 - 中午 11:00　升旗山游览 4h",
      "中午 11:00　回酒店收拾行李 + 退房",
      "中午 12:00　前往 Gurney Plaza 吃饭（槟城最大商圈，去沙滩顺路）",
      "下午 2:00　前往峇都丁宜沙滩",
      "下午 3:00　入住香格里拉金沙酒店",
      "下午 3:00 - 5:00　香格里拉沙洋公区游览",
      "下午 5:00 - 9:00　峇都丁宜沙滩吃饭 + 看海 + 打铁花 + 回程 + 周边小店游览",
    ],
  },
  {
    id: "day6",
    date: "26年10月6日",
    summary: "下一站待定",
    color: DAY_COLORS.d6,
    lines: [
      "吉隆坡 or 仙本那 or 兰卡威，待定",
      "吉隆坡：大巴早上 6:30 或 下午 4:30 出发；飞机随时飞",
      "兰卡威：飞机直飞",
      "仙本那：飞机飞临近机场，下机后火车或打车到仙本那",
    ],
  },
] as const;

/** The practical notes that close the page. */
export const TRAVEL_NOTES: readonly string[] = [
  "入境须填写入境卡，提前 3 天填写并打印好进行登记。",
  "旅行基本支付宝可支付，随身携带 300 马币现金即可，到槟城机场进行换汇。",
  "手机流量入境前开通漫游即可。",
  "出行及外卖下载 Grab 软件、绑定支付宝付款即可。",
  "马来西亚紫外线极强，温度常年 30° 以上，需全套防晒：防晒衣、防晒帽、防晒霜。",
  "马来西亚插座和国内不一致，需准备插头转接口（英标）。",
  "这边水质较差，可以准备过滤花洒、过滤水龙头，随身携带水杯。",
  "关于服装：T 恤即可，带一件薄外套 —— 天气常年 30° 但室内空调开很低；整体伊斯兰教，偏保守，尽可能不要穿太裸露。",
  "榴莲不可带进酒店。",
  "提前购买旅游险。",
] as const;
