const Note = require('../models/noteModel')

exports.getAll = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    res.json(await Note.findByUser(userId))
  } catch (err) {
    console.error('getAll notes error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

exports.create = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    const { title, date, time, tags, lists, comments, history, attachments } = req.body
    if (!title?.trim()) return res.status(400).json({ message: 'title обязателен' })
    const id = await Note.create(userId, { title, date, time, tags, lists, comments, history, attachments })
    res.status(201).json({
      id, title,
      date:        date        || null,
      time:        time        || '',
      tags:        tags        || [],
      lists:       lists       || [],
      comments:    comments    || [],
      history:     history     || [],
      attachments: attachments || [],
    })
  } catch (err) {
    console.error('create note error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

exports.update = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    const id = parseInt(req.params.id, 10)
    const { title, date, time, tags, lists, comments, history, attachments } = req.body
    await Note.update(id, userId, { title, date, time, tags, lists, comments, history, attachments })
    res.json({ message: 'Заметка обновлена' })
  } catch (err) {
    console.error('update note error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

exports.remove = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Не авторизован' })
    const id = parseInt(req.params.id, 10)
    await Note.delete(id, userId)
    res.json({ message: 'Заметка удалена' })
  } catch (err) {
    console.error('delete note error:', err)
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}
