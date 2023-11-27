const mongoose = require("mongoose");
const express = require("express");
const app = express();
app.use(express.json());
const port = process.env.PORT || 3011;

const uri =
  "mongodb+srv://anthonycavuoti:zDzbQusUBCy5BQ3h@auth.bkpebfi.mongodb.net/?retryWrites=true&w=majority";

const playerRouter = require("./routes/player");
const aiRouter = require("./routes/ai");

app.use(express.json());
app.get("/", (req, res) => {
  res.send("In Heat API!");
});
app.use("/user", playerRouter);
app.use("/ai", aiRouter);

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB has connected!");
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
      mongoose.set("strictQuery", true);
    });
  })
  .catch((err) => {
    console.log("Something went wrong!");
    console.log("Error: ", err);
  });

module.exports = app;
