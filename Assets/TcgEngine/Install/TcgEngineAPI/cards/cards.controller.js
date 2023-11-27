const CardModel = require('../cards/cards.model');
const Activity = require("../activity/activity.model");
const config = require('../config');

exports.AddCard = async(req, res) => 
{
    var tid = req.body.tid;
    var type = req.body.type;
    var team = req.body.team;
    var rarity = req.body.rarity || "";
    var mana = req.body.mana || 0;
    var attack = req.body.attack || 0;
    var hp = req.body.hp || 0;
    var cost = req.body.cost || 1;
    var packs = req.body.packs || [];

    if(!tid || typeof tid !== "string")
        return res.status(400).send({error: "Invalid parameters"});

    if(!type || typeof type !== "string")
        return res.status(400).send({error: "Invalid parameters"});

    if(!team || typeof team !== "string")
        return res.status(400).send({error: "Invalid parameters"});

    if(!rarity || typeof rarity !== "string")
        return res.status(400).send({error: "Invalid parameters"});

    if(!Number.isInteger(mana) || !Number.isInteger(attack) || !Number.isInteger(hp) || !Number.isInteger(cost))
        return res.status(400).send({ error: "Invalid parameters" });

    if(packs && !Array.isArray(packs))
        return res.status(400).send({error: "Invalid parameters"});

    var data = {
        tid: tid,
        type: type,
        team: team,
        rarity: rarity,
        mana: mana,
        attack: attack,
        hp: hp,
        cost: cost,
        packs: packs,
    }

    //Update or create
    var card = await CardModel.get(tid);
    if(card)
        card = await CardModel.update(card, data);
    else
        card = await CardModel.create(data);

    if(!card)
        return res.status(500).send({error: "Error updating card"});

    return res.status(200).send(data);
};

exports.DeleteCard = async(req, res) => 
{
    CardModel.remove(req.params.tid);
    return res.status(204).send({});
};

exports.DeleteAll = async(req, res) => 
{
    CardModel.removeAll();
    return res.status(204).send({});
};

exports.GetCard = async(req, res) => 
{
    var tid = req.params.tid;

    if(!tid)
        return res.status(400).send({error: "Invalid parameters"});

    var card = await CardModel.get(tid);
    if(!card)
        return res.status(404).send({error: "Card not found: " + tid});

    return res.status(200).send(card.toObj());
};

exports.GetAll = async(req, res) => 
{
    var cards = await CardModel.getAll();

    for(var i=0; i<cards.length; i++){
        cards[i] = cards[i].toObj();
    }

    return res.status(200).send(cards);
};


