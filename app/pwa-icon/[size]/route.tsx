import { ImageResponse } from "next/og";

// PWA 설치 아이콘: 메인 화면처럼 검은 배경에 흰 동그라미 하나
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const px = size === "512" ? 512 : 192;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
        }}
      >
        <div style={{ width: px * 0.42, height: px * 0.42, borderRadius: "50%", background: "#ffffff" }} />
      </div>
    ),
    { width: px, height: px },
  );
}
