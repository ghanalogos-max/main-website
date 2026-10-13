import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GhanaLogos — Ghanaian Company Logos",
    short_name: "GhanaLogos",
    description: "Official Ghanaian company logos in SVG and PNG.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF7",
    theme_color: "#006B3F",
    icons: [{ src: "/logo-mark.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
