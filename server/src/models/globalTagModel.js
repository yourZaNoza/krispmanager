const db = require('../config/db')

class GlobalTag {
  static async findByScope(scope) {
    const [rows] = await db.execute(
      'SELECT * FROM global_tags WHERE scope = ? ORDER BY id ASC',
      [scope]
    )
    return rows
  }

  static async create(scope, label, bg, color) {
    const [result] = await db.execute(
      'INSERT INTO global_tags (scope, label, bg, color) VALUES (?, ?, ?, ?)',
      [scope, label, bg || '#f5f5f5', color || '#616161']
    )
    return { id: result.insertId, scope, label, bg: bg || '#f5f5f5', color: color || '#616161' }
  }

  static async update(id, label, bg, color) {
    await db.execute(
      'UPDATE global_tags SET label = ?, bg = ?, color = ? WHERE id = ?',
      [label, bg, color, id]
    )
  }

  static async delete(id) {
    await db.execute('DELETE FROM global_tags WHERE id = ?', [id])
  }
}

module.exports = GlobalTag
