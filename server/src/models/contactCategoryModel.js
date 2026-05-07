const db = require('../config/db')

const DEFAULTS = [
  { title: 'Физические лица', color: '#7B5EA7' },
  { title: 'Сотрудники',      color: '#1565C0' },
  { title: 'Представители',   color: '#E65100' },
]

class ContactCategory {
  static async findByUser(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM contact_categories WHERE user_id = ? ORDER BY id ASC',
      [userId]
    )
    return rows
  }

  static async seedDefaults(userId) {
    for (const d of DEFAULTS) {
      await db.execute(
        'INSERT INTO contact_categories (user_id, title, color) VALUES (?, ?, ?)',
        [userId, d.title, d.color]
      )
    }
  }

  static async create(userId, title, color) {
    const [result] = await db.execute(
      'INSERT INTO contact_categories (user_id, title, color) VALUES (?, ?, ?)',
      [userId, title, color || '#037247']
    )
    return { id: result.insertId, user_id: userId, title, color: color || '#037247' }
  }

  static async update(id, userId, title, color) {
    await db.execute(
      'UPDATE contact_categories SET title = ?, color = ? WHERE id = ? AND user_id = ?',
      [title, color, id, userId]
    )
  }

  static async delete(id, userId) {
    await db.execute('DELETE FROM contacts WHERE category_id = ? AND user_id = ?', [id, userId])
    await db.execute('DELETE FROM contact_categories WHERE id = ? AND user_id = ?', [id, userId])
  }
}

module.exports = ContactCategory
