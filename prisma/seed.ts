import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import sharp from "sharp";

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

/**
 * Локальные градиентные плейсхолдеры вместо внешнего сервиса (picsum.photos и
 * т.п.) — сид работает офлайн и не зависит от доступности стороннего домена.
 * В реальной админке эти изображения заменяются на настоящие фото картин.
 */
async function makePlaceholder(label: string, color: string, width: number, height: number) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="1"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)" />
      <text x="50%" y="50%" font-family="serif" font-size="${Math.round(width / 14)}"
        fill="white" fill-opacity="0.85" text-anchor="middle" dominant-baseline="middle">${label}</text>
    </svg>`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const id = randomUUID();

  const full = await sharp(Buffer.from(svg)).webp({ quality: 85 }).toBuffer();
  const thumb = await sharp(Buffer.from(svg)).resize({ width: 400 }).webp({ quality: 80 }).toBuffer();

  const fullName = `${id}-full.webp`;
  const thumbName = `${id}-thumb.webp`;
  await writeFile(path.join(UPLOAD_DIR, fullName), full);
  await writeFile(path.join(UPLOAD_DIR, thumbName), thumb);

  return { url: `/api/media/${fullName}`, thumbUrl: `/api/media/${thumbName}`, width, height };
}

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

  const seaside = await prisma.collection.upsert({
    where: { slug: "seaside-light" },
    update: {},
    create: {
      slug: "seaside-light",
      title: "Свет побережья",
      description: "Морские пейзажи и свет южного побережья Кореи.",
      position: 1,
      seoTitle: "Свет побережья — коллекция картин | JST ART",
      seoDescription: "Коллекция морских пейзажей художника Jung Sen Tek.",
    },
  });

  const stillLife = await prisma.collection.upsert({
    where: { slug: "quiet-things" },
    update: {},
    create: {
      slug: "quiet-things",
      title: "Тихие вещи",
      description: "Натюрморты и камерные композиции.",
      position: 2,
      seoTitle: "Тихие вещи — коллекция натюрмортов | JST ART",
      seoDescription: "Коллекция натюрмортов художника Jung Sen Tek.",
    },
  });

  const artworksData = [
    {
      slug: "sunset-over-the-lake",
      title: "Закат над озером",
      collectionId: seaside.id,
      widthCm: 80,
      heightCm: 60,
      priceOriginalCents: 850_000_00,
      pricePrintCents: 45_000_00,
      dominantColor: "#B5652F",
      story: "Написана на закате в Чеджу, когда небо на пятнадцать минут стало цвета охры.",
    },
    {
      slug: "morning-fog",
      title: "Утренний туман",
      collectionId: seaside.id,
      widthCm: 100,
      heightCm: 70,
      priceOriginalCents: 1_200_000_00,
      pricePrintCents: 55_000_00,
      dominantColor: "#8B96A5",
      story: "Побережье Пусана рано утром, до того как просыпается город.",
    },
    {
      slug: "quiet-table",
      title: "Тихий стол",
      collectionId: stillLife.id,
      widthCm: 50,
      heightCm: 40,
      priceOriginalCents: 420_000_00,
      pricePrintCents: 32_000_00,
      dominantColor: "#6E5B4B",
      story: "Натюрморт, написанный в мастерской художника зимним утром 2023 года.",
    },
    {
      slug: "winter-window",
      title: "Зимнее окно",
      collectionId: stillLife.id,
      widthCm: 60,
      heightCm: 60,
      priceOriginalCents: 690_000_00,
      pricePrintCents: 38_000_00,
      dominantColor: "#D7D2C4",
      story: "Вид из мастерской художника в первый снег.",
    },
  ];

  for (const [index, data] of artworksData.entries()) {
    const artwork = await prisma.artwork.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        slug: data.slug,
        title: data.title,
        description: data.story.slice(0, 120),
        story: data.story,
        year: 2023,
        widthCm: data.widthCm,
        heightCm: data.heightCm,
        orientation: data.widthCm === data.heightCm ? "SQUARE" : data.widthCm > data.heightCm ? "LANDSCAPE" : "PORTRAIT",
        dominantColor: data.dominantColor,
        priceOriginalCents: data.priceOriginalCents,
        pricePrintCents: data.pricePrintCents,
        collectionId: data.collectionId,
        position: index,
        featured: index < 3,
        published: true,
        publishedAt: new Date(),
        seoTitle: `${data.title} — картина маслом | JST ART`,
        seoDescription: data.story.slice(0, 155),
        altText: `Картина маслом "${data.title}" художника Jung Sen Tek`,
      },
    });

    const image = await makePlaceholder(data.title, data.dominantColor, 1200, 1500);

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

  const exhibitionImage = await makePlaceholder("Выставка", "#7A6A55", 900, 675);
  const exhibitionData = {
    title: "Личная выставка «Свет побережья»",
    description: "Первая персональная выставка Jung Sen Tek в Сеуле.",
    location: "Сеул, Галерея Insa",
    startDate: new Date("2024-05-10"),
    endDate: new Date("2024-05-24"),
    imageUrl: exhibitionImage.url,
    position: 1,
  };
  await prisma.exhibition.upsert({
    where: { id: "seed-exhibition-1" },
    update: exhibitionData,
    create: { id: "seed-exhibition-1", ...exhibitionData },
  });

  const blogImage = await makePlaceholder("Как я пишу море", "#3E5C6B", 1200, 900);
  const blogData = {
    title: "Как я пишу море",
    excerpt: "О технике многослойного письма маслом и поиске света.",
    contentHtml: "<p>О технике многослойного письма маслом и поиске света на воде.</p>",
    coverImage: blogImage.url,
    published: true,
    publishedAt: new Date(),
    seoTitle: "Как я пишу море | Блог JST ART",
    seoDescription: "О технике многослойного письма маслом и поиске света на воде.",
  };
  await prisma.blogPost.upsert({
    where: { slug: "kak-ya-pishu-more" },
    update: blogData,
    create: { slug: "kak-ya-pishu-more", ...blogData },
  });

  console.log("Seed complete. Admin login: admin@jst-art.example.com /", adminPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
