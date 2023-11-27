const MarketController = require('./market.controller');
const AuthTool = require('../authorization/auth.tool');
const config = require('../config');

const ADMIN = config.permissions.ADMIN; //Highest permision, can read and write all users
const SERVER = config.permissions.SERVER; //Middle permission, can read all users and grant rewards
const USER = config.permissions.USER; //Lowest permision, can only do things on same user

exports.route = function (app) {

  app.post("/market/cards/add", app.post_limiter, [
    AuthTool.isValidJWT,
    AuthTool.isPermissionLevel(USER),
    MarketController.addOffer,
  ]);
  app.post("/market/cards/remove", app.post_limiter, [
    AuthTool.isValidJWT,
    AuthTool.isPermissionLevel(USER),
    MarketController.removeOffer,
  ]);
  app.post("/market/cards/trade", app.post_limiter, [
    AuthTool.isValidJWT,
    AuthTool.isPermissionLevel(USER),
    MarketController.trade,
  ]);

  app.get("/market/cards/", [
    AuthTool.isValidJWT,
    AuthTool.isPermissionLevel(USER),
    MarketController.getAll,
  ]);

  app.get("/market/cards/user/:username", [
    AuthTool.isValidJWT,
    AuthTool.isPermissionLevel(USER),
    MarketController.getBySeller,
  ]);

  app.get("/market/cards/card/:tid", [
    AuthTool.isValidJWT,
    AuthTool.isPermissionLevel(USER),
    MarketController.getByCard,
  ]);

  app.get("/market/cards/offer/:username/:tid", [
    AuthTool.isValidJWT,
    AuthTool.isPermissionLevel(USER),
    MarketController.getOffer,
  ]);

};