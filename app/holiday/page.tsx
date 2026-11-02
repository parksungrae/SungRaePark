"use client";

import dynamic from "next/dynamic";
import { Big_Shoulders, IBM_Plex_Sans_KR, Noto_Serif_KR } from "next/font/google";

// 포스터 같은 좁고 굵은 숫자 + 한글 본문
const display = Big_Shoulders({ subsets: ["latin"], weight: ["600", "700", "800", "900"] });
// 띠 한자(辰·巳·午·未)용 굵은 명조
const glyph = Noto_Serif_KR({ subsets: ["latin"], weight: "900", preload: false });
const body = IBM_Plex_Sans_KR({ subsets: ["latin"], weight: ["400", "600", "700"], preload: false });

// 3D 장면과 오늘 날짜는 브라우저에서만 다룬다 (서버 UTC와 시간대가 달라서)
const HolidayExperience = dynamic(() => import("./HolidayExperience"), {
  ssr: false,
  loading: () => <div style={{ position: "fixed", inset: 0, background: "#07060b" }} />,
});

export default function HolidayPage() {
  return (
    <div className={`${display.className} ${body.className} ${glyph.className}`}>
      <HolidayExperience
        displayFont={display.style.fontFamily}
        bodyFont={body.style.fontFamily}
        glyphFont={glyph.style.fontFamily}
      />
    </div>
  );
}
