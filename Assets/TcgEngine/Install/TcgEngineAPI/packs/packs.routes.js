const config = require("../config");
const PacksController = require("./packs.controller");
const AuthTool = require("../authorization/auth.tool");

const ADMIN = config.permissions.ADMIN; //Highest permision, can read and write all users
const SERVER = config.permissions.SERVER; //Higher permission, can read all users
const USER = config.permissions.USER; //Lowest permision, can only do things on same user

exports.route = (app) => {

  app.get("/packs", [
    PacksController.GetAll
  ]);

  app.get("/packs/:tid", [
    PacksController.GetPack
  ]);

  app.post("/packs/add", [
    AuthTool.isValidJWT,
    AuthTool.isPermissionLevel(ADMIN),
    PacksController.AddPack
  ]);

  app.delete("/packs/:tid", [
    AuthTool.isValidJWT,
    AuthTool.isPermissionLevel(ADMIN),
    PacksController.DeletePack
  ]);

  app.delete("/packs", [
    AuthTool.isValidJWT,
    AuthTool.isPermissionLevel(ADMIN),
    PacksController.DeleteAll
  ]);
};
