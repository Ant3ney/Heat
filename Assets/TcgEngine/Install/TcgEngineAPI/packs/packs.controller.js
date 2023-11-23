const PackModel = require("./packs.model");

exports.AddPack = async(req, res) => 
{
    var tid = req.body.tid;
    var cards = req.body.cards || 1;
    var cost = req.body.cost || 1;
    var random = req.body.random || false;
    var rarities_1st = req.body.rarities_1st || [];
    var rarities = req.body.rarities || [];
    var variants = req.body.variants || [];

    if(!tid || typeof tid !== "string")
        return res.status(400).send({error: "Invalid parameters"});

    if(!Number.isInteger(cards) || !Number.isInteger(cost))
        return res.status(400).send({ error: "Invalid parameters" });

    if(!Array.isArray(rarities_1st) || !Array.isArray(rarities) || !Array.isArray(variants))
        return res.status(400).send({error: "Invalid parameters"});

    var data = {
        tid: tid,
        cards: cards,
        cost: cost,
        random: random,
        rarities_1st: rarities_1st,
        rarities: rarities,
        variants: variants,
    }

    //Update or create
    var pack = await PackModel.get(tid);
    if(pack)
        pack = await PackModel.update(pack, data);
    else
        pack = await PackModel.create(data);
    
    if(!pack)
        return res.status(500).send({error: "Error updating pack"});
    
    return res.status(200).send(data);
};

exports.DeletePack = async(req, res) => 
{
    PackModel.remove(req.params.tid);
    return res.status(204).send({});
};

exports.DeleteAll = async(req, res) => 
{
    PackModel.removeAll();
    return res.status(204).send({});
};

exports.GetPack = async(req, res) => 
{
    var tid = req.params.tid;

    if(!tid)
        return res.status(400).send({error: "Invalid parameters"});

    var pack = await PackModel.get(tid);
    if(!pack)
        return res.status(404).send({error: "Pack not found: " + tid});

    return res.status(200).send(pack.toObj());
};

exports.GetAll = async(req, res) => 
{
    var packs = await PackModel.getAll();

    for(var i=0; i<packs.length; i++){
        packs[i] = packs[i].toObj();
    }

    return res.status(200).send(packs);
};
