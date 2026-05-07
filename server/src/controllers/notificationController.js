const Notification = require('../models/notificationModel')

// GET /api/notifications?limit=20&offset=0
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    const limit  = Math.min(parseInt(req.query.limit)  || 20, 50)
    const offset = parseInt(req.query.offset) || 0
    const [notifications, unread] = await Promise.all([
      Notification.findByUser(userId, limit, offset),
      Notification.countUnread(userId),
    ])
    res.json({ notifications, unread })
  } catch (err) {
    console.error('getNotifications error:', err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    const unread = await Notification.countUnread(userId)
    res.json({ unread })
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    await Notification.markAllRead(userId)
    res.json({ message: 'Всё прочитано' })
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    await Notification.markRead(parseInt(req.params.id), userId)
    res.json({ message: 'Прочитано' })
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    await Notification.delete(parseInt(req.params.id), userId)
    res.json({ message: 'Удалено' })
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}
