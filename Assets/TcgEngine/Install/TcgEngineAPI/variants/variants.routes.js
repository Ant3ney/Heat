const config = require("../config");
const VariantsController = require("./variants.controller");
const AuthTool = require("../authorization/auth.tool");

const ADMIN = config.permissions.ADMIN; //Highest permision, can read and write all users
const SERVER = config.permissions.SERVER; //Higher permission, can read all users
const USER = config.permissions.USER; //Lowest permision, can only do things on same user

exports.route = (app) => {

  app.get("/variants", [
    VariantsController.GetAll
  ]);

  app.get("/variants/:tid", [
    VariantsController.GetVariant
  ]);

  app.post("/variants/add", [
    AuthTool.isValidJWT,
    AuthTool.isPermissionLevel(ADMIN),
    VariantsController.AddVariant
  ]);

  app.delete("/variants/:tid", [
    AuthTool.isValidJWT,
    AuthTool.isPermissionLevel(ADMIN),
    VariantsController.DeleteVariant
  ]);

  app.delete("/variants", [
    AuthTool.isValidJWT,
    AuthTool.isPermissionLevel(ADMIN),
    VariantsController.DeleteAll
  ]);
};
