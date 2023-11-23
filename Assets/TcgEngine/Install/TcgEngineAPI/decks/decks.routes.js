const DeckController = require('./decks.controller');
const AuthTool = require('../authorization/auth.tool');
const config = require('../config');

const ADMIN = config.permissions.ADMIN; //Highest permision, can read and write all users
const SERVER = config.permissions.SERVER; //Higher permission, can read all users
const USER = config.permissions.USER; //Lowest permision, can only do things on same user

exports.route = function (app) {

    app.get('/decks/:tid', [
        DeckController.GetDeck
    ]);

    app.get('/decks', [
        DeckController.GetAll
    ]);

    app.post('/decks/add', [
        AuthTool.isValidJWT,
        AuthTool.isPermissionLevel(ADMIN),
        DeckController.AddDeck
    ]);

    app.delete("/decks/:tid", [
        AuthTool.isValidJWT,
        AuthTool.isPermissionLevel(ADMIN),
        DeckController.DeleteDeck
    ]);

    app.delete("/decks", [
        AuthTool.isValidJWT,
        AuthTool.isPermissionLevel(ADMIN),
        DeckController.DeleteAll
    ]);
};