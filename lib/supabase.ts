import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * NEXT_PUBLIC_* 는 빌드 시점에 문자열로 치환된다.
 * 값이 없는 채로 빌드되면 "undefined" 같은 문자열이 그대로 박히므로 걸러낸다.
 */
function readEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return undefined;
  return trimmed;
}

let cached: SupabaseClient | null = null;

/**
 * 익명(anon) 키 기반 공용 클라이언트.
 * 로그인 세션을 쓰지 않으므로 브라우저/서버 양쪽에서 그대로 재사용한다.
 *
 * 모듈 로드 시점이 아니라 첫 호출 때 만든다. 최상단에서 만들면 환경변수가 없는
 * 환경에서 이 모듈을 import 하는 것만으로 빌드나 라우트가 통째로 죽는다.
 */
export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = readEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = readEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    throw new Error(
      "Supabase 환경변수가 없습니다. NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_ANON_KEY 를 설정해주세요. (배포 환경이라면 호스팅 대시보드에도 등록해야 합니다)",
    );
  }
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL 이 올바른 URL이 아닙니다: ${url}`);
  }

  cached = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cached;
}
