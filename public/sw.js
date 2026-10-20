// /alarm 페이지용 서비스 워커. 탭이 닫혀 있어도 브라우저가 푸시를 받으면 이 파일을 깨워 알림을 띄운다.

// 앱 배지 숫자는 서비스 워커가 꺼졌다 켜져도 유지되도록 IndexedDB에 저장한다
function openBadgeDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("alarm-badge", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function readCount() {
  const db = await openBadgeDb();
  return new Promise((resolve) => {
    const req = db.transaction("kv").objectStore("kv").get("count");
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => resolve(0);
  });
}

async function writeCount(count) {
  const db = await openBadgeDb();
  return new Promise((resolve) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(count, "count");
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

// 앱으로 설치(PWA)했을 때 작업표시줄 아이콘에 숫자가 붙는다
async function increaseBadge() {
  const count = (await readCount()) + 1;
  await writeCount(count);
  if (self.navigator.setAppBadge) await self.navigator.setAppBadge(count).catch(() => {});
  return count;
}

async function clearBadge() {
  await writeCount(0);
  if (self.navigator.clearAppBadge) await self.navigator.clearAppBadge().catch(() => {});
}

// 알림 큰 이미지: public/alarm-photos/01.jpg ~ NN.jpg 중 하나를 무작위로 쓴다
// (scripts/make-alarm-photos.mjs로 public/images에서 만든다. 사진 수가 바뀌면 이 숫자도 바꿀 것)
const PHOTO_COUNT = 29;

function randomPhoto() {
  const n = 1 + Math.floor(Math.random() * PHOTO_COUNT);
  return `/alarm-photos/${String(n).padStart(2, "0")}.jpg`;
}

// 열려 있는 탭에 알려서 탭 제목 깜빡임과 파비콘 배지를 켠다
async function notifyOpenTabs(message) {
  const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of list) client.postMessage(message);
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "알림";

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body: data.body || "",
        // 큰 이미지와 아이콘을 넣으면 알림 자체가 커진다 (너비는 OS가 고정)
        icon: "/pwa-icon/192",
        image: randomPhoto(),
        tag: data.id,
        data: { url: data.url || "/alarm" },
      }),
      increaseBadge().then((count) => notifyOpenTabs({ type: "alarm", count, title })),
    ]),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "clear-badge") event.waitUntil(clearBadge());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/alarm";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (new URL(client.url).pathname === url && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
