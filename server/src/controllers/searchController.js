const db = require('../config/db')

exports.search = async (req, res) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ message: 'Не авторизован' })

  const q = (req.query.q || '').trim()
  if (!q) return res.json([])

  const like = `%${q}%`
  const results = []

  try {
    // ── Task categories (global + user's own) ──────────────
    const [taskCats] = await db.execute(
      `SELECT id_category AS id, title FROM tasks_category
       WHERE (user_id IS NULL OR user_id = ?) AND title LIKE ?
       LIMIT 5`,
      [userId, like]
    )
    taskCats.forEach(c => results.push({
      section: 'Задачи',
      label:   c.title,
      path:    '/tasks',
      id:      c.id,
    }))

    // ── Tasks: title, description, tag labels ──────────────
    const [tasks] = await db.execute(
      `SELECT id, title FROM tasks
       WHERE (user_id = ? OR JSON_CONTAINS(participants, JSON_OBJECT('id', ?)))
         AND (
           title LIKE ?
           OR description LIKE ?
           OR (tags IS NOT NULL AND JSON_SEARCH(tags, 'all', ?, NULL, '$[*].label') IS NOT NULL)
         )
       LIMIT 7`,
      [userId, userId, like, like, like]
    )
    tasks.forEach(t => results.push({
      section: 'Задачи',
      label:   t.title || '(без названия)',
      path:    '/tasks',
      id:      t.id,
    }))

    // ── Contact categories ─────────────────────────────────
    const [contactCats] = await db.execute(
      `SELECT id, title FROM contact_categories
       WHERE (user_id IS NULL OR user_id = ?) AND title LIKE ?
       LIMIT 3`,
      [userId, like]
    )
    contactCats.forEach(c => results.push({
      section: 'Контакты',
      label:   c.title,
      path:    '/contacts',
      id:      c.id,
    }))

    // ── Contacts: name, email, phone, city ─────────────────
    const [contacts] = await db.execute(
      `SELECT id, name FROM contacts
       WHERE user_id = ? AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR city LIKE ?)
       LIMIT 5`,
      [userId, like, like, like, like]
    )
    contacts.forEach(c => results.push({
      section: 'Контакты',
      label:   c.name || '(без имени)',
      path:    '/contacts',
      id:      c.id,
    }))

    // ── Enterprise categories → Аналитика ──────────────────
    const [entCats] = await db.execute(
      `SELECT id, title FROM enterprise_categories
       WHERE (user_id IS NULL OR user_id = ?) AND title LIKE ?
       LIMIT 3`,
      [userId, like]
    )
    entCats.forEach(c => results.push({
      section: 'Аналитика',
      label:   c.title,
      path:    '/analytics',
      id:      c.id,
    }))

    // ── Enterprises: name, city, address, phone ────────────
    const [enterprises] = await db.execute(
      `SELECT id, name FROM enterprises
       WHERE user_id = ? AND (name LIKE ? OR city LIKE ? OR address LIKE ? OR phone LIKE ?)
       LIMIT 5`,
      [userId, like, like, like, like]
    )
    enterprises.forEach(e => results.push({
      section: 'Предприятия',
      label:   e.name || '(без названия)',
      path:    '/companies',
      id:      e.id,
    }))

    // ── Notes: title, tag strings ──────────────────────────
    const [notes] = await db.execute(
      `SELECT id, title FROM notes
       WHERE user_id = ?
         AND (
           title LIKE ?
           OR (tags IS NOT NULL AND JSON_SEARCH(tags, 'all', ?) IS NOT NULL)
         )
       LIMIT 5`,
      [userId, like, like]
    )
    notes.forEach(n => results.push({
      section: 'Заметки',
      label:   n.title || '(без названия)',
      path:    '/notes',
      id:      n.id,
    }))

    res.json(results)
  } catch (err) {
    console.error('search error:', err)
    res.status(500).json({ message: 'Ошибка поиска', error: err.message })
  }
}
