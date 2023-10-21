const { Schema, model, Types } = require('mongoose');
const mongoose = require("mongoose");

const PlayerSchema = new Schema({
    // uniqueId: {
    //     type: String,
    //     required: true,
    //     unique: true,
    // },
    // platform: {
    //     type: String,
    //     enum: ['apple', 'android'],
    //     required: true
    // },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
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
    unlockedCards: {
        type: Array,
        default: [{id: "0", count: 5}, {id: "1", count: 5}, {id: "2", count: 2}, {id: "3", count: 5}, {id: "4", count: 2}, {id: "5", count: 5}]
    },
    equippedHand: {
        type: Array,
        default: [{id: "0", count: 0}, {id: "1", count: 5}, {id: "2", count: 2}, {id: "3", count: 5}, {id: "4", count: 2}, {id: "5", count: 5}]
    }
    // lastLogin: {
    //     type: Date,
    //     default: Date.now
    // }
});

const Player = mongoose.model('Player', PlayerSchema);
module.exports = Player;