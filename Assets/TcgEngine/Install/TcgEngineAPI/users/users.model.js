const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({

  username: {type: String, required: true, index: true, unique: true, default: ""},
  email: {type: String, required: true, index: true, default: ""},
  password: {type: String, required: true, default: ""},
  
  permission_level: {type: Number, required: true, default: 1},  //Admin or not?
  validation_level: {type: Number, required: true, default: 0},  //Validation level increases by confirming email
  account_create_time: {type: Date, default: null},
  last_login_time: {type: Date, default: null},
  last_online_time: {type: Date, default: null},

  refresh_key: {type: String, default: ""},           //Used for refreshing the current login JWT token
  proof_key: {type: String, default: ""},             //Used to proof to a another server who you are
  email_confirm_key: {type: String, default: ""},      //Used to confirm email
  password_recovery_key: {type: String, default: ""},  //Used for password recovery   
  
  avatar: {type: String, default: ""},
  cardback: {type: String, default: ""},
  coins: {type: Number, default: 0},
  xp: {type: Number, default: 0},
  elo: {type: Number, default: 1000},

  matches: {type: Number, default: 0},
  victories: {type: Number, default: 0},
  defeats: {type: Number, default: 0},

  cards: [{ tid: String, variant: String, quantity: Number, _id: false }],
  packs: [{ tid: String, quantity: Number, _id: false }],
  decks: [{ type: Object, _id: false }],
  avatars: [{type: String}],
  cardbacks: [{type: String}],
  rewards: [{type: String}],

  friends: [{type: String}],
  friends_requests: [{type: String}],
});

userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

userSchema.methods.toObj = function() {
    var user = this.toObject();
    user.id = user._id;
    delete user.__v;
    delete user._id;
    return user;
};

//Hide sensitive information
userSchema.methods.deleteSecrets = function(){
    var user = this.toObject();
    user.id = user._id;
    delete user.__v;
    delete user._id;
    delete user.password;
    delete user.refresh_key;
    delete user.proof_key;
    delete user.email_confirm_key; 
    delete user.password_recovery_key;
    return user;
};

//Hide non-admin information, for example only admins can read user emails
userSchema.methods.deleteAdminOnly = function(){
    var user = this.toObject();
    delete user.__v;
    delete user._id;
    delete user.email;
    delete user.permission_level;
    delete user.validation_level;
    delete user.password;
    delete user.refresh_key;
    delete user.proof_key;
    delete user.email_confirm_key; 
    delete user.password_recovery_key;
    return user;
};

const User = mongoose.model('Users', userSchema);
exports.UserModel = User;

// USER DATA MODELS ------------------------------------------------

exports.getById = async(id) => {

    try{
        var user = await  User.findOne({_id: id});
        return user;
    }
    catch{
        return null;
    }
};

exports.getByEmail = async(email) => {

    try{
        var regex = new RegExp(["^", email, "$"].join(""), "i");
        var user = await User.findOne({email: regex});
        return user;
    }
    catch{
        return null;
    }
};

exports.getByUsername = async(username) => {

    try{
        var regex = new RegExp(["^", username, "$"].join(""), "i");
        var user = await User.findOne({username: regex});
        return user;
    }
    catch{
        return null;
    }
};

exports.create = async(userData) => {
    const user = new User(userData);
    return await user.save();
};

exports.getAll = async() => {

    try{
        var users = await User.find()
        users = users || [];
        return users;
    }
    catch{
        return [];
    }
};

exports.getAllLimit = async(perPage, page) => {

    try{
        var users = await User.find().limit(perPage).skip(perPage * page)
        users = users || [];
        return users;
    }
    catch{
        return [];
    }
};

//List users contained in the username list
exports.getUsernameList = async(username_list) => {

    try{
        var users = await User.find({ username: { $in: username_list } });
        return users || [];
    }
    catch{
        return [];
    }
};

//Saves an already loaded User, by providing a string list of changed keys
exports.save = async(user, modified_list) => {

    try{
        if(!user) return null;

        if(modified_list)
        {
            for (let i=0; i<modified_list.length; i++) {
                user.markModified(modified_list[i]);
            }
        }

        return await user.save();
    }
    catch(e){
        console.log(e);
        return null;
    }
};

//Update an already loaded user, by providing an object containing new values
exports.update = async(user, userData) => {

    try{
        if(!user) return null;

        for (let i in userData) {
            user[i] = userData[i];
            user.markModified(i);
        }

        var updatedUser = await user.save();
        return updatedUser;
    }
    catch(e){
        console.log(e);
        return null;
    }
};

//Load, and then update a user, based on userId and an object containing new values
exports.patch = async(userId, userData) => {

    try{
        var user = await User.findById ({_id: userId});
        if(!user) return null;

        for (let i in userData) {
            user[i] = userData[i];
        }

        var updatedUser = await user.save();
        return updatedUser;
    }
    catch(e){
        console.log(e);
        return null;
    }
};

exports.remove = async(userId) => {

    try{
        var result = await User.deleteOne({_id: userId});
        return result && result.deletedCount > 0;
    }
    catch{
        return false;
    }
};

exports.count = async() =>
{
    try{
        var count = await User.countDocuments({});
        return count;
    }
    catch{
        return 0;
    }
}
