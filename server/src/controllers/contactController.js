const ContactCategory = require('../models/contactCategoryModel')
const Contact  = require('../models/contactModel')
const Employee = require('../models/employeeModel')

function mapContact(c, registeredEmailMap) {
  const employeeId = c.email ? (registeredEmailMap.get(c.email.toLowerCase()) ?? null) : null
  return {
    id:           c.id,
    employeeId,
    categoryId:   c.category_id,
    name:         c.name  || '',
    city:         c.city  || '',
    email:        c.email || '',
    phone:        c.phone || '',
    isRegistered: employeeId !== null,
  }
}

// GET /api/contacts
exports.getAll = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })

    let categories = await ContactCategory.findByUser(userId)
    if (!categories.length) {
      await ContactCategory.seedDefaults(userId)
      categories = await ContactCategory.findByUser(userId)
    }

    const contacts = await Contact.findByUser(userId)

    const emails = contacts.map(c => c.email).filter(Boolean)
    const registeredEmails = await Employee.findRegisteredEmails(emails)

    const result = categories.map(cat => ({
      id:       cat.id,
      title:    cat.title,
      color:    cat.color,
      contacts: contacts.filter(c => c.category_id === cat.id).map(c => mapContact(c, registeredEmails)),
    }))

    res.json(result)
  } catch (err) {
    console.error('getAll contacts error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// POST /api/contacts
exports.create = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })

    const { categoryId, name, city, email, phone } = req.body
    if (!name || !categoryId) return res.status(400).json({ message: 'name и categoryId обязательны' })

    const id = await Contact.create(userId, categoryId, { name, city, email, phone })
    const isRegistered = email ? !!(await Employee.findByEmail(email)) : false
    res.status(201).json({ id, categoryId: Number(categoryId), name, city: city || '', email: email || '', phone: phone || '', isRegistered })
  } catch (err) {
    console.error('create contact error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// PUT /api/contacts/:id
exports.update = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })

    const id = parseInt(req.params.id, 10)
    const { categoryId, name, city, email, phone } = req.body
    if (!name || !categoryId) return res.status(400).json({ message: 'name и categoryId обязательны' })

    await Contact.update(id, userId, categoryId, { name, city, email, phone })
    const isRegistered = email ? !!(await Employee.findByEmail(email)) : false
    res.json({ id, categoryId: Number(categoryId), name, city: city || '', email: email || '', phone: phone || '', isRegistered })
  } catch (err) {
    console.error('update contact error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// POST /api/contacts/categories
exports.createCategory = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    const { title, color } = req.body
    if (!title) return res.status(400).json({ message: 'title обязателен' })
    const cat = await ContactCategory.create(userId, title, color)
    res.status(201).json({ id: cat.id, title: cat.title, color: cat.color })
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// PUT /api/contacts/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    const { title, color } = req.body
    if (!title) return res.status(400).json({ message: 'title обязателен' })
    await ContactCategory.update(parseInt(req.params.id), userId, title, color)
    res.json({ message: 'Категория обновлена' })
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// DELETE /api/contacts/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    await ContactCategory.delete(parseInt(req.params.id), userId)
    res.json({ message: 'Категория удалена' })
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// DELETE /api/contacts/:id
exports.remove = async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })

    const id = parseInt(req.params.id, 10)
    await Contact.delete(id, userId)
    res.json({ message: 'Контакт удалён' })
  } catch (err) {
    console.error('delete contact error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}
