import { ImageResponse } from "next/og";

// PWA 설치 아이콘: 메인 화면처럼 검은 배경에 흰 동그라미 하나
// 빌드할 때 한 번만 만들어 정적 파일로 제공한다
export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }];
}

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
