const express = require("express");
const router = express.Router();
const {
  createPlayer,
  findAllPlayers,
  getPlayerById,
  getPlayerByEmail,
  loginPlayer,
  logoutPlayer,
  addCardToUnlocked,
  updateBalance,
  removeCardFromHand,
  deletePlayer,
  updatePlayer,
  //Testing
  addCardToHand,
} = require("../controllers/playerController");

router.route("/").post(createPlayer).get(findAllPlayers);
router.route("/update").post(updatePlayer);
router.route("/player/:id").get(getPlayerById).delete(deletePlayer);
router.route("/email").get(getPlayerByEmail);
router.route("/login").post(loginPlayer);
router.route("/logout").post(logoutPlayer);

router.route("/unlocked/:id/:cardId").put(addCardToUnlocked);

router.route("/hand/:id/:cardId").put(addCardToHand).delete(removeCardFromHand);

router.route("/balance/:id/").put(updateBalance);
//Testing
router.route("/testing/hand/:id/:cardId").delete(removeCardFromHand);

module.exports = router;
