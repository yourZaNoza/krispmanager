const db = require('../config/db')

class Task {
  static async findByUser(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at ASC',
      [userId]
    )
    return rows
  }

  static async create(userId, categoryId, data) {
    const dateVal = data.deadline || new Date().toISOString().split('T')[0]
    const [result] = await db.execute(
      `INSERT INTO tasks
        (user_id, id_category, date, title, description, deadline, enterprise, tags, lists, participants, attachments, comments, history)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        categoryId,
        dateVal,
        data.title,
        data.description || null,
        data.deadline || null,
        data.enterprise || null,
        JSON.stringify(data.tags || []),
        JSON.stringify(data.lists || []),
        JSON.stringify(data.participants || []),
        JSON.stringify(data.attachments || []),
        JSON.stringify(data.comments || []),
        JSON.stringify([]),
      ]
    )
    return result.insertId
  }

  static async update(taskId, userId, categoryId, data) {
    await db.execute(
      `UPDATE tasks SET
        id_category  = ?,
        title        = ?,
        description  = ?,
        deadline     = ?,
        enterprise   = ?,
        tags         = ?,
        lists        = ?,
        participants = ?,
        attachments  = ?,
        comments     = ?,
        history      = ?,
        completed    = ?
       WHERE id = ? AND user_id = ?`,
      [
        categoryId,
        data.title,
        data.description || null,
        data.deadline || null,
        data.enterprise || null,
        JSON.stringify(data.tags || []),
        JSON.stringify(data.lists || []),
        JSON.stringify(data.participants || []),
        JSON.stringify(data.attachments || []),
        JSON.stringify(data.comments || []),
        JSON.stringify(data.history || []),
        data.completed ? 1 : 0,
        taskId,
        userId,
      ]
    )
  }
}

module.exports = Task
