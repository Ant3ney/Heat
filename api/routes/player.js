const express = require('express');
const router = express.Router();
const {
    createPlayer,
    findAllPlayers,
    getPlayerById,
    getPlayerByEmail,
    loginPlayer,
    logoutPlayer,
    addCardToUnlocked,
//Testing
    addCardToHand,
} = require('../controllers/playerController');

router.route('/').post(createPlayer);
router.route('/player/:id').get(getPlayerById);
router.route('/getAll').get(findAllPlayers);
router.route('/email').get(getPlayerByEmail);
router.route('/login').post(loginPlayer);
router.route('/logout').post(logoutPlayer);

router.route('/unlocked/:id/:cardId').put(addCardToUnlocked);
//Testing
router.route('/testing/hand/:id/:cardId').put(addCardToHand);

module.exports = router;