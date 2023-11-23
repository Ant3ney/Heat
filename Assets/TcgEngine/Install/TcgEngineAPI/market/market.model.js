const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const marketSchema = new Schema({

    seller: {type: String, index: true},
    card: {type: String, index: true},
    variant: {type: String},
    quantity: {type: Number},
    price: {type: Number},
    time: {type: Date},

});

marketSchema.methods.toObj = function() {
    var offer = this.toObject();
    delete offer.__v;
    delete offer._id;
    return offer;
};

const Market = mongoose.model('Markets', marketSchema);

// Market DATA MODELS ------------------------------------------------

exports.getOffer = async(user, card_tid, variant_id) => {

    try{
        var regex = new RegExp(["^", user, "$"].join(""), "i");
        var offer = await  Market.findOne({seller: regex, card: card_tid, variant: variant_id});
        return offer;
    }
    catch{
        return null;
    }
};

exports.getBySeller = async(user) => {

    try{
        var regex = new RegExp(["^", user, "$"].join(""), "i");
        var offers = await  Market.find({seller: regex});
        offers = offers || [];
        return offers;
    }
    catch{
        return [];
    }
};

exports.getByCard = async(card_tid, variant_id) => {

    try{
        var offers = await  Market.find({card: card_tid, variant: variant_id});
        offers = offers || [];
        return offers;
    }
    catch{
        return [];
    }
};

exports.getAll = async() => {

    try{
        var offers = await Market.find()
        offers = offers || [];
        return offers;
    }
    catch{
        return [];
    }
};

exports.getAllLimit = async(perPage, page) => {

    try{
        var offers = await Market.find().limit(perPage).skip(perPage * page)
        offers = offers || [];
        return offers;
    }
    catch{
        return [];
    }
};

exports.add = async(user, card, variant, data) => {

    try{
        var offer = await Market.findOne({seller: user, card: card, variant: variant});

        if(!offer)
        {
            offer = new Market(data);
            offer.date = Date.now();
            return await offer.save();
        }
        else
        {
            offer.quantity += data.quantity;
            offer.price = data.price;
            offer.date = Date.now();
    
            var updated = await offer.save();
            return updated;
        }
    }
    catch{
        return null;
    }
};


exports.reduce = async(user, card, variant, quantity) => {

    try{
        var offer = await Market.findOne({seller: user, card: card, variant: variant});
        if(offer)
        {
            offer.quantity -= quantity;
            if(offer.quantity > 0)
            {
                var updated = await offer.save();
                return updated;
            }
            else{
                var result = await Market.deleteOne({seller: user, card: card});
                return result && result.deletedCount > 0;
            }
        }
    }
    catch{
        return null;
    }
};

exports.remove = async(user, card, variant) => {

    try{
        var result = await Market.deleteOne({seller: user, card: card, variant: variant});
        return result && result.deletedCount > 0;
    }
    catch{
        return false;
    }
};
