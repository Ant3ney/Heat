var DateTool = {};

// -------- Date & timestamp -------
DateTool.isDate = function(date)
{
    if (Object.prototype.toString.call(date) === "[object Date]") {
        if (!isNaN(date.getTime())) {
            return true;
        }
    }
    return false;  
};

DateTool.tagToDate = function(tag)
{
    if(typeof tag !== "string")
        return null;

    [year, month, day] = tag.split("-");
    var d = new Date(year, month - 1, day, 0, 0, 0, 0);
    return  DateTool.isDate(d) ? d : null;  
};

DateTool.dateToTag = function(d)
{
    if(!DateTool.isDate(d))
        return "";

    var year = '' + d.getFullYear();
    var month = '' + (d.getMonth() + 1);
    var day = '' + d.getDate();
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
};

DateTool.getStartOfDay = function(date){
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

DateTool.addDays = function(date, days) {
    return new Date(date.getTime() + days*24*60*60*1000);
}

DateTool.addHours = function(date, hours) {
    return new Date(date.getTime() + hours*60*60*1000);
}

DateTool.addMinutes = function(date, minutes) {
    return new Date(date.getTime() + minutes*60000);
}

DateTool.minDate = function()
{
    return new Date(-8640000000000000);
}

DateTool.maxDate = function()
{
    return new Date(8640000000000000);
}

module.exports = DateTool;