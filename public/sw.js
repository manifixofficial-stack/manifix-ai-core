self.addEventListener("push", (event) => {
  const data = event.data.json()

  self.registration.showNotification(data.title, {
    body: data.body,
    icon: "/logo.png",
    badge: "/logo.png",
    vibrate: [100, 50, 100]
  })
})
