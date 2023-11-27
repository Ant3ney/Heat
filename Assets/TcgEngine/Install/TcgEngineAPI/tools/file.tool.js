var fs = require('fs');

exports.readFileArraySync = function(filename){

    var data = fs.readFileSync(filename, {encoding: "utf8"});
    var adata = data.split('\r\n');
    return adata;
};

exports.readFileArray = function(filename, callback){

    fs.readFile(filename, {encoding: "utf8"}, function(data){
        var adata = data.split('\r\n');
        callback(adata);
    });
};
