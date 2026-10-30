import type { Metadata } from "next";
import { Gowun_Batang, Gowun_Dodum } from "next/font/google";

const display = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pet-display",
});

const body = Gowun_Dodum({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pet-body",
});

export const metadata: Metadata = {
  title: "반려 일기 - ParkSungRae",
  description: "반려동물 하루 건강 기록, 영양제 체크, 상담, 이야기 나누기 (데모)",
};

export default function PetLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${display.variable} ${body.variable}`}>{children}</div>;
}
