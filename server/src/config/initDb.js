const db = require('./db')

async function addColumnSafe(table, column, definition) {
  try {
    await db.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`)
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') return  // колонка уже есть
    throw err
  }
}

async function modifyColumnSafe(table, column, definition) {
  try {
    await db.execute(`ALTER TABLE \`${table}\` MODIFY COLUMN \`${column}\` ${definition}`)
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR') return  // колонка не существует
    throw err
  }
}

async function initDb() {
  // tasks_category: добавляем user_id чтобы привязать категории к пользователю
  await addColumnSafe('tasks_category', 'user_id', 'INT DEFAULT NULL')

  // id_enterprise существует в оригинальной схеме без DEFAULT — разрешаем NULL
  await modifyColumnSafe('tasks', 'id_enterprise', 'INT DEFAULT NULL')

  // tasks: добавляем все поля которых нет в существующей таблице
  await addColumnSafe('tasks', 'user_id',       'INT DEFAULT NULL')
  await addColumnSafe('tasks', 'title',         'VARCHAR(500) DEFAULT ""')
  await addColumnSafe('tasks', 'description',   'TEXT')
  await addColumnSafe('tasks', 'deadline',      'DATE')
  await addColumnSafe('tasks', 'enterprise',    'VARCHAR(255)')
  await addColumnSafe('tasks', 'tags',          'JSON')
  await addColumnSafe('tasks', 'lists',         'JSON')
  await addColumnSafe('tasks', 'participants',  'JSON')
  await addColumnSafe('tasks', 'attachments',   'JSON')
  await addColumnSafe('tasks', 'comments',      'JSON')
  await addColumnSafe('tasks', 'history',       'JSON')
  await addColumnSafe('tasks', 'completed',    'TINYINT(1) DEFAULT 0')

  // Таблица категорий предприятий (новая — создаём если нет)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS enterprise_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT DEFAULT NULL,
      title VARCHAR(255) NOT NULL,
      color VARCHAR(50) DEFAULT '#037247'
    )
  `)

  // Таблица предприятий уже существует — добавляем недостающие колонки
  await addColumnSafe('enterprises', 'user_id',     'INT DEFAULT NULL')
  await addColumnSafe('enterprises', 'category_id', 'INT DEFAULT NULL')
  await addColumnSafe('enterprises', 'city',        'VARCHAR(255) DEFAULT NULL')
  await addColumnSafe('enterprises', 'phone',       'VARCHAR(50) DEFAULT NULL')

  // Таблица категорий контактов
  await db.execute(`
    CREATE TABLE IF NOT EXISTS contact_categories (
      id      INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT DEFAULT NULL,
      title   VARCHAR(255) NOT NULL,
      color   VARCHAR(50) DEFAULT '#037247'
    )
  `)

  // Таблица контактов уже может существовать — добавляем недостающие колонки
  await modifyColumnSafe('contacts', 'id_employee', 'INT DEFAULT NULL')
  await addColumnSafe('contacts', 'user_id',     'INT DEFAULT NULL')
  await addColumnSafe('contacts', 'category_id', 'INT DEFAULT NULL')
  await addColumnSafe('contacts', 'city',        'VARCHAR(255) DEFAULT NULL')
  await addColumnSafe('contacts', 'email',       'VARCHAR(255) DEFAULT NULL')
  await addColumnSafe('contacts', 'phone',       'VARCHAR(50)  DEFAULT NULL')

  console.log('Схема БД обновлена')
}

module.exports = initDb
