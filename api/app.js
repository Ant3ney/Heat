const mongoose = require('mongoose');
const express = require('express');
const app = express();
app.use(express.json());
const port = 6969;

const uri = "mongodb+srv://afordm99:VAbiGK7nx26VILb3@heatgame.qos8kpx.mongodb.net/?retryWrites=true&w=majority"

mongoose.connect(
                    uri,
                    {
                        useNewUrlParser: true,
                        useUnifiedTopology: true,
                    }
                ).then(()=> {
                    console.log('MongoDB has connected!');
                    app.listen(port, ()=> {
                        console.log(`Server listening on port ${port}`);
                        mongoose.set('strictQuery', true);
                    });
                })
                .catch((err)=> {
                    console.log('Something went wrong!');
                    console.log('Error: ', err);
                });

                module.exports = app;