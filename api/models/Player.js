const { Schema, model, Types } = require('mongoose');
const PlayerSchema = new Schema({
    uniqueId: {
        type: String,
        required: true,
        unique: true,
    },
    platform: {
        type: String,
        enum: ['apple', 'android'],
        required: true
    },
    displayName: {
        type: String,
        default: 'newUser',
    },
    scores: {
        type: Number,
        default: 0,
    },
    balance: {
        type: Number,
        default: 0,
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
});

const Player = mongoose.model('Player', playerSchema);
module.exports = Player;