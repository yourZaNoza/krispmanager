const db = require("../config/db");

class Employee {
  static async findByEmail(email) {
    const [rows] = await db.execute(
      "SELECT e.*, r.name AS role FROM employees e LEFT JOIN roles r ON e.id_role = r.id WHERE e.email = ?",
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute(
      "SELECT e.*, r.name AS role FROM employees e LEFT JOIN roles r ON e.id_role = r.id WHERE e.id = ?",
      [id]
    );
    return rows[0];
  }

  static async create(name, email, password) {
    const [result] = await db.execute(
      "INSERT INTO employees (name, email, password) VALUES (?, ?, ?)",
      [name, email, password],
    );
    return result;
  }

  static async updateProfile(id, { name, email, position, role }) {
    await db.execute(
      "UPDATE employees SET name = ?, email = ?, position = ?, id_role = (SELECT id FROM roles WHERE name = ?) WHERE id = ?",
      [name, email, position || '', role ?? null, id],
    );
  }

  static async findAll() {
    const [rows] = await db.execute(
      'SELECT e.id, e.name, e.email, e.position, e.avatar, r.name AS role FROM employees e LEFT JOIN roles r ON e.id_role = r.id ORDER BY e.name ASC'
    )
    return rows
  }

  static async findAllWithAvatars() {
    const [rows] = await db.execute(
      'SELECT id, avatar FROM employees WHERE avatar IS NOT NULL'
    )
    return rows
  }

  static async updateAvatar(id, avatarUrl) {
    await db.execute('UPDATE employees SET avatar = ? WHERE id = ?', [avatarUrl, id])
  }

  static async delete(id) {
    await db.execute('DELETE FROM employees WHERE id = ?', [id])
  }

  static async findRegisteredEmails(emails) {
    if (!emails.length) return new Map()
    const placeholders = emails.map(() => '?').join(', ')
    const [rows] = await db.execute(
      `SELECT id, email FROM employees WHERE email IN (${placeholders})`,
      emails
    )
    return new Map(rows.map(r => [r.email.toLowerCase(), r.id]))
  }
}

module.exports = Employee;
