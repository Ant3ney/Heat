const ActivityController = require("./activity.controller");
const AuthTool = require("../authorization/auth.tool");
const config = require("../config");

const ADMIN = config.permissions.ADMIN; //Highest permision, can read and write all users
const SERVER = config.permissions.SERVER; //Middle permission, can read all users
const USER = config.permissions.USER; //Lowest permision, can only do things on same user

exports.route = function (app) {

app.get("/activity", [
  AuthTool.isValidJWT,
  AuthTool.isPermissionLevel(ADMIN),  
  ActivityController.GetAllActivities,
]);

}


