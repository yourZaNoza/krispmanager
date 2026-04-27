const db = require('../config/db')

class Enterprise {
  static async findByUser(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM enterprises WHERE user_id = ? ORDER BY id ASC',
      [userId]
    )
    return rows
  }

  static async create(userId, categoryId, data) {
    const [result] = await db.execute(
      'INSERT INTO enterprises (user_id, category_id, name, city, address, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, categoryId, data.name, data.city || null, data.address || null, data.phone || null]
    )
    return result.insertId
  }

  static async update(id, userId, categoryId, data) {
    await db.execute(
      'UPDATE enterprises SET category_id = ?, name = ?, city = ?, address = ?, phone = ? WHERE id = ? AND user_id = ?',
      [categoryId, data.name, data.city || null, data.address || null, data.phone || null, id, userId]
    )
  }

  static async delete(id, userId) {
    await db.execute(
      'DELETE FROM enterprises WHERE id = ? AND user_id = ?',
      [id, userId]
    )
  }
}

module.exports = Enterprise
