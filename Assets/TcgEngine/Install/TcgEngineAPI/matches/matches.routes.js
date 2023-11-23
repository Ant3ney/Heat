const MatchesController = require('./matches.controller');
const MatchesTool = require('./matches.tool');
const AuthTool = require('../authorization/auth.tool');
const config = require('../config');

const ADMIN = config.permissions.ADMIN; //Highest permision, can read and write all users
const SERVER = config.permissions.SERVER; //Higher permission, can read all users
const USER = config.permissions.USER; //Lowest permision, can only do things on same user

exports.route = function (app) {

    app.post('/matches/add', app.post_limiter, [
        AuthTool.isValidJWT,
        AuthTool.isPermissionLevel(SERVER),
        MatchesController.addMatch
    ]);
    app.post('/matches/complete', app.post_limiter, [
        AuthTool.isValidJWT,
        AuthTool.isPermissionLevel(SERVER),
        MatchesController.completeMatch
    ]);

    //-- Getter
    app.get('/matches', [
        AuthTool.isValidJWT,
        AuthTool.isPermissionLevel(SERVER),
        MatchesController.getAll
    ]);
    app.get('/matches/:tid', [
        AuthTool.isValidJWT,
        AuthTool.isPermissionLevel(USER),
        MatchesController.getByTid
    ]);
};