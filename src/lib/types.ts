export type LogoFormat = "svg" | "png" | "webp" | "jpg" | "gif";

export const MIME_TYPES: Record<LogoFormat, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  webp: "image/webp",
  jpg: "image/jpeg",
  gif: "image/gif",
};

export interface Logo {
  _id?: string;
  name: string;
  slug: string;
  categories: string[];
  /** Public URL of the master file (SVG preferred, raster when no vector exists). */
  imageUrl: string;
  format: LogoFormat;
  width?: number;
  height?: number;
  brandColor?: string;
  website?: string;
  featured?: boolean;
  downloadCount?: number;
  description?: string;
  wikipediaUrl?: string;
  sourceUrl?: string;
  license?: string;
}

export interface Category {
  title: string;
  slug: string;
  order?: number;
  description?: string;
}
