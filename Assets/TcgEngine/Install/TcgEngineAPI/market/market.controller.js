const UserModel = require('../users/users.model');
const MarketModel = require('./market.model');
const UserTool = require('../users/users.tool');
const DateTool = require('../tools/date.tool');
const Activity = require("../activity/activity.model");
const config = require('../config');

exports.addOffer = async(req, res) => {

    var username = req.jwt.username;
    var card_tid = req.body.card;
    var variant = req.body.variant;
    var quantity = req.body.quantity;
    var price = req.body.price;

    //Validate params
    if (!username || !card_tid || !variant || !quantity || !price)
        return res.status(400).send({ error: "Invalid parameters" });

    if(typeof username !== "string"|| typeof quantity !== "number" || typeof price !== "number" || typeof card_tid !== "string" || typeof variant !== "string" )
        return res.status(400).send({ error: "Invalid parameters" });

    if(!Number.isInteger(quantity) || !Number.isInteger(price) || price <= 0 || quantity <= 0)
        return res.status(400).send({ error: "Invalid parameters" });

    //Get user
    var user = await UserModel.getByUsername(username);
    if (!user)
        return res.status(404).send({ error: "Can't find user " + username });

    if(!UserTool.hasCard(user, card_tid, variant, quantity))
        return res.status(400).send({ error: "You don't have those cards!" });

    //Offer
    var offer = {
        seller: username,
        card: card_tid,
        variant: variant,
        quantity: quantity,
        price: price,
    }    

    //Remove card from user
    var removeCards = [{tid: card_tid, variant: variant, quantity: -quantity}];
    var addSucc = UserTool.addCards(user, removeCards);
    if(!addSucc)
        return res.status(500).send({ error: "Error removing cards from user " + username });

    //Update database
    var uOffer = await MarketModel.add(username, card_tid, variant, offer);
    var uUser = await UserModel.update(user, { cards: user.cards, });

    if(!uUser || !uOffer)
        return res.status(500).send({ error: "Error creating market offer " + username });

    //Activity
    //var act = await Activity.LogActivity("market_add", req.jwt.username, uOffer.toObj());
    //if (!act) return res.status(500).send({ error: "Failed to log activity!" });
        
    return res.status(200).send(uOffer.toObj());
};

exports.removeOffer = async(req, res) => {

    var username = req.jwt.username;
    var card_tid = req.body.card;
    var variant = req.body.variant;

    //Validate params
    if (!username || !card_tid || !variant)
        return res.status(400).send({ error: "Invalid parameters" });

    if(typeof username !== "string"|| typeof card_tid !== "string" || typeof variant !== "string" )
        return res.status(400).send({ error: "Invalid parameters" });

    var user = await UserModel.getByUsername(username);
    if (!user)
        return res.status(404).send({ error: "Can't find user " + username });

    var offer = await MarketModel.getOffer(username, card_tid, variant)
    if (!offer)
        return res.status(404).send({ error: "No market offer for " + username + " " + card_tid });

    //Add cards user
    var addCards = [{tid: card_tid, variant: variant, quantity: offer.quantity}];
    var addSucc = UserTool.addCards(user, addCards);
    if(!addSucc)
        return res.status(500).send({ error: "Error adding cards to user " + username });

    //Update database
    var uUser = await UserModel.update(user, { cards: user.cards });
    var uOffer = await MarketModel.remove(username, card_tid, variant);

    if(!uUser || !uOffer)
        return res.status(500).send({ error: "Error removing market offer " + username });

    //Activity
    //var act = await Activity.LogActivity("market_remove", req.jwt.username, {});
    //if (!act) return res.status(500).send({ error: "Failed to log activity!" });
        
    return res.status(200).send({success: uOffer});
};

exports.trade = async(req, res) => {

    var username = req.jwt.username;
    var seller_user = req.body.seller;
    var card_tid = req.body.card;
    var variant = req.body.variant;
    var quantity = req.body.quantity;

    //Validate params
    if (!username || !seller_user || !card_tid || !variant || !quantity)
        return res.status(400).send({ error: "Invalid parameters" });

    if(typeof seller_user !== "string" || typeof card_tid !== "string" || typeof variant !== "string" || typeof quantity !== "number")
        return res.status(400).send({ error: "Invalid parameters" });

    if(!Number.isInteger(quantity) || quantity <= 0)
        return res.status(400).send({ error: "Invalid parameters" });

    //Get user
    var user = await UserModel.getByUsername(username);
    var seller = await UserModel.getByUsername(seller_user);
    if (!user || !seller)
        return res.status(404).send({ error: "Can't find user " + username + " or " + seller_user });

    if(user.id == seller.id)
        return res.status(403).send({ error: "Can't trade with yourself!" });

    //Get offer
    var offer = await MarketModel.getOffer(seller_user, card_tid, variant)
    if (!offer)
        return res.status(404).send({ error: "No market offer for " + seller_user + " " + card_tid });

    var value = quantity * offer.price;
    if(user.coins < value)
        return res.status(403).send({ error: "Not enough coins to trade!" });
    if(quantity > offer.quantity)
        return res.status(403).send({ error: "Not enough cards to trade!" });
    
    //Add cards and coins
    var addCards = [{tid: card_tid, variant: variant, quantity: quantity}];
    var addSucc = UserTool.addCards(user, addCards);
    if(!addSucc)
        return res.status(500).send({ error: "Error adding cards to user " + username });
        
    user.coins -= value;
    seller.coins += value;

    //Update database
    var uUser = await UserModel.update(user, { coins: user.coins, cards: user.cards });
    var uSeller = await UserModel.update(seller, { coins: seller.coins });
    var uOffer = await MarketModel.reduce(seller_user, card_tid, variant, quantity);
    if(!uUser || !uOffer || !uSeller)
        return res.status(500).send({ error: "Error trading market offer " + username + " " + seller_user });

    //Activity
    var aData = {buyer: username, seller: seller_user, card: card_tid, quantity: quantity, price: offer.price };
    var act = await Activity.LogActivity("market_trade", req.jwt.username, aData);
    if (!act) return res.status(500).send({ error: "Failed to log activity!" });

    return res.status(200).send(aData);
};

exports.getBySeller = async(req, res) => {

    if(!req.params.username)
        return res.status(400).send({ error: "Invalid parameters" });

    var list = await MarketModel.getBySeller(req.params.username);
    for(var i=0; i<list.length; i++){
        list[i] = list[i].toObj();
    }
    return res.status(200).send(list);
};

exports.getByCard = async(req, res) => {

    var tid = req.params.tid;
    var variant = req.params.variant;

    if(!tid || !variant)
        return res.status(400).send({ error: "Invalid parameters" });

    var list = await MarketModel.getByCard(tid, variant);
    for(var i=0; i<list.length; i++){
        list[i] = list[i].toObj();
    }
    return res.status(200).send(list);
};

exports.getOffer = async(req, res) => {
    
    var tid = req.params.tid;
    var variant = req.params.variant;
    var username = req.params.username;

    if(!tid || !variant || !username)
        return res.status(400).send({ error: "Invalid parameters" });

    var offer = await MarketModel.getOffer(username, tid, variant);
    if(!offer)
        return res.status(404).send({ error: "Offer not found" });

    return res.status(200).send(offer.toObj());
};

exports.getAll = async(req, res) => {
    var list = await MarketModel.getAll();
    for(var i=0; i<list.length; i++){
        list[i] = list[i].toObj();
    }
    return res.status(200).send(list);
};
