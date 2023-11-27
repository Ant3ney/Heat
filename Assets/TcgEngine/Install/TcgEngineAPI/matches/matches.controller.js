const MatchModel = require('./matches.model');
const MatchTool = require('./matches.tool');
const UserModel = require('../users/users.model');
const DateTool = require('../tools/date.tool');
const config = require('../config');

exports.addMatch = async(req, res) => {
    
    var tid = req.body.tid;
    var players = req.body.players;
    var ranked = req.body.ranked ? true : false;
    var mode = req.body.mode || "";

    if (!tid || !players || !Array.isArray(players) || players.length != 2)
        return res.status(400).send({ error: "Invalid parameters" });

    if (mode && typeof mode !== "string")
        return res.status(400).send({ error: "Invalid parameters" });

    var fmatch = await MatchModel.get(tid);
    if(fmatch)
        return res.status(400).send({error:"Match already exists: " + tid});

    var player0 = await UserModel.getByUsername(players[0]);
    var player1 = await UserModel.getByUsername(players[1]);
    if(!player0 || !player1)
        return res.status(404).send({error:"Can't find players"});

    if(player0.id == player1.id)
        return res.status(400).send({error:"Can't play against yourself"});

    var match = {};
    match.tid = tid;
    match.players = players;
    match.winner = "";
    match.completed = false;
    match.ranked = ranked;
    match.mode = mode;
    match.start = Date.now();
    match.end = Date.now();
    match.udata = [];
    match.udata.push(MatchTool.GetPlayerData(player0));
    match.udata.push(MatchTool.GetPlayerData(player1));

    var match = await MatchModel.create(match);
    if(!match)
        return res.status(500).send({error:"Unable to create match"});

    res.status(200).send(match);

};

exports.completeMatch = async(req, res) => {
    
    var matchId = req.body.tid;
    var winner = req.body.winner;

    if (!matchId || !winner)
        return res.status(400).send({ error: "Invalid parameters" });
	
	if(typeof matchId != "string" || typeof winner != "string")
        return res.status(400).send({error: "Invalid parameters" });

    var match = await MatchModel.get(matchId);
    if(!match)
        return res.status(404).send({error: "Match not found"});

    if(match.completed)
        return res.status(400).send({error: "Match already completed"});

    var player0 = await UserModel.getByUsername(match.players[0]);
    var player1 = await UserModel.getByUsername(match.players[1]);
    if(!player0 || !player1)
        return res.status(404).send({error:"Can't find players"});

    match.end = Date.now();
    match.winner = winner;
    match.completed = true;
    
    //Add Rewards
    if(match.ranked)
    {
        match.udata[0].reward = await MatchTool.GainMatchReward(player0, player1, winner);
        match.udata[1].reward = await MatchTool.GainMatchReward(player1, player0, winner);
        match.markModified('udata');
    }

    //Save match
    var uMatch = await match.save();
    
    //Return
    res.status(200).send(uMatch);
};

exports.getAll = async(req, res) => {

    var start =  req.query.start ? DateTool.tagToDate(req.query.start) : null;
    var end =  req.query.end ? DateTool.tagToDate(req.query.end) : null;

    var matches = await MatchModel.list(start, end);
    if(!matches)
        return res.status(400).send({error: "Invalid Parameters"});

    return res.status(200).send(matches);
};

exports.getByTid = async(req, res) => {

    var match = await MatchModel.get(req.params.tid);
    if(!match)
        return res.status(404).send({error: "Match not found " + req.params.tid});
    
    return res.status(200).send(match);
};

exports.getLatest = async(req, res) => {

    var match = await MatchModel.getLast(req.params.userId);
    if(!match)
        return res.status(404).send({error: "Match not found for user " + req.params.userId});
    
    return res.status(200).send(match);
};
