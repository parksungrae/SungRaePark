import type { MetadataRoute } from "next";

// 사이트를 앱(PWA)으로 설치할 수 있게 한다. 설치하면 작업표시줄 아이콘에 알림 숫자 배지가 붙는다.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "박성래 - ParkSungRae",
    short_name: "ParkSungRae",
    start_url: "/alarm",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
