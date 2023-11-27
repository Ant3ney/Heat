
const AuthController = require('./auth.controller');
const AuthTool = require('./auth.tool');

exports.route = function (app) {
	
    //Body: username, password
    app.post('/auth', app.auth_limiter, [
        AuthTool.isLoginValid,
        AuthController.Login
    ]);

    //Body: refresh_token
    app.post('/auth/refresh', app.auth_limiter, [
        AuthTool.isRefreshValid,
        AuthController.Login
    ]);

    app.get('/auth/keep',[ 
        AuthTool.isValidJWT,
        AuthController.KeepOnline
    ]);

    app.get('/auth/validate',[ 
        AuthTool.isValidJWT,
        AuthController.ValidateToken
    ]);

    app.get("/auth/proof/create", [
        AuthTool.isValidJWT,
        AuthController.CreateProof
    ]);

    app.get("/auth/proof/:username/:proof", [
        AuthTool.isValidJWT,
        AuthController.ValidateProof
    ]);

    app.get('/version', [
        AuthController.GetVersion
    ]);

    
};