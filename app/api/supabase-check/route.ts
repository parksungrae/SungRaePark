import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Supabase 연결 확인용 엔드포인트.
 * 아직 테이블이 없으므로 존재하지 않는 테이블을 조회해서 응답 종류로 상태를 판별한다.
 * - PGRST205(테이블 없음) -> URL/키 정상, 연결 성공
 * - 401/Invalid API key   -> anon 키가 잘못됨
 */
export async function GET() {
  const { error } = await supabase.from("__connection_check__").select("*").limit(1);

  if (!error || error.code === "PGRST205") {
    return NextResponse.json({
      ok: true,
      message: "Supabase 연결 성공",
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
  }

  return NextResponse.json(
    { ok: false, message: error.message, code: error.code ?? null },
    { status: 500 },
  );
}
