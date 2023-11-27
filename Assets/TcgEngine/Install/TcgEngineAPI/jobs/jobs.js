const schedule = require('node-schedule');

const ExecuteJobs = async() =>
{
    //console.log('Run Hourly Jobs.....');

    //Add custom hourly jobs here



};

exports.InitJobs = function()
{
    schedule.scheduleJob('* 1 * * *', function(){  // this for one hour
        ExecuteJobs();
    });
    
    //Test run when starting
    ExecuteJobs();
}