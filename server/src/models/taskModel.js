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
        (user_id, id_category, date, title, description, deadline, date_from, enterprise, tags, lists, participants, attachments, comments, history)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        categoryId,
        dateVal,
        data.title,
        data.description || null,
        data.deadline    || null,
        data.date_from   || null,
        data.enterprise  || null,
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

  static async findById(taskId) {
    const [rows] = await db.execute('SELECT * FROM tasks WHERE id = ?', [taskId])
    return rows[0] || null
  }

  // Tasks where userId appears in participants JSON array
  static async findParticipating(userId) {
    const [rows] = await db.execute(
      `SELECT t.* FROM tasks t
       WHERE JSON_CONTAINS(t.participants, JSON_OBJECT('id', ?))
       ORDER BY t.created_at DESC`,
      [userId]
    )
    return rows
  }

  // All tasks for an employee: own tasks + tasks where they're a participant
  static async findAllForEmployee(userId) {
    const [rows] = await db.execute(
      `SELECT * FROM tasks
       WHERE user_id = ?
          OR JSON_CONTAINS(participants, JSON_OBJECT('id', ?))
       ORDER BY created_at DESC`,
      [userId, userId]
    )
    const seen = new Set()
    return rows.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true })
  }

  static async update(taskId, userId, categoryId, data) {
    await db.execute(
      `UPDATE tasks SET
        id_category  = ?,
        title        = ?,
        description  = ?,
        deadline     = ?,
        date_from    = ?,
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
        data.deadline    || null,
        data.date_from   || null,
        data.enterprise  || null,
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
