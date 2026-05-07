const db = require('../config/db')

class Notification {
  static async create({ userId, actorId, actorName, type, taskId, taskTitle, message }) {
    const [result] = await db.execute(
      `INSERT INTO notifications (user_id, actor_id, actor_name, type, task_id, task_title, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, actorId || null, actorName || null, type || 'task_updated', taskId || null, taskTitle || null, message || null]
    )
    return result.insertId
  }

  static async findByUser(userId, limit = 20, offset = 0) {
    const [rows] = await db.execute(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      [userId]
    )
    return rows
  }

  static async countUnread(userId) {
    const [[{ cnt }]] = await db.execute(
      `SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    )
    return Number(cnt)
  }

  static async markAllRead(userId) {
    await db.execute(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [userId])
  }

  static async markRead(id, userId) {
    await db.execute(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [id, userId])
  }

  static async delete(id, userId) {
    await db.execute(`DELETE FROM notifications WHERE id = ? AND user_id = ?`, [id, userId])
  }
}

module.exports = Notification
