const CardController = require('./cards.controller');
const AuthTool = require('../authorization/auth.tool');
const config = require('../config');

const ADMIN = config.permissions.ADMIN; //Highest permision, can read and write all users
const SERVER = config.permissions.SERVER; //Higher permission, can read all users
const USER = config.permissions.USER; //Lowest permision, can only do things on same user

exports.route = function (app) {

    app.get('/cards/:tid', [
        CardController.GetCard
    ]);

    app.get('/cards', [
        CardController.GetAll
    ]);

    app.post('/cards/add', [
        AuthTool.isValidJWT,
        AuthTool.isPermissionLevel(ADMIN),
        CardController.AddCard
    ]);

    app.delete("/cards/:tid", [
        AuthTool.isValidJWT,
        AuthTool.isPermissionLevel(ADMIN),
        CardController.DeleteCard
    ]);

    app.delete("/cards", [
        AuthTool.isValidJWT,
        AuthTool.isPermissionLevel(ADMIN),
        CardController.DeleteAll
    ]);
};