const FileTool = require('../tools/file.tool');

var Validator = {};

Validator.isInteger = function(value){
    return Number.isInteger(value);
}

Validator.isNumber = function(value){
    return !isNaN(parseFloat(value)) && isFinite(value);
};

Validator.validateUsername = function(username){
    if(typeof username != "string")
        return false;

    if(username.length < 3 || username.length > 20)
        return false;

    //Cant have some special characters, must be letters or digits and start with a letter
    var regex = /^[a-zA-Z][a-zA-Z\d]+$/;
    if(!regex.test(username))
        return false;

    return true;
}

Validator.validatePhone = function(phone){
    if(typeof phone != "string")
        return false;

    if(phone.length < 7)
        return false;

    if(!/^[0-9]+$/.test(phone))
        return false;

    return true;
}

Validator.validateEmail = function(email){

    if(typeof email != "string")
        return false;

    if(email.length < 7 || email.length > 320)
        return false;

    var regex_email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(!regex_email.test(email))
        return false;

    return true;

}

Validator.validatePassword = function(pass){

    if(typeof pass != "string")
        return false;

    if(pass.length < 4 || pass.length > 50)
        return false;

    //Password validations could be improved here

    return true;

}

Validator.countQuantity = function(array){

    if (!array || !Array.isArray(array))
        return 0;

    var total = 0;
    for (const elem of array) {
        var q = elem.quantity || 1;
        total += q;
    }

    return total;
}


//Returns true or false checking if array has the expected quantity
Validator.validateArray = function(array, quantity){
    var nb = Validator.countQuantity(array);
    return quantity == nb;
}

module.exports = Validator;