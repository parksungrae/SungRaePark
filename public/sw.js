// /alarm 페이지용 서비스 워커. 탭이 닫혀 있어도 브라우저가 푸시를 받으면 이 파일을 깨워 알림을 띄운다.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "알림", {
      body: data.body || "",
      tag: data.id,
      data: { url: data.url || "/alarm" },
    }),
  );
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
