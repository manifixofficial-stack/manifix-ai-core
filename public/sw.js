// public/sw.js

/* ---------------- INSTALL ---------------- */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

/* ---------------- ACTIVATE ---------------- */
self.addEventListener("activate", (event) => {
  console.log("🔥 Service Worker Activated");
});

/* ---------------- PUSH EVENT ---------------- */
self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: "🔥 Magic16 Reminder",
      body: "Time to do your session!",
      type: "default",
    };
  }

  const hour = new Date().getHours();

  /* 🧠 SMART MESSAGE ENGINE */
  let title = data.title;
  let body = data.body;

  if (data.type === "streak_warning") {
    title = "⚠️ Don’t break your streak!";
    body = "Just 1 session keeps your progress alive.";
  }

  else if (data.type === "morning") {
    title = "🌅 Start Strong";
    body = "1 Magic16 session = full focus today.";
  }

  else if (data.type === "evening") {
    title = "🧘 Reset Your Mind";
    body = "Release stress. One session is enough.";
  }

  else if (data.type === "reward") {
    title = "🎉 Reward Unlocked!";
    body = "You earned a new level. Keep going!";
  }

  /* ⏰ FALLBACK BASED ON TIME */
  if (!data.type) {
    if (hour < 10) {
      title = "🌅 Morning Boost";
      body = "Start your day with Magic16 🔥";
    } else if (hour < 20) {
      title = "🧘 Take a Break";
      body = "Reset your mind with 1 session";
    } else {
      title = "⚠️ Last Chance";
      body = "Don't lose your streak today!";
    }
  }

  const options = {
    body,
    icon: "/logo.png",
    badge: "/logo.png",
    vibrate: [100, 50, 100],

    /* 🔥 ACTION BUTTONS */
    actions: [
      {
        action: "start",
        title: "🚀 Start Now",
      },
      {
        action: "later",
        title: "⏰Remind Me Later",
      },
    ],

    data: {
      url: "/app/magic16",
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/* ---------------- CLICK HANDLER ---------------- */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;

  if (action === "later") {
    /* ⏰ REMIND AGAIN AFTER 10 MIN */
    setTimeout(() => {
      self.registration.showNotification("Reminder", {
        body: "Now is the perfect time for Magic16 🔥",
      });
    }, 10 * 60 * 1000);
    return;
  }

  /* 🚀 OPEN APP */
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("/app/magic16")) {
            return client.focus();
          }
        }
        return clients.openWindow("/app/magic16");
      })
  );
});
