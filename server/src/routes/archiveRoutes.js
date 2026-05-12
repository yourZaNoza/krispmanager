const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const ctrl = require('../controllers/archiveController')

router.get('/employees',              auth, ctrl.getEmployees)
router.get('/users/:id/tasks',        auth, ctrl.getUserTasks)
router.get('/users/:id/notes',        auth, ctrl.getUserNotes)
router.delete('/tasks/:id',           auth, ctrl.deleteTask)
router.put('/tasks/:id/restore',      auth, ctrl.restoreTask)
router.delete('/notes/:id',           auth, ctrl.deleteNote)
router.put('/notes/:id/restore',      auth, ctrl.restoreNote)

module.exports = router
