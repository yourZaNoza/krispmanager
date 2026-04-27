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
}

module.exports = ContactCategory
