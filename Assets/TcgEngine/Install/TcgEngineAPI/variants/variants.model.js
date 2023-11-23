const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const variantsSchema = new Schema({

    tid: { type: String, index: true, unique: true },
    cost_factor: {type: Number, default: 1}, //Cost multiplier
    is_default: {type: Boolean, default: false},
});

variantsSchema.methods.toObj = function() {
  var elem = this.toObject();
  delete elem.__v;
  delete elem._id;
  return elem;
};

const Variant = mongoose.model("Variants", variantsSchema);
exports.Variant = Variant;

exports.create = async(data) => {

  try{
    var variant = new Variant(data);
    return await variant.save();
  }
  catch{
      return null;
  }
};

exports.get = async(variant_tid) => {

  try{
      var variant = await Variant.findOne({tid: variant_tid});
      return variant;
  }
  catch{
      return null;
  }
};

exports.getDefault = async() => {

  try{
      var variant = await Variant.findOne({is_default: true});
      return variant;
  }
  catch{
      return null;
  }
};

exports.getAll = async() => {

  try{
      var variants = await Variant.find({});
      return variants;
  }
  catch{
      return [];
  }

};

exports.update = async(variant, data) => {

  try{
      if(!variant) return null;

      for (let i in data) {
          variant[i] = data[i];
          variant.markModified(i);
      }

      var updated = await variant.save();
      return updated;
  }
  catch{
      return null;
  }
};

exports.remove = async(variant_tid) => {

  try{
      var result = await Variant.deleteOne({tid: variant_tid});
      return result && result.deletedCount > 0;
  }
  catch{
      return false;
  }
};

exports.removeAll = async() => {
  try{
      var result = await Variant.deleteMany({});
      return result && result.deletedCount > 0;
  }
  catch{
      return false;
  }
};