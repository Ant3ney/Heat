const { ObjectId } = require("mongodb");
const Player = require("../models/Player");

const bcrypt = require("bcrypt");

const playerController = {
  createPlayer({ body }, res) {
    console.log('Attempting to create new player:"' + body.email + '"');
    const { password, ...otherBodyProps } = body;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.log(
          "An error just slammed into you with a spiked mace! You are stunned."
        );
        return res.status(500).json(err);
      }

      Player.create({ ...otherBodyProps, password: hashedPassword })
        .then((newPlayer) => {
          console.log("Player created successfully:");
          return res.status(200).json({
            message: `Player '${body.playername}' created successfully`,
            player: newPlayer,
          });
        })
        .catch((err) => {
          console.log(
            "An error just smacked you with a ham when trying to create a player! Take 1d4 bludgeoning damage"
          );
          return res.status(400).json(err);
        });
    });
  },
  deletePlayer({ params }, res) {
    const id = params.id;
    Player.findByIdAndDelete(id)
      .then((deletedPlayer) => {
        if (deletedPlayer)
          return res.status(200).json({ deletedPlayer: deletedPlayer });
        else
          return res
            .status(404)
            .json({ message: `Player with id ${id} not found.` });
      })
      .catch((err) => {
        console.log("Something went wrong when deleting a player");
        return res.status(400).json(err);
      });
  },
  findAllPlayers({ body }, res) {
    console.log("Attempting to find all players");
    Player.find()
      .then((foundPlayers) => {
        console.log("Num Players found:", foundPlayers.length);
        return res.status(200).json(foundPlayers);
      })
      .catch((err) => {
        console.error(
          "An error has occurred when trying to find all players.",
          err
        );
        return res.status(500).json({
          message: "There was an error when trying to find all players",
          error: err,
        });
      });
  },
  getPlayerById({ params }, res) {
    const id = params.id;
    Player.findById(id)
      .select("-__v")
      .then((foundPlayer) => {
        if (!foundPlayer) {
          return res.status(404).json({
            message: `Id: ${id} not found.`,
          });
        }
        return res.status(200).json({
          player: foundPlayer,
        });
      })
      .catch((err) => {
        console.log(
          "An error has happened! Usually this occurs when the query value was left blank."
        );
        return res.status(400).json({ error: err });
      });
  },
  getPlayerByEmail({ query }, res) {
    console.log(query);
    Player.findOne({ email: query.email })
      .select("-__v")
      .then((foundPlayer) => {
        if (!foundPlayer) {
          return res.status(404).json({
            message: `No player exists with the email '${query.email}'.`,
          });
        }
        return res.status(200).json({
          player: foundPlayer,
        });
      })
      .catch((err) => {
        console.log(
          "An error just hit you in the face with a bag of quarters! You are now prone."
        );
        return res.status(400).json({ error: err });
      });
  },
  loginPlayer(req, res) {
    const { email, password } = req.body;
    console.log(`Attempting to log in player '${email}'`);
    Player.findOne({ email })
      .select("-__v")
      .then((player) => {
        if (!player) {
          console.log(`No player exists with the email '${email}'.`);
          return res.status(404).json({
            message: `No player exists with the email '${email}'.`,
          });
        }

        // Compare provided password with the one in the database
        bcrypt.compare(password, player.password, (err, isMatch) => {
          if (err) {
            console.error(
              "An error just hit you with a gust of wind! Move back 30ft in the direction of the attack. Could not compare passwords.\n",
              err
            );
            return res.status(500).json(err);
          }

          if (!isMatch) {
            console.log("Invalid password provided for user:", email);
            return res.status(401).json({
              message: "Invalid password.",
            });
          }
          /* try {
            req.session.playerId = player._id;
          } catch (err) {
            console.log(err);
          } */

          console.log("Player logged in successfully!");
          return res.status(200).json({
            message: `Player '${player.playername}' logged in successfully`,
            player: { ...player.toObject(), password: undefined },
          });
        });
      })
      .catch((err) => {
        console.log(
          "An error covered you in cobwebs! You must make a strength check in order to break free."
        );
        return res.status(500).json({ error: err });
      });
  },
  logoutPlayer(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          message: "Logout failed",
          error: err,
        });
      }
      return res
        .status(200)
        .json({ message: "Player logged out successfully" });
    });
  },
  async updatePlayer(req, res) {
    console.log("Attempting to update player");
    const { tcgUserData } = req.body;
    console.log("tcgUserData:", tcgUserData);

    if (!tcgUserData) {
      console.log("No tcgUserData provided...\nFailed to update player");
      return res.status(400).json({ message: "No tcgUserData provided." });
    }

    const player = await getPlayerOfRequest(req);
    if (!player) {
      console.log("No player found in request");
      return res.status(400).json({ message: "No player found in request" });
    }

    const newPlayer = transformTCGUserToPlayerSchema(
      tcgUserData,
      player.password
    );

    let successfullyUpdatedPlayer = null;

    try {
      successfullyUpdatedPlayer = await Player.findOneAndUpdate(
        { email: player.email },
        newPlayer
      );
      console.log("successfullyUpdatedPlayer: ", successfullyUpdatedPlayer);
    } catch (err) {
      console.log(
        "An error has occurred in updating player with new one. Flag 01!"
      );
      return res.status(400).json({ error: err });
    }

    if (!successfullyUpdatedPlayer) {
      console.log(
        "An error has occurred in updating player with new one. Flag 02!"
      );
      return res.status(400).json({
        error: {
          message:
            "An error has occurred in updating player with new one. Flag 02!",
        },
      });
    }

    console.log("successfully updated player to", newPlayer);
    res.status(200).json({
      message: "Player updated successfully",
      player: newPlayer,
    });
  },
  addCardToUnlocked({ params, body }, res) {
    const id = params.id;
    Player.findById(id)
      .then((foundPlayer) => {
        const cardId = params.cardId || -1;
        const isUnlocked = Boolean(
          foundPlayer.unlockedCards.find((card) => card.id == cardId)
        );
        console.log(isUnlocked);
        if (!isUnlocked) {
          foundPlayer.unlockedCards.push({ id: cardId, count: 1 });
        } else {
          const cardIndex = foundPlayer.unlockedCards.findIndex(
            (card) => card.id == cardId
          );
          const originalCount = foundPlayer.unlockedCards[cardIndex].count;
          foundPlayer.unlockedCards[cardIndex].count = originalCount + 1;
          foundPlayer.markModified("unlockedCards");
        }
        return foundPlayer.save();
      })
      .then((updatedPlayer) => {
        return res.status(200).json({ player: updatedPlayer });
      })
      .catch((err) => {
        console.log("An error has occurred!");
        return res.status(400).json({ error: err });
      });
  },
  addCardToHand({ params, body }, res) {
    const id = params.id;
    Player.findById(id)
      .then((foundPlayer) => {
        const cardId = params.cardId || -1;

        const isUnlocked = Boolean(
          foundPlayer.unlockedCards.find((card) => card.id == cardId) &&
            foundPlayer.unlockedCards.find((card) => card.id == cardId).count >
              0
        );
        if (!isUnlocked) return { ERROR: "Card not unlocked!" };

        const isInHand = Boolean(
          foundPlayer.equippedHand.find((card) => card.id == cardId)
        );
        if (!isInHand) {
          foundPlayer.equippedHand.push({ id: cardId, count: 1 });
        } else {
          const cardIndexInHand = foundPlayer.equippedHand.findIndex(
            (card) => card.id == cardId
          );
          const cardIndexInUnlocked = foundPlayer.unlockedCards.findIndex(
            (card) => card.id == cardId
          );

          const originalCountInHand =
            foundPlayer.equippedHand[cardIndexInHand].count;
          const countInUnlocked =
            foundPlayer.unlockedCards[cardIndexInUnlocked].count;

          if (countInUnlocked - originalCountInHand < 0) {
            foundPlayer.equippedHand[cardIndexInHand].count = countInUnlocked;
            console.log(
              "You have equipped your entire collection of this card."
            );
          } else if (countInUnlocked - originalCountInHand == 0) {
            return { ERROR: "Out of this card." };
          } else {
            foundPlayer.equippedHand[cardIndexInHand].count =
              originalCountInHand + 1;
          }
          foundPlayer.markModified("equippedHand");
        }
        return foundPlayer.save();
      })
      .then((updatedPlayer) => {
        return res.status(200).json({ player: updatedPlayer });
      })
      .catch((err) => {
        console.log("An error has occurred!");
        return res.status(400).json({ error: err });
      });
  },
  removeCardFromHand({ params, body }, res) {
    const id = params.id;
    Player.findById(id)
      .then((foundPlayer) => {
        const cardId = params.cardId || -1;

        const isInHand = Boolean(
          foundPlayer.equippedHand.find((card) => card.id == cardId)
        );
        if (!isInHand) {
          return { ERROR: "This card is not in this players hand" };
        } else {
          const cardIndexInHand = foundPlayer.equippedHand.findIndex(
            (card) => card.id == cardId
          );
          const originalCountInHand =
            foundPlayer.equippedHand[cardIndexInHand].count;

          if (originalCountInHand > 0) {
            foundPlayer.equippedHand[cardIndexInHand].count =
              originalCountInHand - 1;
          }
          if (foundPlayer.equippedHand[cardIndexInHand].count == 0) {
            foundPlayer.equippedHand.splice(cardIndexInHand, 1);
          }
          foundPlayer.markModified("equippedHand");
        }
        return foundPlayer.save();
      })
      .then((updatedPlayer) => {
        return res.status(200).json({ player: updatedPlayer });
      })
      .catch((err) => {
        console.log("An error has occurred!");
        return res.status(400).json({ error: err });
      });
  },
  updateBalance({ params, body }, res) {
    const id = params.id;
    Player.findById(id)
      .then((foundPlayer) => {
        const isReplacing = body.adding || false; //indicates weather or not the balance should be set to new balance or if it should have the newBalance added to old one
        const currentBalance = foundPlayer.balance;
        const passedInBalance = body.newBalance;

        newBalance = !isReplacing
          ? currentBalance + passedInBalance
          : passedInBalance;
        return Player.findByIdAndUpdate(
          id,
          { balance: newBalance },
          { new: true }
        );
        // foundPlayer.balance = newBalance;
        // return foundPlayer.save();
      })
      .then((updatedPlayer) => {
        return res.status(200).json({ player: updatedPlayer });
      })
      .catch((err) => {
        console.log("An error has occurred during the player balance update!");
        return res.status(400).json({ error: err });
      });
  },
  // purchaseCard
};

function transformTCGUserToPlayerSchema(tcgUser, passwordHash) {
  const player = {
    email: tcgUser.email || tcgUser.username || tcgUser.id,
    password: passwordHash,
    displayName: tcgUser.username,
    scores: parseInt(tcgUser.victories),
    balance: tcgUser.coins,
    unlockedCards: tcgUser.cards,
    equippedHand: tcgUser.hand,
    packs: tcgUser.packs,
    decks: tcgUser.decks,
    rewards: tcgUser.rewards,
  };

  return player;
}

// Will get player document object from request that has
// Email and password in body
async function getPlayerOfRequest(req) {
  const { email, password, username, id } = req.body.tcgUserData || req.body;
  const effectiveEmail = email || username || id;
  if (!effectiveEmail || !password)
    return console.log("No email or password provided in request body");

  let playerObj = null;
  try {
    playerObj = await Player.findOne({ email: effectiveEmail })
      .select("-__v")
      .then();
  } catch (err) {
    console.log("Error when trying to find player by email");
    return null;
  }

  if (!playerObj)
    return console.log("No player found with email", effectiveEmail);

  // Compare provided password with the one in the database
  let isMatch = null;
  try {
    isMatch = await bcrypt.compare(password, playerObj.password).then();
  } catch (err) {
    console.log("Error when comparing passwords");
    return null;
  }

  if (!isMatch)
    return console.log("Invalid password provided for user:", effectiveEmail);

  return playerObj;
}

module.exports = playerController;
