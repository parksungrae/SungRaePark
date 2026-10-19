import { ImageResponse } from "next/og";

// 알림에 붙는 큰 이미지. 메인 화면처럼 동그라미 격자에 하나만 밝게 빛난다.
// 빌드할 때 한 번만 만들어 정적 파일로 제공한다.
export const dynamic = "force-static";

const COLS = 10;
const ROWS = 4;
const LIT = 14;

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexWrap: "wrap",
          alignContent: "center",
          justifyContent: "center",
          gap: 28,
          padding: "0 60px",
          background: "#000000",
        }}
      >
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <div
            key={i}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: i === LIT ? "#ffffff" : "#2a2a2a",
              boxShadow: i === LIT ? "0 0 32px 8px rgba(255,255,255,0.55)" : "none",
            }}
          />
        ))}
      </div>
    ),
    { width: 720, height: 360 },
  );
}
