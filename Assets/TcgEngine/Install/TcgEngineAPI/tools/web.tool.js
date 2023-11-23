var http = require('http');
var url = require('url');

var WebTool = {};

// -------- Http -----------------
WebTool.get = function(path, callback) {
    
  var hostname = url.parse(path).hostname;
  var pathname = url.parse(path).pathname;
  
  var post_options = {
      host: hostname,
      port: '80',
      path: pathname,
      method: 'GET'
  };
    
  var request = http.request(post_options, function(res) {
      res.setEncoding('utf8');
      var oData = "";
      res.on('data', function (chunk) {
          oData += chunk;
      });
      res.on('end', function(){
          callback(oData, res.statusCode);
      });
  });
  
  request.end();
};

WebTool.post = function(path, data, callback) {
    
  var post_data = JSON.stringify(data);
  var hostname = url.parse(path).hostname;
  var pathname = url.parse(path).pathname;
  
  var post_options = {
      host: hostname,
      port: '80',
      path: pathname,
      method: 'POST',
      headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': post_data.length
      }
  };
    
  var request = http.request(post_options, function(res) {
      res.setEncoding('utf8');
      var oData = "";
      res.on('data', function (chunk) {
          oData += chunk;
      });
      res.on('end', function(){
          callback(oData, res.statusCode);
      });
  });
    
  request.write(post_data);
  request.end();
};

WebTool.toObject = function(json)
{
  try{
    var data = JSON.parse(json);
    return data;
  }
  catch{
    return {};
  }
}

WebTool.toJson = function(data)
{
  try{
    var data = JSON.stringify(json);
    return data;
  }
  catch{
    return "";
  }
}

WebTool.GenerateUID = function(length, numberOnly)
{
  var result           = '';
  var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
  if(numberOnly)
    characters       = '0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

module.exports = WebTool;