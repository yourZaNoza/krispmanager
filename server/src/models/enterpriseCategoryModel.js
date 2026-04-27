const db = require('../config/db')

const DEFAULTS = [
  { title: 'Школы',       color: '#1565C0' },
  { title: 'Колледжи',    color: '#6A1B9A' },
  { title: 'Детские сады', color: '#E65100' },
]

class EnterpriseCategory {
  static async findByUser(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM enterprise_categories WHERE user_id = ? ORDER BY id ASC',
      [userId]
    )
    return rows
  }

  static async seedDefaults(userId) {
    for (const d of DEFAULTS) {
      await db.execute(
        'INSERT INTO enterprise_categories (user_id, title, color) VALUES (?, ?, ?)',
        [userId, d.title, d.color]
      )
    }
  }

  static async create(userId, title, color) {
    const [result] = await db.execute(
      'INSERT INTO enterprise_categories (user_id, title, color) VALUES (?, ?, ?)',
      [userId, title, color || '#037247']
    )
    return { id: result.insertId, user_id: userId, title, color: color || '#037247' }
  }

  static async update(id, userId, title, color) {
    await db.execute(
      'UPDATE enterprise_categories SET title = ?, color = ? WHERE id = ? AND user_id = ?',
      [title, color, id, userId]
    )
  }

  static async delete(id, userId) {
    await db.execute(
      'DELETE FROM enterprises WHERE category_id = ? AND user_id = ?',
      [id, userId]
    )
    await db.execute(
      'DELETE FROM enterprise_categories WHERE id = ? AND user_id = ?',
      [id, userId]
    )
  }
}

module.exports = EnterpriseCategory
