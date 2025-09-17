export type Tier = "Diamond" | "Top" | "Gold" | "Silver" | "Vip" | "Standard";
export type Gender = "Donna" | "Trans" | "Coppia";

export interface Metrics {
  photosCount: number;
  videosCount: number;
  reviewsCount: number;
  commentsCount: number;
}

export interface EscortProfile {
  id: number;
  slug: string;
  nome: string;
  eta: number;
  city: string;
  independent: boolean;
  gender: Gender;
  verified: boolean;
  tier: Tier;
  isNew: boolean;
  inTour?: boolean;
  tourUntil?: string;
  capelli?: string;
  prezzo?: number;
  photo: string;
  metrics: Metrics;
  top10Rank?: number;
}

export interface PhotoItem {
  id: number;
  src: string;
  city: string;
  gender: Gender;
  verified?: boolean;
  hd?: boolean;
  isNew?: boolean;
}

export interface VideoItem {
  id: number;
  thumb: string;
  title: string;
  duration: string;
  city: string;
  gender: Gender;
  verified?: boolean;
  hd?: boolean;
  isNew?: boolean;
}

export interface VirtualServiceItem {
  id: number;
  modelId: number;
  type: "Chat" | "Videochiamata" | "Chiamata";
  price: number;
  duration: number;
}
