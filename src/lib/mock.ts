import { EscortProfile, Gender, PhotoItem, VideoItem, VirtualServiceItem } from "./types";

export const escortImgs: string[] = [
  "https://i.escortforumit.xxx/686685/profile/deef0002-437f-4464-a781-8ac4843488f4_profile.jpg?v=5",
  "https://i.escortforumit.xxx/710869/profile/9c6cc2e7-5ad8-4684-bd96-fdfcfd6faa58_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/376078/profile/190aa487-a2dd-43ee-a4c2-5dff8c5fab49_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/703461/profile/28a91e4c-c6c3-4639-bae9-aeab4cbad15c_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/686141/profile/80cb7136-bcc1-4c01-9430-b8cbedd43a21_thumb_750.jpg?v=1",
  "https://i.escortforumit.xxx/708057/profile/7040775e-d371-48b6-b310-6424e5ed3cd6_thumb_750.jpg?v=1",
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
