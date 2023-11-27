const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const packsSchema = new Schema({

    tid: { type: String, index: true, unique: true },
    cards: {type: Number, default: 1}, //Number of cards per pack
    cost: {type: Number, default: 0}, //Cost in coins
    random: {type: Boolean, default: true},
    rarities: [{type: Object}],     //Probabilities to get each rarities
    rarities_1st: [{type: Object}], //Probabilities but for the first card only
    variants: [{type: Object}],     //Probabilities of variants
});

packsSchema.methods.toObj = function() {
  var elem = this.toObject();
  delete elem.__v;
  delete elem._id;
  return elem;
};

const Pack = mongoose.model("Packs", packsSchema);
exports.Pack = Pack;

exports.create = async(data) => {

  try{
    var pack = new Pack(data);
    return await pack.save();
  }
  catch{
      return null;
  }
};

exports.get = async(set_tid) => {

  try{
      var pack = await Pack.findOne({tid: set_tid});
      return pack;
  }
  catch{
      return null;
  }
};

exports.getAll = async() => {

  try{
      var packs = await Pack.find({});
      return packs;
  }
  catch{
      return [];
  }

};

exports.update = async(pack, data) => {

  try{
      if(!pack) return null;

      for (let i in data) {
          pack[i] = data[i];
          pack.markModified(i);
      }

      var updated = await pack.save();
      return updated;
  }
  catch{
      return null;
  }
};

exports.remove = async(pack_tid) => {

  try{
      var result = await Pack.deleteOne({tid: pack_tid});
      return result && result.deletedCount > 0;
  }
  catch{
      return false;
  }
};

exports.removeAll = async() => {
  try{
      var result = await Pack.deleteMany({});
      return result && result.deletedCount > 0;
  }
  catch{
      return false;
  }
};