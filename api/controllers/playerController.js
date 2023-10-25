const { ObjectId } = require("mongodb");
const Player = require("../models/Player");

const bcrypt = require("bcrypt");

const playerController = {
  createPlayer({ body }, res) {
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
        return res.status(200).json({ deletedPlayer : deletedPlayer})
      else
        return res.status(404).json({ message: `Player with id ${id} not found.`})
    })
    .catch((err) => {
      console.log("Something went wrong when deleting a player");
      return res.status(400).json(err);
    })
  },
  findAllPlayers({ body }, res) {
    Player.find()
        .then(foundPlayers => {
            return res.status(200).json({ players: foundPlayers})
        })
        .catch(err => {
            return res.status(500).json({ message: 'There was an error when trying to find all players', error: err});
        })
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
      return res.status(400).json({error: err})
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
        return res.status(400).json({error: err});
      });
  },
  loginPlayer(req, res) {
    const { email, password } = req.body;
    Player.findOne({ email })
    .select("-__v")
      .then((player) => {
        if (!player) {
          return res.status(404).json({
            message: `No player exists with the email '${email}'.`,
          });
        }

        // Compare provided password with the one in the database
        bcrypt.compare(password, player.password, (err, isMatch) => {
          if (err) {
            console.log(
              "An error just hit you with a gust of wind! Move back 30ft in the direction of the attack."
            );
            return res.status(500).json(err);
          }

          if (!isMatch) {
            return res.status(401).json({
              message: "Invalid password.",
            });
          }

          req.session.playerId = player._id;
          return res.status(200).json({
            message: `Player '${player.playername}' logged in successfully`,
            player: { ...player.toObject(), password: undefined }
          });
        });
      })
      .catch((err) => {
        console.log(
          "An error covered you in cobwebs! You must make a strength check in order to break free."
        );
        return res.status(500).json({error: err});
      });
  },
  logoutPlayer(req, res) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ 
          message: 'Logout failed',
          error: err
        });
      }
      return res.status(200).json({ message: 'Player logged out successfully' });
    })
  },
  addCardToUnlocked({ params, body }, res) {
    const id = params.id;
    Player.findById(id)
    .then((foundPlayer) => {
      const cardId = params.cardId || -1;
      const isUnlocked = Boolean(foundPlayer.unlockedCards.find(card => card.id == cardId));
      console.log(isUnlocked);
      if (!isUnlocked) {
        foundPlayer.unlockedCards.push({ id: cardId, count: 1});
      }
      else {
        const cardIndex = foundPlayer.unlockedCards.findIndex(card => card.id == cardId);
        const originalCount = foundPlayer.unlockedCards[cardIndex].count; 
        foundPlayer.unlockedCards[cardIndex].count = (originalCount + 1);
        foundPlayer.markModified("unlockedCards");
      }
      return foundPlayer.save();
    })
    .then((updatedPlayer) => {
      return res.status(200).json({player: updatedPlayer});
    })
    .catch((err) => {
      console.log(
        "An error has occurred!"
      );
      return res.status(400).json({error: err})
    });
  },
  addCardToHand({ params, body }, res) {
    const id = params.id;
    Player.findById(id)
    .then((foundPlayer) => {
      const cardId = params.cardId || -1;
      
      const isUnlocked = Boolean(foundPlayer.unlockedCards.find(card => card.id == cardId) && (foundPlayer.unlockedCards.find(card => card.id == cardId).count > 0));
      if (!isUnlocked) return {ERROR: "Card not unlocked!"};
      
      const isInHand = Boolean(foundPlayer.equippedHand.find(card => card.id == cardId));
      if (!isInHand) {
        foundPlayer.equippedHand.push({ id: cardId, count: 1});
      }
      else {
        const cardIndexInHand = foundPlayer.equippedHand.findIndex(card => card.id == cardId);
        const cardIndexInUnlocked = foundPlayer.unlockedCards.findIndex(card => card.id == cardId);

        const originalCountInHand = foundPlayer.equippedHand[cardIndexInHand].count;
        const countInUnlocked = foundPlayer.unlockedCards[cardIndexInUnlocked].count;

        if (countInUnlocked - originalCountInHand < 0) {
          foundPlayer.equippedHand[cardIndexInHand].count = countInUnlocked;
          console.log("You have equipped your entire collection of this card.")
        }
        else if (countInUnlocked - originalCountInHand == 0) {
          return {ERROR: "Out of this card."};
        }
        else {
          foundPlayer.equippedHand[cardIndexInHand].count = (originalCountInHand + 1);
        }
        foundPlayer.markModified("equippedHand");
      }
      return foundPlayer.save();
    })
    .then((updatedPlayer) => {
      return res.status(200).json({player: updatedPlayer});
    })
    .catch((err) => {
      console.log(
        "An error has occurred!"
      );
      return res.status(400).json({error: err});
    });
  },
  removeCardFromHand({ params, body }, res) {
    const id = params.id;
    Player.findById(id)
    .then((foundPlayer) => {
      const cardId = params.cardId || -1;
      
      const isInHand = Boolean(foundPlayer.equippedHand.find(card => card.id == cardId));
      if (!isInHand) {
        return {ERROR: "This card is not in this players hand"};
      }
      else {
        const cardIndexInHand = foundPlayer.equippedHand.findIndex(card => card.id == cardId);
        const originalCountInHand = foundPlayer.equippedHand[cardIndexInHand].count;

        if (originalCountInHand > 0) {
          foundPlayer.equippedHand[cardIndexInHand].count = originalCountInHand - 1;
        }
        if (foundPlayer.equippedHand[cardIndexInHand].count == 0) {
          foundPlayer.equippedHand.splice(cardIndexInHand, 1);
        }
        foundPlayer.markModified("equippedHand");
      }
      return foundPlayer.save();
    })
    .then((updatedPlayer) => {
      return res.status(200).json({player: updatedPlayer});
    })
    .catch((err) => {
      console.log(
        "An error has occurred!"
      );
      return res.status(400).json({error: err});
    });
  },
  updateBalance({ params, body }, res) {
    const id = params.id;
    Player.findById(id)
    .then((foundPlayer) => {
      const isReplacing = body.adding || false; //indicates weather or not the balance should be set to new balance or if it should have the newBalance added to old one
      const currentBalance = foundPlayer.balance;
      const passedInBalance = body.newBalance;
      
      newBalance = !isReplacing ? currentBalance + passedInBalance : passedInBalance;
      return Player.findByIdAndUpdate(id, { balance: newBalance }, { new: true });
      // foundPlayer.balance = newBalance;
      // return foundPlayer.save();
    })
    .then((updatedPlayer) => {
      return res.status(200).json({player: updatedPlayer});
    })
    .catch((err) => {
      console.log("An error has occurred during the player balance update!");
      return res.status(400).json({error: err});
    })
  }
  // purchaseCard
};

module.exports = playerController;
