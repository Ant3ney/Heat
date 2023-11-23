const RewardController = require('./rewards.controller');
const AuthTool = require('../authorization/auth.tool');
const config = require('../config');

const ADMIN = config.permissions.ADMIN; //Highest permision, can read and write all users
const SERVER = config.permissions.SERVER; //Higher permission, can read all users
const USER = config.permissions.USER; //Lowest permision, can only do things on same user

exports.route = function (app) {

    app.get('/rewards/:tid', [
        AuthTool.isValidJWT,
        AuthTool.isPermissionLevel(USER),
        RewardController.GetReward
    ]);

    app.get('/rewards', [
        AuthTool.isValidJWT,
        AuthTool.isPermissionLevel(SERVER),
        RewardController.GetAll
    ]);
    
    app.post('/rewards/add', [
        AuthTool.isValidJWT,
        AuthTool.isPermissionLevel(ADMIN),
        RewardController.AddReward
    ]);
    
    app.delete("/rewards/:tid", [
        AuthTool.isValidJWT,
        AuthTool.isPermissionLevel(ADMIN),
        RewardController.DeleteReward
    ]);

    app.delete("/rewards", [
        AuthTool.isValidJWT,
        AuthTool.isPermissionLevel(ADMIN),
        RewardController.DeleteAll
    ]);
};