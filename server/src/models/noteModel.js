const db = require('../config/db')

function safeJSON(val, fallback) {
  if (Array.isArray(val)) return val
  if (val === null || val === undefined) return fallback
  try { return JSON.parse(val) } catch { return fallback }
}

class Note {
  static async findByUser(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )
    return rows.map(r => ({
      id:          r.id,
      title:       r.title   || '',
      date:        r.date    ? r.date.toISOString().split('T')[0] : null,
      time:        r.time    || '',
      tags:        safeJSON(r.tags,        []),
      lists:       safeJSON(r.lists,       []),
      comments:    safeJSON(r.comments,    []),
      history:     safeJSON(r.history,     []),
      attachments: safeJSON(r.attachments, []),
    }))
  }

  static async create(userId, data) {
    const [result] = await db.execute(
      `INSERT INTO notes (user_id, title, date, time, tags, lists, comments, history, attachments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.title || '',
        data.date  || null,
        data.time  || null,
        JSON.stringify(data.tags        || []),
        JSON.stringify(data.lists       || []),
        JSON.stringify(data.comments    || []),
        JSON.stringify(data.history     || []),
        JSON.stringify(data.attachments || []),
      ]
    )
    return result.insertId
  }

  static async update(id, userId, data) {
    await db.execute(
      `UPDATE notes
         SET title = ?, date = ?, time = ?, tags = ?, lists = ?, comments = ?, history = ?, attachments = ?
       WHERE id = ? AND user_id = ?`,
      [
        data.title || '',
        data.date  || null,
        data.time  || null,
        JSON.stringify(data.tags        || []),
        JSON.stringify(data.lists       || []),
        JSON.stringify(data.comments    || []),
        JSON.stringify(data.history     || []),
        JSON.stringify(data.attachments || []),
        id, userId,
      ]
    )
  }

  static async delete(id, userId) {
    await db.execute(
      'DELETE FROM notes WHERE id = ? AND user_id = ?',
      [id, userId]
    )
  }
}

module.exports = Note
