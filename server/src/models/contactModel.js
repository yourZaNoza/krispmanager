const db = require('../config/db')

class Contact {
  static async findByUser(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM contacts WHERE user_id = ? ORDER BY id ASC',
      [userId]
    )
    return rows
  }

  static async create(userId, categoryId, data) {
    const [result] = await db.execute(
      'INSERT INTO contacts (user_id, category_id, name, city, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, categoryId, data.name, data.city || null, data.email || null, data.phone || null]
    )
    return result.insertId
  }

  static async update(id, userId, categoryId, data) {
    await db.execute(
      'UPDATE contacts SET category_id = ?, name = ?, city = ?, email = ?, phone = ? WHERE id = ? AND user_id = ?',
      [categoryId, data.name, data.city || null, data.email || null, data.phone || null, id, userId]
    )
  }

  static async delete(id, userId) {
    await db.execute(
      'DELETE FROM contacts WHERE id = ? AND user_id = ?',
      [id, userId]
    )
  }
}

module.exports = Contact
