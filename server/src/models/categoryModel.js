const db = require('../config/db')

class Category {
  static async findByUser(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM tasks_category WHERE user_id = ? OR user_id IS NULL ORDER BY id_category ASC',
      [userId]
    )
    return rows
  }

  static async findGlobal() {
    const [rows] = await db.execute(
      'SELECT * FROM tasks_category WHERE user_id IS NULL ORDER BY id_category ASC'
    )
    return rows
  }

  static async findOne(categoryId) {
    const [rows] = await db.execute(
      'SELECT * FROM tasks_category WHERE id_category = ?',
      [categoryId]
    )
    return rows[0] ?? null
  }

  static async create(userId, title, color) {
    const [result] = await db.execute(
      'INSERT INTO tasks_category (user_id, title, color) VALUES (?, ?, ?)',
      [userId, title, color || '#037247']
    )
    return { id_category: result.insertId, user_id: userId, title, color: color || '#037247' }
  }

  static async createGlobal(title, color) {
    const [result] = await db.execute(
      'INSERT INTO tasks_category (user_id, title, color) VALUES (NULL, ?, ?)',
      [title, color || '#037247']
    )
    return { id_category: result.insertId, user_id: null, title, color: color || '#037247' }
  }

  static async update(categoryId, userId, title, color) {
    await db.execute(
      'UPDATE tasks_category SET title = ?, color = ? WHERE id_category = ? AND user_id = ?',
      [title, color, categoryId, userId]
    )
  }

  static async updateGlobal(categoryId, title, color) {
    await db.execute(
      'UPDATE tasks_category SET title = ?, color = ? WHERE id_category = ? AND user_id IS NULL',
      [title, color, categoryId]
    )
  }

  static async delete(categoryId, userId) {
    await db.execute(
      'DELETE FROM tasks WHERE id_category = ? AND user_id = ?',
      [categoryId, userId]
    )
    await db.execute(
      'DELETE FROM tasks_category WHERE id_category = ? AND user_id = ?',
      [categoryId, userId]
    )
  }

  static async deleteGlobal(categoryId) {
    await db.execute(
      'DELETE FROM tasks_category WHERE id_category = ? AND user_id IS NULL',
      [categoryId]
    )
  }
}

module.exports = Category
