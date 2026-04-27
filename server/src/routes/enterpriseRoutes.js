const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const ctrl = require('../controllers/enterpriseController')

router.get('/',     auth, ctrl.getAll)
router.post('/',    auth, ctrl.createEnterprise)
router.put('/:id',  auth, ctrl.updateEnterprise)
router.delete('/:id', auth, ctrl.deleteEnterprise)

module.exports = router
