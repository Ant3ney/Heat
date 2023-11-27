const VariantModel = require("./variants.model");

exports.AddVariant = async(req, res) => 
{
    var tid = req.body.tid;
    var cost_factor = req.body.cost_factor || 1;
    var is_default = req.body.is_default || false;

    if(!Number.isInteger(cost_factor))
        return res.status(400).send({ error: "Invalid parameters" });

    var data = {
        tid: tid,
        cost_factor: cost_factor,
        is_default: is_default,
    }

    //Update or create
    var variant = await VariantModel.get(tid);
    if(variant)
        variant = await VariantModel.update(variant, data);
    else
        variant = await VariantModel.create(data);
    
    if(!variant)
        return res.status(500).send({error: "Error updating variant"});
    
    return res.status(200).send(data);
};

exports.DeleteVariant = async(req, res) => 
{
    VariantModel.remove(req.params.tid);
    return res.status(204).send({});
};

exports.DeleteAll = async(req, res) => 
{
    VariantModel.removeAll();
    return res.status(204).send({});
};

exports.GetVariant = async(req, res) => 
{
    var tid = req.params.tid;

    if(!tid)
        return res.status(400).send({error: "Invalid parameters"});

    var variant = await VariantModel.get(tid);
    if(!variant)
        return res.status(404).send({error: "Variant not found: " + tid});

    return res.status(200).send(variant.toObj());
};

exports.GetAll = async(req, res) => 
{
    var variants = await VariantModel.getAll();

    for(var i=0; i<variants.length; i++){
        variants[i] = variants[i].toObj();
    }

    return res.status(200).send(variants);
};
