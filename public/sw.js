self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const title = data.title || 'Socio Pro'
  const options = {
    body: data.body || 'Tienes una notificación',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: data.tag || 'socio-pro',
    renotify: true,
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const url = event.notification.data?.url || '/'
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})