const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cardsSchema = new Schema({

    tid: { type: String, index: true, unique: true, default: "" },
    type: { type: String, default: "" },
    team: { type: String, default: "" },
    rarity: {type: String, default: ""},
    mana: {type: Number, default: 0},
    attack: {type: Number, default: 0},
    hp: {type: Number, default: 0},
    cost: {type: Number, default: 0},

    packs: [{type: String}],  //Card is available in those packs
});

cardsSchema.methods.toObj = function() {
    var card = this.toObject();
    delete card.__v;
    delete card._id;
    return card;
};

const Card = mongoose.model('Cards', cardsSchema);

exports.get = async(tid) => {
    try{
        var card = await Card.findOne({tid: tid});
        return card;
    }
    catch{
        return null;
    }
};

exports.getAll = async(filter) => {

    try{
        filter = filter || {};
        var cards = await Card.find(filter);
        return cards || [];
    }
    catch{
        return [];
    }
};

exports.getByPack = async(packId, filter) => {

    try{
        filter = filter || {};
        if(packId)
        {
            filter.packs = {$in:[packId]};
        }
        var cards = await Card.find(filter);
        return cards || [];
    }
    catch{
        return [];
    }
};

exports.create = async(data) => {
    try{
        var card = new Card(data);
        return await card.save();
    }
    catch{
        return null;
    }
};

exports.update = async(card, data) => {

    try{
        if(!card) return null;

        for (let i in data) {
            card[i] = data[i];
            card.markModified(i);
        }

        var updated = await card.save();
        return updated;
    }
    catch{
        return null;
    }
};

exports.remove = async(tid) => {
    try{
        var result = await Card.deleteOne({tid: tid});
        return result && result.deletedCount > 0;
    }
    catch{
        return false;
    }
};

exports.removeAll = async() => {
    try{
        var result = await Card.deleteMany({});
        return result && result.deletedCount > 0;
    }
    catch{
        return false;
    }
};