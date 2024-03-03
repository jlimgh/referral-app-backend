const express = require('express')
const router = express.Router()
const referralController = require('../controllers/referralController')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
    .get(referralController.getAllReferrals)
    .post(referralController.createNewReferral)
    .patch(referralController.updateReferral)
    .delete(referralController.deleteReferral)

module.exports = router