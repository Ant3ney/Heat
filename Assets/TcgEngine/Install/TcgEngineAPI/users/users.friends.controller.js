const UserModel = require("./users.model");
const Activity = require("../activity/activity.model");
const UserTool = require('./users.tool');
const config = require('../config.js');

exports.AddFriend = async (req, res) => {

  const userId = req.jwt.userId;
  const username = req.body.username;

  //Validate params
  if (!username || !userId) {
    return res.status(400).send({ error: "Invalid parameters" });
  }

  //Get the user
  const user = await UserModel.getById(userId);
  if (!user)
    return res.status(404).send({ error: "Can't find user" });

  const friend = await UserModel.getByUsername(username);
  if (!friend)
    return res.status(404).send({ error: "Can't find friend" });

  if(user.id == friend.id)
    return res.status(400).send({ error: "Can't add yourself" });

  //Add Friend
  if(!user.friends.includes(friend.username))
    user.friends.push(friend.username);

  //Add request other friend
  if(!friend.friends.includes(user.username) && !friend.friends_requests.includes(user.username))
    friend.friends_requests.push(user.username)

  //Remove self request
  if(user.friends_requests.includes(friend.username))
    user.friends_requests.remove(friend.username);

  //Update the user array
  var updatedUser = await UserModel.save(user, ["friends", "friends_requests"]);
  if (!updatedUser) return res.status(400).send({ error: "Error updating user" });

  //Update the other user
  var updatedFriend = await UserModel.save(friend, ["friends_requests"]);
  if (!updatedFriend) return res.status(400).send({ error: "Error updating user" });

  // -------------
  return res.status(200).send(updatedUser.deleteSecrets());
};

exports.RemoveFriend = async(req, res) => {

  const userId = req.jwt.userId;
  const username = req.body.username;

  //Validate params
  if (!username || !userId) {
    return res.status(400).send({ error: "Invalid parameters" });
  }

  //Get the user
  const user = await UserModel.getById(userId);
  if (!user)
    return res.status(404).send({ error: "Can't find user" });

  const friend = await UserModel.getByUsername(username);
  if (!friend)
    return res.status(404).send({ error: "Can't find friend" });

  if(user.friends.includes(friend.username))
    user.friends.remove(friend.username);
  if(user.friends_requests.includes(friend.username))
    user.friends_requests.remove(friend.username);
  if(friend.friends_requests.includes(user.username))
    friend.friends_requests.remove(user.username)

  //Update the user array
  var updatedUser = await UserModel.save(user, ["friends", "friends_requests"]);
  if (!updatedUser) return res.status(400).send({ error: "Error updating user" });

  var updatedFriend = await UserModel.save(friend, ["friends_requests"]);
  if (!updatedFriend) return res.status(400).send({ error: "Error updating user" });

  // -------------
  return res.status(200).send(updatedUser.deleteSecrets());
};

exports.ListFriends = async(req, res) => 
{
  const userId = req.jwt.userId;

  //Validate params
  if (!userId) {
    return res.status(400).send({ error: "Invalid parameters" });
  }

  //Get the user
  const user = await UserModel.getById(userId);
  if (!user)
    return res.status(404).send({ error: "Can't find user" });

  var friends_users = user.friends || [];
  var requests_users = user.friends_requests || [];

  const friends = await UserModel.getUsernameList(friends_users);
  if (!friends)
    return res.status(404).send({ error: "Can't find user friends" });

  const requests = await UserModel.getUsernameList(requests_users);
  if (!requests)
    return res.status(404).send({ error: "Can't find user friends" });

  //Reduce visible fields
  for(var i=0; i<friends.length; i++)
  {
    friends[i] = {
      username: friends[i].username,
      avatar: friends[i].avatar,
      last_online_time: friends[i].last_online_time,
    }
  }

  for(var i=0; i<requests.length; i++)
  {
    requests[i] = {
      username: requests[i].username,
      avatar: requests[i].avatar,
      last_online_time: requests[i].last_online_time,
    }
  }

  return res.status(200).send({username: user.username, friends: friends, friends_requests: requests, server_time: new Date()});
  
}
