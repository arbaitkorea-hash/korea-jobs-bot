import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient, type Locale, type Technique } from "@prisma/client";
import bcrypt from "bcryptjs";
import { colorFamilyOf } from "../src/lib/color";
import sharp from "sharp";

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
const LOCALES: Locale[] = ["RU", "EN", "KO"];

/**
 * Локальные градиентные плейсхолдеры вместо внешнего сервиса — сид работает
 * офлайн и не зависит от доступности стороннего домена. В реальной админке
 * эти изображения заменяются настоящими фотографиями работ.
 */
async function makePlaceholder(color: string, width: number, height: number) {
  // Абстрактная заливка без подписи: текст, впечатанный в картинку, накладывался
  // бы на заголовок в hero-блоке и мешал оценить настоящую вёрстку.
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.45"/>
          <stop offset="55%" stop-color="${color}" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="1"/>
        </linearGradient>
        <radialGradient id="glow" cx="30%" cy="28%" r="55%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)" />
      <rect width="100%" height="100%" fill="url(#glow)" />
    </svg>`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const id = randomUUID();

  const full = await sharp(Buffer.from(svg)).webp({ quality: 85 }).toBuffer();
  const thumb = await sharp(Buffer.from(svg)).resize({ width: 400 }).webp({ quality: 80 }).toBuffer();

  await writeFile(path.join(UPLOAD_DIR, `${id}-full.webp`), full);
  await writeFile(path.join(UPLOAD_DIR, `${id}-thumb.webp`), thumb);

  return { url: `/api/media/${id}-full.webp`, width, height };
}

type Tr = {
  slug: string;
  title: string;
  description: string;
  story: string;
  altText: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  hashtags: string;
};

const collections = [
  {
    key: "seaside",
    position: 1,
    color: "#8B96A5",
    tr: {
      RU: {
        slug: "svet-poberezhya",
        title: "Свет побережья",
        description: "Морские пейзажи и свет южного побережья Кореи.",
        seoTitle: "Свет побережья — коллекция морских пейзажей | JST ART",
        seoDescription:
          "Коллекция морских пейзажей маслом художника Jung Sen Tek. Оригиналы и принты с доставкой.",
        keywords: "морской пейзаж, картины моря, побережье, картина маслом",
        hashtags: "морскойпейзаж, живопись, маслонахолсте",
      },
      EN: {
        slug: "seaside-light",
        title: "Seaside Light",
        description: "Seascapes and the light of Korea's southern coast.",
        seoTitle: "Seaside Light — Seascape Collection | JST ART",
        seoDescription:
          "A collection of original oil seascapes by Jung Sen Tek. Originals and fine-art prints, worldwide shipping.",
        keywords: "seascape painting, ocean art, coastal painting, oil on canvas",
        hashtags: "seascape, oilpainting, coastalart",
      },
      KO: {
        slug: "haeanui-bit",
        title: "해안의 빛",
        description: "한국 남해안의 바다 풍경과 빛.",
        seoTitle: "해안의 빛 — 바다 풍경 컬렉션 | JST ART",
        seoDescription: "정성택 작가의 유화 바다 풍경 컬렉션. 원화와 아트 프린트, 전 세계 배송.",
        keywords: "바다 그림, 풍경화, 유화 작품, 해안 풍경",
        hashtags: "바다그림, 유화, 풍경화",
      },
    },
  },
  {
    key: "quiet",
    position: 2,
    color: "#6E5B4B",
    tr: {
      RU: {
        slug: "tihie-veshchi",
        title: "Тихие вещи",
        description: "Натюрморты и камерные композиции.",
        seoTitle: "Тихие вещи — коллекция натюрмортов | JST ART",
        seoDescription:
          "Коллекция натюрмортов художника Jung Sen Tek. Оригиналы маслом и акрилом.",
        keywords: "натюрморт, картина маслом, интерьерная картина",
        hashtags: "натюрморт, живопись, интерьер",
      },
      EN: {
        slug: "quiet-things",
        title: "Quiet Things",
        description: "Still lifes and intimate compositions.",
        seoTitle: "Quiet Things — Still Life Collection | JST ART",
        seoDescription:
          "A collection of still life paintings by Jung Sen Tek in oil and acrylic.",
        keywords: "still life painting, interior art, oil painting",
        hashtags: "stilllife, oilpainting, interiorart",
      },
      KO: {
        slug: "goyohan-satmul",
        title: "고요한 사물",
        description: "정물화와 소품 작업.",
        seoTitle: "고요한 사물 — 정물화 컬렉션 | JST ART",
        seoDescription: "정성택 작가의 유화·아크릴 정물화 컬렉션.",
        keywords: "정물화, 유화 작품, 인테리어 그림",
        hashtags: "정물화, 유화, 인테리어그림",
      },
    },
  },
] as const;

const artworks: {
  collectionKey: string;
  technique: Technique;
  widthCm: number;
  heightCm: number;
  priceOriginalCents: number;
  pricePrintCents: number;
  color: string;
  tr: Record<Locale, Tr>;
}[] = [
  {
    collectionKey: "seaside",
    technique: "OIL",
    widthCm: 80,
    heightCm: 60,
    priceOriginalCents: 850_000_00,
    pricePrintCents: 45_000_00,
    color: "#B5652F",
    tr: {
      RU: {
        slug: "zakat-nad-ozerom",
        title: "Закат над озером",
        description: "Небо на пятнадцать минут стало цвета охры — и снова погасло.",
        story:
          "Написана на Чеджу в конце сентября. Я приходил на этот берег четыре вечера подряд, и только на четвёртый небо сделало то, ради чего стоило ждать: свет упал горизонтально, и вода стала плотной, как металл.",
        altText: "Картина маслом «Закат над озером» — оранжевое небо над спокойной водой",
        seoTitle: "Закат над озером — картина маслом | JST ART",
        seoDescription:
          "Оригинальная картина маслом «Закат над озером», 80×60 см. Купить оригинал или принт с доставкой.",
        keywords: "картина маслом купить, закат картина, пейзаж маслом, оригинал картины",
        hashtags: "закат, живописьмаслом, пейзаж",
      },
      EN: {
        slug: "sunset-over-the-lake",
        title: "Sunset Over the Lake",
        description: "For fifteen minutes the sky turned the colour of ochre — then went out.",
        story:
          "Painted on Jeju at the end of September. I came to this shore four evenings in a row, and only on the fourth did the sky do what was worth waiting for: the light fell horizontally and the water turned dense, like metal.",
        altText: "Oil painting 'Sunset Over the Lake' — orange sky above still water",
        seoTitle: "Sunset Over the Lake — Original Oil Painting | JST ART",
        seoDescription:
          "Original oil painting 'Sunset Over the Lake', 80×60 cm. Buy the original or a fine-art print with worldwide shipping.",
        keywords: "oil paintings for sale online, sunset painting, landscape oil painting",
        hashtags: "sunsetpainting, oilpainting, landscapeart",
      },
      KO: {
        slug: "hosu-wiui-noeul",
        title: "호수 위의 노을",
        description: "십오 분 동안 하늘은 황토색이 되었다가 다시 꺼졌습니다.",
        story:
          "9월 말 제주에서 그린 작품입니다. 나흘 연속 이 해변을 찾았고, 넷째 날에야 하늘이 기다릴 만한 모습을 보여주었습니다. 빛이 수평으로 내려앉자 물은 금속처럼 단단해졌습니다.",
        altText: "유화 작품 '호수 위의 노을' — 잔잔한 물 위의 주황빛 하늘",
        seoTitle: "호수 위의 노을 — 유화 원화 | JST ART",
        seoDescription: "유화 원화 '호수 위의 노을', 80×60cm. 원화 및 아트 프린트 구매 가능.",
        keywords: "유화 그림 구매, 노을 그림, 풍경화 원화, 그림 판매",
        hashtags: "노을그림, 유화, 풍경화",
      },
    },
  },
  {
    collectionKey: "seaside",
    technique: "OIL",
    widthCm: 100,
    heightCm: 70,
    priceOriginalCents: 1_200_000_00,
    pricePrintCents: 55_000_00,
    color: "#8B96A5",
    tr: {
      RU: {
        slug: "utrenniy-tuman",
        title: "Утренний туман",
        description: "Побережье Пусана до того, как просыпается город.",
        story:
          "Туман здесь держится не больше часа. Он не белый — он серо-голубой, и в нём тонут все контуры, кроме самых близких. Эту работу я писал по памяти, потому что на месте было слишком холодно, чтобы держать кисть.",
        altText: "Картина маслом «Утренний туман» — серо-голубое побережье в дымке",
        seoTitle: "Утренний туман — картина маслом | JST ART",
        seoDescription:
          "Оригинальная картина маслом «Утренний туман», 100×70 см. Морской пейзаж, купить оригинал или принт.",
        keywords: "морской пейзаж купить, картина туман, живопись маслом, пейзаж на холсте",
        hashtags: "туман, морскойпейзаж, живопись",
      },
      EN: {
        slug: "morning-fog",
        title: "Morning Fog",
        description: "The Busan coastline before the city wakes.",
        story:
          "The fog here lasts no more than an hour. It is not white — it is grey-blue, and every contour drowns in it except the nearest. I painted this from memory, because on site it was too cold to hold a brush.",
        altText: "Oil painting 'Morning Fog' — grey-blue coastline in haze",
        seoTitle: "Morning Fog — Original Oil Painting | JST ART",
        seoDescription:
          "Original oil painting 'Morning Fog', 100×70 cm. Coastal seascape, original and prints available.",
        keywords: "seascape for sale, fog painting, coastal oil painting, original artwork",
        hashtags: "fogpainting, seascape, oilpainting",
      },
      KO: {
        slug: "achim-angae",
        title: "아침 안개",
        description: "도시가 깨어나기 전 부산의 해안선.",
        story:
          "이곳의 안개는 한 시간을 넘기지 않습니다. 흰색이 아니라 회청색이며, 가장 가까운 윤곽을 제외한 모든 것이 그 안에 잠깁니다. 현장에서는 붓을 들기에 너무 추워서 기억을 따라 그렸습니다.",
        altText: "유화 작품 '아침 안개' — 안개에 잠긴 회청색 해안",
        seoTitle: "아침 안개 — 유화 원화 | JST ART",
        seoDescription: "유화 원화 '아침 안개', 100×70cm. 해안 풍경화, 원화 및 프린트 구매 가능.",
        keywords: "바다 그림 구매, 안개 그림, 해안 풍경화, 원화 판매",
        hashtags: "안개, 바다그림, 유화",
      },
    },
  },
  {
    collectionKey: "quiet",
    technique: "ACRYLIC",
    widthCm: 50,
    heightCm: 40,
    priceOriginalCents: 420_000_00,
    pricePrintCents: 32_000_00,
    color: "#6E5B4B",
    tr: {
      RU: {
        slug: "tihiy-stol",
        title: "Тихий стол",
        description: "Натюрморт зимнего утра в мастерской.",
        story:
          "Всё, что на этом столе, стояло там уже неделю. Я не переставлял предметы — просто ждал, пока свет из окна найдёт для них правильный угол. Акрил, потому что нужна была матовая, чуть пыльная поверхность.",
        altText: "Картина акрилом «Тихий стол» — натюрморт в тёплых коричневых тонах",
        seoTitle: "Тихий стол — картина акрилом | JST ART",
        seoDescription:
          "Оригинальная картина акрилом «Тихий стол», 50×40 см. Натюрморт для интерьера, оригинал и принты.",
        keywords: "натюрморт купить, картина акрилом, интерьерная живопись",
        hashtags: "натюрморт, акрил, интерьернаякартина",
      },
      EN: {
        slug: "quiet-table",
        title: "Quiet Table",
        description: "A still life from a winter morning in the studio.",
        story:
          "Everything on this table had been standing there for a week. I did not rearrange the objects — I simply waited for the window light to find the right angle for them. Acrylic, because I needed a matte, slightly dusty surface.",
        altText: "Acrylic painting 'Quiet Table' — still life in warm brown tones",
        seoTitle: "Quiet Table — Original Acrylic Painting | JST ART",
        seoDescription:
          "Original acrylic painting 'Quiet Table', 50×40 cm. Still life for interiors, original and prints available.",
        keywords: "still life for sale, acrylic painting, interior artwork",
        hashtags: "stilllife, acrylicpainting, interiorart",
      },
      KO: {
        slug: "goyohan-teibeul",
        title: "고요한 테이블",
        description: "작업실의 겨울 아침 정물.",
        story:
          "이 테이블 위의 모든 것은 일주일째 그 자리에 있었습니다. 사물을 다시 배치하지 않고, 창으로 들어오는 빛이 알맞은 각도를 찾을 때까지 기다렸습니다. 무광의 약간 먼지 낀 표면이 필요해 아크릴을 썼습니다.",
        altText: "아크릴 작품 '고요한 테이블' — 따뜻한 갈색 톤의 정물화",
        seoTitle: "고요한 테이블 — 아크릴 원화 | JST ART",
        seoDescription: "아크릴 원화 '고요한 테이블', 50×40cm. 인테리어 정물화, 원화 및 프린트.",
        keywords: "정물화 구매, 아크릴 그림, 인테리어 그림",
        hashtags: "정물화, 아크릴, 인테리어그림",
      },
    },
  },
  {
    collectionKey: "quiet",
    technique: "OIL",
    widthCm: 60,
    heightCm: 60,
    priceOriginalCents: 690_000_00,
    pricePrintCents: 38_000_00,
    color: "#A8A294",
    tr: {
      RU: {
        slug: "zimnee-okno",
        title: "Зимнее окно",
        description: "Вид из мастерской в первый снег.",
        story:
          "Первый снег в этих широтах идёт редко и тает за час. Я успел сделать только подмалёвок с натуры — остальное дописывал три недели, пытаясь не потерять то ощущение, что стекло чуть теплее воздуха за ним.",
        altText: "Картина маслом «Зимнее окно» — светлый квадратный холст, вид из окна в снегопад",
        seoTitle: "Зимнее окно — картина маслом | JST ART",
        seoDescription:
          "Оригинальная картина маслом «Зимнее окно», 60×60 см. Квадратный холст, оригинал и принты.",
        keywords: "картина зима, квадратная картина, картина маслом купить",
        hashtags: "зима, живописьмаслом, квадратныйхолст",
      },
      EN: {
        slug: "winter-window",
        title: "Winter Window",
        description: "The view from the studio during the first snow.",
        story:
          "First snow is rare at this latitude and melts within an hour. I only managed an underpainting from life — the rest took three weeks, trying not to lose the sense that the glass was slightly warmer than the air behind it.",
        altText:
          "Oil painting 'Winter Window' — pale square canvas, a view through a window during snowfall",
        seoTitle: "Winter Window — Original Oil Painting | JST ART",
        seoDescription:
          "Original oil painting 'Winter Window', 60×60 cm. Square canvas, original and fine-art prints.",
        keywords: "winter painting, square canvas art, buy original oil painting",
        hashtags: "winterpainting, oilpainting, squarecanvas",
      },
      KO: {
        slug: "gyeoul-changmun",
        title: "겨울 창",
        description: "첫눈이 내리던 날 작업실에서 본 풍경.",
        story:
          "이 위도에서 첫눈은 드물고 한 시간이면 녹습니다. 현장에서는 밑그림만 겨우 마쳤고, 나머지는 삼 주가 걸렸습니다. 유리가 그 너머 공기보다 조금 더 따뜻하다는 감각을 잃지 않으려 애썼습니다.",
        altText: "유화 작품 '겨울 창' — 눈 내리는 창밖 풍경을 담은 밝은 정사각 캔버스",
        seoTitle: "겨울 창 — 유화 원화 | JST ART",
        seoDescription: "유화 원화 '겨울 창', 60×60cm. 정사각 캔버스, 원화 및 아트 프린트.",
        keywords: "겨울 그림, 정사각 그림, 유화 원화 구매",
        hashtags: "겨울그림, 유화, 정사각캔버스",
      },
    },
  },
];

const exhibitions = [
  {
    color: "#8C6A4A",
    startDate: "2025-09-12",
    endDate: "2025-10-05",
    pressUrl: "",
    tr: {
      RU: {
        title: "Персональная выставка «Свет на воде»",
        location: "Галерея Insa, Сеул",
        description:
          "Двадцать четыре работы маслом, написанные на побережье Канвондо за два года. Центральная тема — как один и тот же берег меняется от рассвета к закату.",
      },
      EN: {
        title: "Solo exhibition “Light on Water”",
        location: "Insa Gallery, Seoul",
        description:
          "Twenty-four oil paintings made along the Gangwon coast over two years, following one shoreline from dawn to dusk.",
      },
      KO: {
        title: "개인전 «물 위의 빛»",
        location: "인사갤러리, 서울",
        description:
          "2년간 강원도 해안에서 그린 유화 24점. 같은 해안이 새벽부터 해질녘까지 어떻게 변하는지를 담았습니다.",
      },
    },
  },
  {
    color: "#4A6B5C",
    startDate: "2024-05-18",
    endDate: "2024-06-09",
    pressUrl: "",
    tr: {
      RU: {
        title: "Групповая выставка «Пейзаж без границ»",
        location: "Культурный центр Мапхо, Сеул",
        description:
          "Совместный проект восьми художников из Кореи, России и Японии о том, как национальная школа живописи меняет взгляд на одну и ту же природу.",
      },
      EN: {
        title: "Group show “Landscape Without Borders”",
        location: "Mapo Art Center, Seoul",
        description:
          "Eight painters from Korea, Russia and Japan on how a national school of painting reshapes the same nature.",
      },
      KO: {
        title: "단체전 «경계 없는 풍경»",
        location: "마포아트센터, 서울",
        description:
          "한국·러시아·일본 작가 8인이 같은 자연을 각자의 회화 전통으로 바라본 공동 프로젝트입니다.",
      },
    },
  },
];

const blogPost = {
  color: "#3E5C6B",
  tr: {
    RU: {
      slug: "kak-ya-pishu-more",
      title: "Как я пишу море",
      excerpt: "О технике многослойного письма маслом и поиске света на воде.",
      contentHtml:
        "<p>Вода не бывает синей. Она принимает цвет неба, дна и того, что стоит на берегу — и меняет его быстрее, чем успеваешь смешать краску.</p><h2>Почему слоями</h2><p>Я работаю лессировками: каждый следующий слой прозрачный и накладывается только после того, как предыдущий полностью высох. Так цвет не смешивается механически, а складывается оптически — свет проходит сквозь верхние слои, отражается от нижних и возвращается уже другим.</p><p>Это медленно. Одна работа занимает от трёх недель до двух месяцев. Но добиться ощущения светящейся изнутри воды иначе я не умею.</p>",
      seoTitle: "Как я пишу море — техника многослойной живописи | JST ART",
      seoDescription:
        "Художник Jung Sen Tek о технике лессировок, работе слоями и поиске света на воде.",
      keywords: "техника живописи маслом, лессировка, как рисовать море",
      hashtags: "техникаживописи, маслонахолсте, лессировка",
    },
    EN: {
      slug: "how-i-paint-the-sea",
      title: "How I Paint the Sea",
      excerpt: "On layered oil technique and the search for light on water.",
      contentHtml:
        "<p>Water is never blue. It takes the colour of the sky, the bottom and whatever stands on the shore — and changes it faster than you can mix the paint.</p><h2>Why layers</h2><p>I work in glazes: each successive layer is transparent and goes on only after the previous one has dried completely. The colour is not mixed mechanically but assembled optically — light passes through the upper layers, reflects off the lower ones and returns changed.</p><p>It is slow. One work takes from three weeks to two months. But I know no other way to achieve the sense of water lit from within.</p>",
      seoTitle: "How I Paint the Sea — Layered Oil Technique | JST ART",
      seoDescription:
        "Artist Jung Sen Tek on glazing technique, working in layers and finding light on water.",
      keywords: "oil painting technique, glazing technique, how to paint water",
      hashtags: "paintingtechnique, oilpainting, glazing",
    },
    KO: {
      slug: "badareul-geurineun-bangbeop",
      title: "바다를 그리는 방법",
      excerpt: "여러 겹으로 쌓아 올리는 유화 기법과 물 위의 빛을 찾는 과정.",
      contentHtml:
        "<p>물은 결코 파랗지 않습니다. 하늘과 바닥, 그리고 물가에 선 것들의 색을 받아들이며, 물감을 섞는 속도보다 빠르게 변합니다.</p><h2>왜 겹으로 쌓는가</h2><p>저는 글레이징 기법으로 작업합니다. 각 층은 투명하며, 이전 층이 완전히 마른 뒤에만 올립니다. 색이 물리적으로 섞이는 것이 아니라 광학적으로 쌓입니다. 빛이 윗층을 통과해 아랫층에 반사되어 다른 색으로 돌아옵니다.</p><p>느린 방식입니다. 한 작품에 삼 주에서 두 달이 걸립니다. 하지만 안에서부터 빛나는 물의 느낌을 내는 다른 방법을 저는 알지 못합니다.</p>",
      seoTitle: "바다를 그리는 방법 — 유화 글레이징 기법 | JST ART",
      seoDescription: "정성택 작가가 말하는 글레이징 기법과 물 위의 빛을 찾는 과정.",
      keywords: "유화 기법, 글레이징, 바다 그리는 법",
      hashtags: "회화기법, 유화, 글레이징",
    },
  },
};

const siteKeywords: Record<Locale, { keywords: string; hashtags: string }> = {
  RU: {
    keywords:
      "картины маслом купить, купить картину, оригинал картины, картина в интерьер, пейзаж маслом, морской пейзаж, натюрморт маслом, современная живопись, картина на холсте, авторская живопись",
    hashtags:
      "живопись, картинамаслом, современноеискусство, пейзаж, артдляинтерьера, купитькартину, маслонахолсте, авторскаяживопись",
  },
  EN: {
    keywords:
      "oil paintings for sale online, buy original painting, original artwork, landscape painting, seascape art, still life painting, contemporary painting, fine art prints, canvas painting, korean artist",
    hashtags:
      "oilpainting, originalart, contemporaryart, landscapeart, artforinteriors, buyart, canvaspainting, fineart",
  },
  KO: {
    keywords:
      "유화 그림 구매, 원화 판매, 그림 구매, 인테리어 그림, 풍경화, 바다 그림, 정물화, 현대 회화, 캔버스 그림, 작가 원화",
    hashtags:
      "유화, 원화, 그림스타그램, 풍경화, 인테리어그림, 미술작품, 현대미술, 아트",
  },
};

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { email: "admin@jst-art.example.com" },
    update: {},
    create: {
      email: "admin@jst-art.example.com",
      passwordHash,
      name: "Jung Sen Tek",
      role: "OWNER",
    },
  });

  // Коллекции
  const collectionIds = new Map<string, string>();
  for (const c of collections) {
    const existing = await prisma.collectionTranslation.findFirst({
      where: { locale: "RU", slug: c.tr.RU.slug },
    });

    const collection = existing
      ? await prisma.collection.update({
          where: { id: existing.collectionId },
          data: { position: c.position },
        })
      : await prisma.collection.create({ data: { position: c.position } });

    for (const locale of LOCALES) {
      const t = c.tr[locale];
      const payload = {
        slug: t.slug,
        title: t.title,
        description: t.description,
        seoTitle: t.seoTitle,
        seoDescription: t.seoDescription,
        keywords: t.keywords,
        hashtags: t.hashtags,
      };
      await prisma.collectionTranslation.upsert({
        where: { collectionId_locale: { collectionId: collection.id, locale } },
        update: payload,
        create: { ...payload, collectionId: collection.id, locale },
      });
    }

    collectionIds.set(c.key, collection.id);
  }

  // Работы
  for (const [index, a] of artworks.entries()) {
    const existing = await prisma.artworkTranslation.findFirst({
      where: { locale: "RU", slug: a.tr.RU.slug },
    });

    const core = {
      year: 2024,
      technique: a.technique,
      widthCm: a.widthCm,
      heightCm: a.heightCm,
      orientation:
        a.widthCm === a.heightCm
          ? ("SQUARE" as const)
          : a.widthCm > a.heightCm
            ? ("LANDSCAPE" as const)
            : ("PORTRAIT" as const),
      dominantColor: a.color,
      colorFamily: colorFamilyOf(a.color),
      priceOriginalCents: a.priceOriginalCents,
      pricePrintCents: a.pricePrintCents,
      collectionId: collectionIds.get(a.collectionKey)!,
      position: index,
      featured: index < 3,
      published: true,
      publishedAt: new Date(),
    };

    const artwork = existing
      ? await prisma.artwork.update({ where: { id: existing.artworkId }, data: core })
      : await prisma.artwork.create({ data: core });

    for (const locale of LOCALES) {
      const t = a.tr[locale];
      const payload = {
        slug: t.slug,
        title: t.title,
        description: t.description,
        story: t.story,
        altText: t.altText,
        seoTitle: t.seoTitle,
        seoDescription: t.seoDescription,
        keywords: t.keywords,
        hashtags: t.hashtags,
      };
      await prisma.artworkTranslation.upsert({
        where: { artworkId_locale: { artworkId: artwork.id, locale } },
        update: payload,
        create: { ...payload, artworkId: artwork.id, locale },
      });
    }

    const image = await makePlaceholder(a.color, 1200, 1500);
    await prisma.artworkImage.deleteMany({ where: { artworkId: artwork.id } });
    await prisma.artworkImage.create({
      data: {
        artworkId: artwork.id,
        url: image.url,
        format: "webp",
        width: image.width,
        height: image.height,
        isPrimary: true,
      },
    });
  }

  // Статья блога
  const existingPost = await prisma.blogPostTranslation.findFirst({
    where: { locale: "RU", slug: blogPost.tr.RU.slug },
  });
  const cover = await makePlaceholder(blogPost.color, 1200, 900);

  const post = existingPost
    ? await prisma.blogPost.update({
        where: { id: existingPost.blogPostId },
        data: { coverImage: cover.url, published: true, publishedAt: new Date() },
      })
    : await prisma.blogPost.create({
        data: { coverImage: cover.url, published: true, publishedAt: new Date() },
      });

  for (const locale of LOCALES) {
    const t = blogPost.tr[locale];
    const payload = {
      slug: t.slug,
      title: t.title,
      excerpt: t.excerpt,
      contentHtml: t.contentHtml,
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
      keywords: t.keywords,
      hashtags: t.hashtags,
    };
    await prisma.blogPostTranslation.upsert({
      where: { blogPostId_locale: { blogPostId: post.id, locale } },
      update: payload,
      create: { ...payload, blogPostId: post.id, locale },
    });
  }

  // Выставки
  for (const [index, e] of exhibitions.entries()) {
    const existing = await prisma.exhibitionTranslation.findFirst({
      where: { locale: "RU", title: e.tr.RU.title },
    });
    const poster = await makePlaceholder(e.color, 1200, 900);

    const core = {
      startDate: new Date(`${e.startDate}T00:00:00.000Z`),
      endDate: new Date(`${e.endDate}T00:00:00.000Z`),
      imageUrl: poster.url,
      pressUrl: e.pressUrl,
      position: index,
    };

    const exhibition = existing
      ? await prisma.exhibition.update({ where: { id: existing.exhibitionId }, data: core })
      : await prisma.exhibition.create({ data: core });

    for (const locale of LOCALES) {
      const t = e.tr[locale];
      await prisma.exhibitionTranslation.upsert({
        where: { exhibitionId_locale: { exhibitionId: exhibition.id, locale } },
        update: t,
        create: { ...t, exhibitionId: exhibition.id, locale },
      });
    }
  }

  // Семантическое ядро уровня сайта
  for (const locale of LOCALES) {
    await prisma.siteKeywords.upsert({
      where: { locale },
      update: siteKeywords[locale],
      create: { ...siteKeywords[locale], locale },
    });
  }

  console.log("Seed complete.");
  console.log("Admin login: admin@jst-art.example.com /", adminPassword);
  console.log(`Artworks: ${artworks.length} × 3 языка, коллекций: ${collections.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
