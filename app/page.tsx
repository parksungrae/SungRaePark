"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [showTitles, setShowTitles] = useState(false);
  const dots = Array.from({ length: 40 }, (_, i) => i);

  const dotData: Record<number, { href: string; title: string }> = {
    2: { href: "/make", title: "創" },
    3: { href: "/aquarium", title: "魚" },
    10: { href: "/photoworld", title: "寫" },
    5: { href: "/clothes", title: "衣" },
    18: { href: "/music", title: "歌" },
    38: { href: "/theme", title: "明" },
  };

  return (
    <main className="dots-container">
      {dots.map((i) => {
        const data = dotData[i];
        if (data) {
          return (
            <div key={i} className="dot-wrapper">
              <Link
                href={data.href}
                className="dot"
                style={{ display: "block", cursor: "pointer" }}
              />
              <span className={`dot-title ${showTitles ? "visible" : ""}`}>
                {data.title}
              </span>
            </div>
          );
        }
        return <div key={i} className="dot" />;
      })}

      <div className="dot-wrapper">
        <div
          className="dot half"
          title="60% blinking dot"
          onClick={() => setShowTitles(!showTitles)}
          style={{ cursor: "pointer" }}
        />
        <span className={`dot-title ${showTitles ? "visible" : ""}`}>目</span>
      </div>
    </main>
  );
}
