const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const ctrl = require('../controllers/contactController')

router.get('/',                    auth, ctrl.getAll)
router.post('/categories',         auth, ctrl.createCategory)
router.put('/categories/:id',      auth, ctrl.updateCategory)
router.delete('/categories/:id',   auth, ctrl.deleteCategory)
router.post('/',                   auth, ctrl.create)
router.put('/:id',                 auth, ctrl.update)
router.delete('/:id',              auth, ctrl.remove)

module.exports = router
