const UserTool = require('../users/users.tool');
const config = require('../config.js');


var MatchTool = {};


MatchTool.calculateELO = (player_elo, opponent_elo, progress, won, lost) =>
{
    var p_elo = player_elo || 1000;
    var o_elo = opponent_elo || 1000;

    var p_elo_log = Math.pow(10.0, p_elo / 400.0);
    var o_elo_log = Math.pow(10.0,  o_elo / 400.0);
    var p_expected = p_elo_log / (p_elo_log + o_elo_log);
    var p_score = won ? 1.0 : (lost ? 0.0 : 0.5);
    
    progress = Math.min(Math.max(progress, 0.0), 1.0);
    var elo_k = progress * config.elo_k + (1.0 - progress) * config.elo_ini_k;
    var new_elo = Math.round(p_elo + elo_k * (p_score - p_expected));
    return new_elo;
}

MatchTool.GetPlayerData = (player) => 
{
    var data = {};
    data.username = player.username;
    data.elo = player.elo;
    data.reward = {};
    return data;
}

MatchTool.GainMatchReward = async(player, opponent, winner_username) => {
    
    var player_elo = player.elo;
    var opponent_elo = opponent.elo;
    var won = winner_username == player.username;
    var lost = winner_username == opponent.username;

    //Rewards
    var xp = won ? config.xp_victoire : config.xp_defeat;
    var coins = won ? config.coins_victory : config.coins_defeat;

    player.xp += xp;
    player.coins += coins;

    //Match winrate
    player.matches +=1;

    if(won)
        player.victories += 1;
    else if (lost)
        player.defeats += 1;
    
    //Calculate elo
    var match_count = player.matches || 0;
    var match_progress = Math.min(Math.max(match_count / config.elo_ini_match, 0.0), 1.0);
    var new_elo = MatchTool.calculateELO(player_elo, opponent_elo, match_progress, won, lost);
    player.elo = new_elo;
    player.save();

    var reward = {
        elo: player.elo,
        xp: xp,
        coins: coins
    }; 

    return reward;
};

module.exports = MatchTool;