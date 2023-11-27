/* const pl = require("tau-prolog"); */
const { getCoordinates } = require("./utilities");

exports.query = async (req, res) => {
  console.log("In AI controller");
  const { fires } = req.body || {};
  if (!fires) {
    res.status(400).send("Missing parameters");
    return;
  }

  console.log("Fires:", fires);
  const coordinates = await getCoordinates(fires);
  console.log("Fire will spread to:", coordinates);

  if (!coordinates) {
    res.status(500).send("Something went wrong");
    return;
  }

  res.status(200).send(coordinates);
};
