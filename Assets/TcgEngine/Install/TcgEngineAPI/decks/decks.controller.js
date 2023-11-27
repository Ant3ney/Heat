const DeckModel = require('../decks/decks.model');
const Activity = require("../activity/activity.model");
const config = require('../config');

exports.AddDeck = async(req, res) => 
{
    var tid = req.body.tid;
    var title = req.body.title;
    var hero = req.body.hero;
    var cards = req.body.cards;

    if(!tid || typeof tid !== "string")
        return res.status(400).send({error: "Invalid parameters"});

    if(!title || typeof title !== "string")
        return res.status(400).send({error: "Invalid parameters"});

    if(!hero || typeof hero !== "object")
        return res.status(400).send({error: "Invalid parameters"});

    if(cards && !Array.isArray(cards))
        return res.status(400).send({error: "Invalid parameters"});

    var deck_data = {
        tid: tid,
        title: title,
        hero: hero,
        cards: cards || [],
    }

    //Update or create
    var deck = await DeckModel.get(tid);
    if(deck)
        deck = await DeckModel.update(deck, deck_data);
    else
        deck = await DeckModel.create(deck_data);

    if(!deck)
        res.status(500).send({error: "Error updating deck"});
    
    return res.status(200).send(deck);
};

exports.DeleteDeck = async(req, res) => {
    DeckModel.remove(req.params.tid);
    return res.status(204).send({});
};

exports.DeleteAll = async(req, res) => {
    DeckModel.removeAll();
    return res.status(204).send({});
};

exports.GetDeck = async(req, res) => 
{
    var deckId = req.params.tid;

    if(!deckId)
        return res.status(400).send({error: "Invalid parameters"});

    var deck = await DeckModel.get(deckId);
    if(!deck)
        return res.status(404).send({error: "Deck not found: " + deckId});

    return res.status(200).send(deck.toObj());
};


exports.GetAll = async(req, res) => 
{
    var decks = await DeckModel.getAll();
    return res.status(200).send(decks);
};


