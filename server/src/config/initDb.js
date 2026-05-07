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

  // Таблица заметок уже может существовать — добавляем недостающие колонки
  await modifyColumnSafe('notes', 'id_employee', 'INT DEFAULT NULL')
  await modifyColumnSafe('notes', 'description', 'TEXT DEFAULT NULL')
  await addColumnSafe('notes', 'user_id', 'INT DEFAULT NULL')
  await addColumnSafe('notes', 'title',   'VARCHAR(500) DEFAULT ""')
  await addColumnSafe('notes', 'time',    'VARCHAR(10) DEFAULT NULL')
  await addColumnSafe('notes', 'tags',     'JSON')
  await addColumnSafe('notes', 'lists',    'JSON')
  await addColumnSafe('notes', 'comments', 'JSON')
  await addColumnSafe('notes', 'history',     'JSON')
  await addColumnSafe('notes', 'attachments', 'JSON')

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

  // employees: добавляем поле роли
  await addColumnSafe('employees', 'role', "VARCHAR(50) DEFAULT 'сотрудник'")

  // Создаём 3 глобальные категории задач по умолчанию (если их ещё нет)
  const [[{ cnt }]] = await db.execute(
    'SELECT COUNT(*) AS cnt FROM tasks_category WHERE user_id IS NULL'
  )
  if (Number(cnt) === 0) {
    await db.execute(`
      INSERT INTO tasks_category (user_id, title, color) VALUES
        (NULL, 'Планы',      '#2196F3'),
        (NULL, 'В процессе', '#FF9800'),
        (NULL, 'Готово',     '#4CAF50')
    `)
  }

  // Удаляем все пользовательские категории — оставляем только глобальные
  const [userCats] = await db.execute(
    'SELECT id_category FROM tasks_category WHERE user_id IS NOT NULL'
  )
  if (userCats.length > 0) {
    const ids = userCats.map(c => c.id_category).join(',')
    await db.execute(`DELETE FROM tasks WHERE id_category IN (${ids})`)
    await db.execute('DELETE FROM tasks_category WHERE user_id IS NOT NULL')
  }

  // employees: позиция/должность
  await addColumnSafe('employees', 'position', "VARCHAR(255) DEFAULT ''")

  // Глобальные теги для задач и заметок
  await db.execute(`
    CREATE TABLE IF NOT EXISTS global_tags (
      id    INT AUTO_INCREMENT PRIMARY KEY,
      scope VARCHAR(10)  NOT NULL,
      label VARCHAR(100) NOT NULL,
      bg    VARCHAR(50)  DEFAULT '#f5f5f5',
      color VARCHAR(50)  DEFAULT '#616161'
    )
  `)

  // Таблица уведомлений
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT NOT NULL,
      actor_id   INT DEFAULT NULL,
      actor_name VARCHAR(255) DEFAULT NULL,
      type       VARCHAR(50)  DEFAULT 'task_updated',
      task_id    INT DEFAULT NULL,
      task_title VARCHAR(500) DEFAULT NULL,
      message    TEXT,
      is_read    TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notif_user (user_id),
      INDEX idx_notif_created (created_at)
    )
  `)

  console.log('Схема БД обновлена')
}

module.exports = initDb
