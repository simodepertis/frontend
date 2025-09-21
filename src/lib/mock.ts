import { EscortProfile, Gender, PhotoItem, VideoItem, VirtualServiceItem } from "./types";

// Demo-friendly image sources (allow hotlinking)
export const escortImgs: string[] = [
  "https://picsum.photos/id/1011/800/1200",
  "https://picsum.photos/id/1012/800/1200",
  "https://picsum.photos/id/1015/800/1200",
  "https://picsum.photos/id/1027/800/1200",
  "https://picsum.photos/id/1035/800/1200",
  "https://picsum.photos/id/1043/800/1200",
];

const cities = ["Milano", "Roma", "Firenze", "Napoli", "Bologna"];
const genders: Gender[] = ["Donna", "Trans"];

export const escorts: EscortProfile[] = Array.from({ length: 24 }).map((_, i) => {
  const name = ["Giulia", "Martina", "Sara", "Elena", "Sofia", "Chiara", "Maya", "Luna"][i % 8];
  const city = cities[i % cities.length];
  const gender = genders[i % genders.length];
  const slug = `${name}-${city}`.toLowerCase().replace(/\s+/g, "-");
  return {
    id: i + 1,
    slug,
    nome: name,
    eta: 22 + (i % 10),
    city,
    independent: i % 3 !== 0,
    gender,
    verified: i % 2 === 0,
    tier: (i % 5 === 0 ? "Diamond" : i % 4 === 0 ? "Top" : i % 3 === 0 ? "Gold" : "Standard"),
    isNew: i % 6 === 0,
    inTour: i % 7 === 0,
    tourUntil: i % 7 === 0 ? `${10 + (i % 10)} set` : undefined,
    capelli: ["Biondi", "Castani", "Neri"][i % 3],
    prezzo: 140 + (i % 5) * 20,
    photo: escortImgs[i % escortImgs.length],
    metrics: {
      photosCount: (i * 3) % 12,
      videosCount: (i * 2) % 6,
      reviewsCount: (i * 5) % 20,
      commentsCount: (i * 4) % 15,
    },
    top10Rank: i < 10 ? i + 1 : undefined,
  };
});

export const photos: PhotoItem[] = Array.from({ length: 36 }).map((_, i) => ({
  id: i + 1,
  src: escortImgs[i % escortImgs.length],
  city: cities[i % cities.length],
  gender: genders[i % genders.length],
  verified: i % 2 === 0,
  hd: i % 3 === 0,
  isNew: i % 5 === 0,
}));

export const videos: VideoItem[] = Array.from({ length: 24 }).map((_, i) => ({
  id: i + 1,
  thumb: escortImgs[i % escortImgs.length],
  title: `Anteprima Video #${i + 1}`,
  duration: `${2 + (i % 6)}:${String((10 + i) % 60).padStart(2, "0")}`,
  city: cities[i % cities.length],
  gender: genders[i % genders.length],
  verified: i % 2 === 1,
  hd: i % 4 === 0,
  isNew: i % 6 === 0,
}));

export const virtualServices: VirtualServiceItem[] = Array.from({ length: 18 }).map((_, i) => ({
  id: i + 1,
  modelId: (i % escorts.length) + 1,
  type: ["Chat", "Videochiamata", "Chiamata"][i % 3] as VirtualServiceItem["type"],
  price: 20 + (i % 4) * 5,
  duration: 15 + (i % 3) * 15,
}));

// Dashboard extras (mock)
export const stories = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  name: escorts[i % escorts.length].nome,
  avatar: escortImgs[i % escortImgs.length],
  unread: (i % 3) === 0 ? (i % 5) + 1 : 0,
}));

export const forumActivities = [
  {
    id: 1,
    title: "Heading to Naples this weekend. Any good recommendations for clubs/bars?",
    author: "stpc10",
    date: "28 ago, 2025",
    url: "/forum",
  },
];

export const notifications = [
  { id: 1, text: "Nuovo profilo consigliato nella tua città", time: "1h fa" },
  { id: 2, text: "Una modella che segui è in tour vicino a te", time: "ieri" },
];

export function pickHappyHour() {
  const e = escorts[3];
  const basePrice: number = typeof (e as any).prezzo === 'number' ? (e as any).prezzo : 140;
  return {
    name: e.nome,
    city: e.city,
    photo: e.photo,
    oldPrice: `${basePrice + 20} EUR`,
    newPrice: `${Math.max(20, basePrice - 20)} EUR`,
    duration: "30 minutes",
    url: `/escort/${e.slug}`,
  };
}
