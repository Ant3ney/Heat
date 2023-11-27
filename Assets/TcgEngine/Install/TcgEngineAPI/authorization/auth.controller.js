
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config.js');
const jwtSecret = config.jwt_secret;
const UserModel = require('../users/users.model');
const UserTool = require('../users/users.tool');

exports.Login = (req, res) => {
    try {

        let refreshId = req.login.userId + jwtSecret;
        let refresh_key = crypto.randomBytes(16).toString('base64');
        let refresh_hash = crypto.createHmac('sha512', refresh_key).update(refreshId).digest("base64");
        req.login.refresh_key = refresh_key;

        let access_token = jwt.sign(req.login, jwtSecret);

        //Delete some keys for security, empty keys are never valid, also update login time
        var update = {refresh_key: refresh_key, proof_key: "", password_recovery_key: "", last_login_time: new Date(), last_online_time: new Date()};
        UserModel.patch(req.login.userId, update);

        var odata = {
            id: req.login.userId, 
            username: req.login.username, 
            access_token: access_token, 
            refresh_token: refresh_hash, 
            permission_level: req.login.permission_level, 
            validation_level: req.login.validation_level, 
            duration: config.jwt_expiration,
            server_time: new Date(),
            version: config.version
        }

        return res.status(201).send(odata);
    
    } catch (err) {
        return res.status(500).send({error: err});
    }
};

exports.KeepOnline = async(req, res, next) => {
    
    var token = req.jwt;
    UserModel.patch(token.userId, {last_online_time: new Date()});

    var data = {id: token.userId, username: token.username, login_time: new Date(token.iat * 1000), server_time: new Date() };
    return res.status(200).send(data);
};

exports.GetVersion = (req, res) =>{
    return res.status(200).send({version: config.version});
};

// ----- verify user -----------

exports.ValidateToken = async(req, res, next) => {
    
    var token = req.jwt;
    var data = {id: token.userId, username: token.username, login_time: new Date(token.iat * 1000), server_time: new Date() };
    return res.status(200).send(data);
};

exports.CreateProof = async(req, res) =>
{
    var userId = req.jwt.userId;

    var user = await UserModel.getById(userId);
    if(!user)
        return res.status(404).send({error: "User not found"});

    user.proof_key = crypto.randomBytes(20).toString('base64');
    await UserModel.save(user);

    return res.status(200).send({proof: user.proof_key});
}

exports.ValidateProof = async(req, res) =>
{
    var username = req.params.username;
    var proof = req.params.proof;

    if(!username || typeof username != "string" || !proof || typeof proof != "string")
        return res.status(400).send({error: "Invalid parameters"});

    var user = await UserModel.getByUsername(username);
    if(!user)
        return res.status(404).send({error: "User not found"});
    
    if(!user.proof_key || user.proof_key != proof)
        return res.status(403).send({error: "Invalid Proof"});

    return res.status(200).send();
}