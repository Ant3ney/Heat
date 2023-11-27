const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rewardSchema = new Schema({

    tid: { type: String, index: true, unique: true, default: "" },
    group: { type: String, index: true, default: "" },
    repeat: { type : Boolean, default: false },         //If true, can be gained multiple times but only server/admin can grant it
    
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    cards: [{type: String}],
    packs: [{type: String}],
    decks: [{type: String}],
    avatars: [{type: String}],
    cardbacks: [{type: String}],

});

rewardSchema.methods.toObj = function() {
    var reward = this.toObject();
    delete reward.__v;
    delete reward._id;
    return reward;
};

const Reward = mongoose.model('Rewards', rewardSchema);

exports.get = async(rewardId) => {
    try{
        var reward = await Reward.findOne({tid: rewardId});
        return reward;
    }
    catch{
        return null;
    }
};

exports.getGroup = async(group) => {

    try{
        var rewards = await Reward.find({group: group})
        return rewards || [];
    }
    catch{
        return [];
    }
};

exports.getAll = async() => {

    try{
        var rewards = await Reward.find()
        return rewards || [];
    }
    catch{
        return [];
    }
};

exports.create = async(data) => {
    try{
        var reward = new Reward(data);
        return await reward.save();
    }
    catch{
        return null;
    }
};

exports.update = async(reward, data) => {

    try{
        if(!reward) return null;

        for (let i in data) {
            reward[i] = data[i];
            reward.markModified(i);
        }

        var updated = await reward.save();
        return updated;
    }
    catch{
        return null;
    }
};

exports.remove = async(rewardId) => {
    try{
        var result = await Reward.deleteOne({tid: rewardId});
        return result && result.deletedCount > 0;
    }
    catch{
        return false;
    }
};

exports.removeAll = async() => {
    try{
        var result = await Reward.deleteMany({});
        return result && result.deletedCount > 0;
    }
    catch{
        return false;
    }
  };
