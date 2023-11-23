const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const matchSchema = new Schema({

    tid: { type: String, index: true, default: "" },
    players: [{type: String, default: []}],
    winner: {type: String, default: ""},
    completed: {type: Boolean, default: false},
    ranked: {type: Boolean, default: false},
    mode: { type: String, default: "" },

    start: {type: Date, default: null},
    end: {type: Date, default: null},
    
    udata: [{ type: Object, _id: false }],
});

matchSchema.methods.toObj = function() {
    var match = this.toObject();
    delete match.__v;
    delete match._id;
    return match;
};

const Match = mongoose.model('Matches', matchSchema);

exports.get = async(matchId) => {
    try{
        var match = await Match.findOne({tid: matchId});
        return match;
    }
    catch{
        return null;
    }
};

exports.getAll = async() => {

    try{
        var matches = await Match.find()
        return matches || [];
    }
    catch{
        return [];
    }
};

exports.create = async(matchData) => {
    const match = new Match(matchData);
    return await match.save();
};

exports.list = async(startTime, endTime, winnerId, completed) => {

    startTime = startTime || new Date(-8640000000000000);
    endTime = endTime || new Date(8640000000000000);

    var options = {};
    
    if(startTime && endTime)
        options.end = { $gte: startTime, $lte: endTime };

    if(winnerId)
        options.players = winnerId;
        
    if(completed)
        options.completed = true;

    try{
        var matches = await Match.find(options)
        return matches || [];
    }
    catch{
        return [];
    }
};

exports.remove = async(matchId) => {
    try{
        var result = await Match.deleteOne({tid: matchId});
        return result && result.deletedCount > 0;
    }
    catch{
        return false;
    }
};
