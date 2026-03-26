import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IPL Predictor",
    short_name: "IPL Predictor",
    description: "A mobile-first IPL prediction game for office bragging rights.",
    start_url: "/",
    display: "standalone",
    background_color: "#06111f",
    theme_color: "#06111f",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
