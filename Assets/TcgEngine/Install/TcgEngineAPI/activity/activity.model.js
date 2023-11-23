const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const activitySchema = new Schema(
{
    type: {type: String},
    username: {type: String},
    timestamp: {type: Date},
    data: {type: Object, _id: false},
});

activitySchema.methods.toObj = function () {
  var elem = this.toObject();
  delete elem.__v;
  delete elem._id;
  return elem;
};

const Activity = mongoose.model("Activity", activitySchema);
exports.Activity = Activity;

// ------------------------------

exports.LogActivity = async (type, username, data) => {
  var activity_data = {
    type: type,
    username: username,
    timestamp: Date.now(),
    data: data
  }
  try {
    const activity = new Activity(activity_data);
    return await activity.save();
  }
  catch{
      return null;
  }
};

exports.GetAll = async () => {
  try {
    const logs = await Activity.find({});
    return logs;
  } catch (e) {
    return [];
  }
};

exports.Get = async (data) => {
  try {
    const logs = await Activity.find(data);
    return logs;
  } catch (e) {
    return [];
  }
};