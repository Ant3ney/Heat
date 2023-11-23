const UserModel = require("./users.model");
const PackModel = require("../packs/packs.model");
const CardModel = require("../cards/cards.model");
const VariantModel = require('../variants/variants.model');
const UserTool = require("./users.tool");
const CardTool = require("../cards/cards.tool");
const Activity = require("../activity/activity.model");
const config = require('../config');

exports.UpdateDeck = async(req, res) => {

    if(!req.params.deckId)
        return res.status(400).send({error: "Invalid parameters"});

    var userId = req.jwt.userId;
    var deckId = req.params.deckId;

    var ndeck = {
        tid: req.params.deckId,
        title: req.body.title || "Deck",
        hero: req.body.hero || {},
        cards: req.body.cards || [],
    };

    var user = await UserModel.getById(userId);
    if(!user)
      return res.status(404).send({error: "User not found: " + userId});

    var decks = user.decks || [];
    var found = false;
    var index = 0;
    for(var i=0; i<decks.length; i++){
      var deck = decks[i];
      if(deck.tid == deckId)
      {
         decks[i]= ndeck;
         found = true;
         index = i;
      }
    }

    //Add new
    if(!found && ndeck.cards.length > 0)
      decks.push(ndeck);

    //Delete deck
    if(found && ndeck.cards.length == 0)
      decks.splice(index, 1);

    var userData = { decks: decks};
    var upUser = await UserModel.update(user, userData);
    if (!upUser) return res.status(500).send({ error: "Error updating user: " + userId });

    return res.status(200).send(upUser.decks);
};

exports.DeleteDeck = async(req, res) => {

    if(!req.params.deckId)
        return res.status(400).send({error: "Invalid parameters"});

    var userId = req.jwt.userId;
    var deckId = req.params.deckId;

    var user = await UserModel.getById(userId);
    if(!user)
        return res.status(404).send({error: "User not found: " + userId});

    var decks = user.decks || {};
    var index = -1;
    for(var i=0; i<decks.length; i++){
      var deck = decks[i];
      if(deck.tid == deckId)
      {
        index = i;
      }
    }
    
    if(index >= 0)
      decks.splice(index, 1);

    var userData = { decks: decks};
    var upUser = await UserModel.update(user, userData);
    if (!upUser) return res.status(500).send({ error: "Error updating user: " + userId });

    return res.status(200).send(upUser.decks);
};

exports.BuyCard = async (req, res) => {
  
  const userId = req.jwt.userId;
  const cardId = req.body.card;
  const variantId = req.body.variant;
  const quantity = req.body.quantity || 1;

  if (!cardId || typeof cardId !== "string")
      return res.status(400).send({ error: "Invalid parameters" });

  if(!variantId || typeof variantId !== "string")
      return res.status(400).send({ error: "Invalid parameters" });

  if(!Number.isInteger(quantity) || quantity <= 0)
      return res.status(400).send({ error: "Invalid parameters" });

  //Get the user add update the array
  var user = await UserModel.getById(userId);
  if (!user)
    return res.status(404).send({ error: "Cant find user " + userId });

  var card = await CardModel.get(cardId);
  if (!card)
    return res.status(404).send({ error: "Cant find card " + cardId });

  if(card.cost <= 0)
    return res.status(400).send({ error: "Can't be purchased" });
    
  var variant = await VariantModel.get(variantId);
  var factor = variant != null ? variant.cost_factor : 1;
  var cost = quantity * factor * card.cost;
  if(user.coins < cost)
    return res.status(400).send({ error: "Not enough coins" });

  user.coins -= cost;

  var valid = await UserTool.addCards(user, [{tid: cardId, variant: variantId, quantity: quantity}]);
  if (!valid)
    return res.status(500).send({ error: "Error when adding cards" });

  //Update the user array
  var updatedUser = await UserModel.save(user, ["coins", "cards"]);
  if (!updatedUser) return res.status(500).send({ error: "Error updating user: " + userId });

  // Activity Log -------------
  const activityData =  {card: cardId, variant: variantId, quantity: quantity};
  const act = await Activity.LogActivity("user_buy_card", req.jwt.username, activityData);
  if (!act) return res.status(500).send({ error: "Failed to log activity!!" });

  // -------------
  return res.status(200).send();

};

exports.SellCard = async (req, res) => {
  
  const userId = req.jwt.userId;
  const cardId = req.body.card;
  const variantId = req.body.variant;
  const quantity = req.body.quantity || 1;

  if (!cardId || typeof cardId !== "string")
      return res.status(400).send({ error: "Invalid parameters" });

  if(!variantId || typeof variantId !== "string")
    return res.status(400).send({ error: "Invalid parameters" });

  if(!Number.isInteger(quantity) || quantity <= 0)
      return res.status(400).send({ error: "Invalid parameters" });

  //Get the user add update the array
  var user = await UserModel.getById(userId);
  if (!user)
    return res.status(404).send({ error: "Cant find user " + userId });
  
  var card = await CardModel.get(cardId);
  if (!card)
    return res.status(404).send({ error: "Cant find card " + cardId });

  if(card.cost <= 0)
    return res.status(400).send({ error: "Can't be sold" });

  var variant = await VariantModel.get(variantId);

  if(!UserTool.hasCard(user, cardId, variantId, quantity))
    return res.status(400).send({ error: "Not enough cards" });

  var factor = variant != null ? variant.cost_factor : 1;
  var cost = quantity * Math.round(card.cost * factor * config.sell_ratio);
  user.coins += cost;

  var valid = await UserTool.addCards(user, [{tid: cardId, variant: variantId, quantity: -quantity}]);
  if (!valid)
    return res.status(500).send({ error: "Error when removing cards" });

  //Update the user array
  var updatedUser = await UserModel.save(user, ["coins", "cards"]);
  if (!updatedUser) return res.status(500).send({ error: "Error updating user: " + userId });

  // Activity Log -------------
  const activityData =  {card: cardId, variant: variantId, quantity: quantity};
  const act = await Activity.LogActivity("user_sell_card", req.jwt.username, activityData);
  if (!act) return res.status(500).send({ error: "Failed to log activity!!" });

  // -------------
  return res.status(200).send();
};

exports.BuyPack = async (req, res) => {
  
  const userId = req.jwt.userId;
  const packId = req.body.pack;
  const quantity = req.body.quantity || 1;

  if (!packId || typeof packId !== "string")
      return res.status(400).send({ error: "Invalid parameters" });

  if(!Number.isInteger(quantity) || quantity <= 0)
      return res.status(400).send({ error: "Invalid parameters" });

  //Get the user add update the array
  var user = await UserModel.getById(userId);
  if (!user)
    return res.status(404).send({ error: "Cant find user " + userId });

  var pack = await PackModel.get(packId);
  if (!pack)
    return res.status(404).send({ error: "Cant find pack " + packId });

  if(pack.cost <= 0)
    return res.status(400).send({ error: "Can't be purchased" });

  var cost = quantity * pack.cost;
  if(user.coins < cost)
    return res.status(400).send({ error: "Not enough coins" });

  user.coins -= cost;

  var valid = await UserTool.addPacks(user, [{tid: packId, quantity: quantity}]);
  if (!valid)
    return res.status(500).send({ error: "Error when adding packs" });

  //Update the user array
  var updatedUser = await UserModel.save(user, ["coins", "packs"]);
  if (!updatedUser) return res.status(500).send({ error: "Error updating user: " + userId });

  // Activity Log -------------
  const activityData =  {pack: packId, quantity: quantity};
  const act = await Activity.LogActivity("user_buy_pack", req.jwt.username, activityData);
  if (!act) return res.status(500).send({ error: "Failed to log activity!!" });

  // -------------
  return res.status(200).send();

};

exports.SellPack = async (req, res) => {
  
  const userId = req.jwt.userId;
  const packId = req.body.pack;
  const quantity = req.body.quantity || 1;

  if (!packId || typeof packId !== "string")
      return res.status(400).send({ error: "Invalid parameters" });

  if(!Number.isInteger(quantity) || quantity <= 0)
      return res.status(400).send({ error: "Invalid parameters" });

  //Get the user add update the array
  var user = await UserModel.getById(userId);
  if (!user)
    return res.status(404).send({ error: "Cant find user " + userId });

  var pack = await PackModel.get(packId);
  if (!pack)
    return res.status(404).send({ error: "Cant find pack " + packId });

  if(pack.cost <= 0)
    return res.status(400).send({ error: "Can't be sold" });

  if(!UserTool.hasPack(user, packId, quantity))
    return res.status(400).send({ error: "Not enough coins" });

  var cost = quantity * Math.round(pack.cost * config.sell_ratio);
  user.coins += cost;

  var valid = await UserTool.addPacks(user, [{tid: packId, quantity: -quantity}]);
  if (!valid)
    return res.status(500).send({ error: "Error when adding packs" });

  //Update the user array
  var updatedUser = await UserModel.save(user, ["coins", "packs"]);
  if (!updatedUser) return res.status(500).send({ error: "Error updating user: " + userId });

  // Activity Log -------------
  const activityData =  {pack: packId, quantity: quantity};
  const act = await Activity.LogActivity("user_sell_pack", req.jwt.username, activityData);
  if (!act) return res.status(500).send({ error: "Failed to log activity!!" });

  // -------------
  return res.status(200).send();

};

exports.OpenPack = async (req, res) => {
  
  const userId = req.jwt.userId;
  const packId = req.body.pack;

  if (!packId || typeof packId !== "string")
      return res.status(400).send({ error: "Invalid parameters" });

  //Get the user add update the array
  var user = await UserModel.getById(userId);
  if (!user)
    return res.status(404).send({ error: "Cant find user " + userId });

  var pack = await PackModel.get(packId);
  if (!pack)
    return res.status(404).send({ error: "Cant find pack " + packId });

  if(!UserTool.hasPack(user, packId, 1))
    return res.status(400).send({ error: "You don't have this pack" });

  var cardsToAdd = await CardTool.getPackCards(pack);
  var validCards = await UserTool.addCards(user, cardsToAdd);
  var validPacks = await UserTool.addPacks(user, [{tid: packId, quantity: -1}]);
  
  if (!validCards || !validPacks)
    return res.status(500).send({ error: "Error when adding cards" });

  //Update the user array
  var updatedUser = await UserModel.save(user, ["cards", "packs"]);
  if (!updatedUser) return res.status(500).send({ error: "Error updating user: " + userId });

  // Activity Log -------------
  const activityData =  {pack: packId, cards: cardsToAdd};
  const act = await Activity.LogActivity("user_open_pack", req.jwt.username, activityData);
  if (!act) return res.status(500).send({ error: "Failed to log activity!!" });

  // -------------
  return res.status(200).send(cardsToAdd);

};

//Fix variant from previous version
exports.FixVariants = async (req, res) =>
{
  var from = req.body.from || "";
  var to = req.body.to || "";

  if (from && typeof packId !== "string")
    return res.status(400).send({ error: "Invalid parameters" });
  if (to && typeof packId !== "string")
    return res.status(400).send({ error: "Invalid parameters" });

  var users = await UserModel.getAll();
  var default_variant = await VariantModel.getDefault();
  var default_tid = default_variant ? default_variant.tid : "";
  var count = 0;

  for(var u=0; u<users.length; u++)
  {
    var user = users[u];
    var changed = false;
    for(var i=0; i<user.cards.length; i++)
    {
      var card = user.cards[i];
      if(!card.variant)
      {
        card.variant = default_tid;
        changed = true;
      }
      if(from && to && card.variant == from)
      {
        card.variant = to;
        changed = true;
      }
    }

    if(changed)
    {
      var new_cards = user.cards;
      user.cards = [];
      await UserTool.addCards(user, new_cards);  //Re-add in correct format
      UserModel.save(user, ["cards"]);
      count++;
    }
  }

  // Activity Log -------------
  const act = await Activity.LogActivity("fix_variants", req.jwt.username, {});
  if (!act) return res.status(500).send({ error: "Failed to log activity!!" });

  return res.status(200).send({updated: count});
}