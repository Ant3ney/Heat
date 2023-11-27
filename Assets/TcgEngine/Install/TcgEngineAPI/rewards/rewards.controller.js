const RewardModel = require('../rewards/rewards.model');
const Activity = require("../activity/activity.model");
const config = require('../config');

exports.AddReward = async(req, res) => 
{
    var rewardId = req.body.tid;
    var group = req.body.group;
    var repeat = req.body.repeat;
    var xp = req.body.xp;
    var coins = req.body.coins;
    var cards = req.body.cards;
    var packs = req.body.packs;
    var decks = req.body.decks;
    var avatars = req.body.avatars;
    var cardbacks = req.body.cardbacks;

    if(!rewardId || typeof rewardId !== "string")
        return res.status(400).send({error: "Invalid parameters"});

    if(group && typeof group !== "string")
        return res.status(400).send({error: "Invalid parameters"});

    if(xp && !Number.isInteger(xp))
        return res.status(400).send({error: "Invalid parameters"});
    if(coins && !Number.isInteger(coins))
        return res.status(400).send({error: "Invalid parameters"});
    if(cards && !Array.isArray(cards))
        return res.status(400).send({error: "Invalid parameters"});
    if(packs && !Array.isArray(packs))
        return res.status(400).send({error: "Invalid parameters"});
    if(decks && !Array.isArray(decks))
        return res.status(400).send({error: "Invalid parameters"});
    if(avatars && !Array.isArray(avatars))
        return res.status(400).send({error: "Invalid parameters"});
    if(cardbacks && !Array.isArray(cardbacks))
        return res.status(400).send({error: "Invalid parameters"});

    var reward_data = {
        tid: rewardId,
        group: group || "",
        repeat: repeat || false,
        xp: xp || 0,
        coins: coins || 0,
        cards: cards || [],
        packs: packs || [],
        decks: decks || [],
        avatars: avatars || [],
        cardbacks: cardbacks || [],
    }

    //Update or create
    var reward = await RewardModel.get(rewardId);
    if(reward)
        reward = await RewardModel.update(reward, reward_data);
    else
        reward = await RewardModel.create(reward_data);

    if(!reward)
        res.status(500).send({error: "Error updating reward"});

    //Activity
    const act = await Activity.LogActivity("reward_add", req.jwt.username, reward);
    if (!act) return res.status(500).send({ error: "Failed to log activity!" });    
    
    return res.status(200).send(reward);
};

exports.DeleteReward = async(req, res) => {
    RewardModel.remove(req.params.tid);
    return res.status(204).send({});
};

exports.DeleteAll = async(req, res) => {
    RewardModel.removeAll();
    return res.status(204).send({});
};

exports.GetReward = async(req, res) => 
{
    var rewardTid = req.params.tid;

    if(!rewardTid)
        return res.status(400).send({error: "Invalid parameters"});

    var reward = await RewardModel.get(rewardTid);
    if(!reward)
        return res.status(404).send({error: "Reward not found: " + rewardTid});

    return res.status(200).send(reward.toObj());
};

exports.GetAll = async(req, res) => 
{
    var rewards = await RewardModel.getAll();
    return res.status(200).send(rewards);
};


