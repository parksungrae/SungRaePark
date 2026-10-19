// Next 서버가 시작될 때 한 번 실행된다
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startAlarmScheduler } = await import("./lib/alarm");
    startAlarmScheduler();
  }
}
