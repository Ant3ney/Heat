const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const deckSchema = new Schema({

    tid: { type: String, index: true, unique: true, default: "" },
    title: { type: String, default: "" },
    hero: {tid: String, variant: String, _id: false},
    cards: [{tid: String, variant: String, quantity: Number, _id: false}],

});

deckSchema.methods.toObj = function() {
    var deck = this.toObject();
    delete deck.__v;
    delete deck._id;
    return deck;
};

const Deck = mongoose.model('Decks', deckSchema);

exports.get = async(deckId) => {
    try{
        var deck = await Deck.findOne({tid: deckId});
        return deck;
    }
    catch{
        return null;
    }
};

exports.getList = async(decks_tids) => {
    try{
        var decks = await Deck.find({tid: { $in: decks_tids } });
        return decks || [];
    }
    catch{
        return [];
    }
};

exports.getAll = async() => {

    try{
        var decks = await Deck.find()
        return decks || [];
    }
    catch{
        return [];
    }
};

exports.create = async(data) => {
    try{
        var deck = new Deck(data);
        return await deck.save();
    }
    catch{
        return null;
    }
};

exports.update = async(deck, data) => {

    try{
        if(!deck) return null;

        for (let i in data) {
            deck[i] = data[i];
            deck.markModified(i);
        }

        var updated = await deck.save();
        return updated;
    }
    catch{
        return null;
    }
};

exports.remove = async(deckId) => {
    try{
        var result = await Deck.deleteOne({tid: deckId});
        return result && result.deletedCount > 0;
    }
    catch{
        return false;
    }
};

exports.removeAll = async() => {
    try{
        var result = await Deck.deleteMany({});
        return result && result.deletedCount > 0;
    }
    catch{
        return false;
    }
};
