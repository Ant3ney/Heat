
const nodeMailer = require('nodemailer');
const config = require('../config');
const fs = require('fs');
const path = require('path');

//Send One Mail
exports.SendEmail = function(email_to, subject, text, callback){

    if(!config.smtp_enabled)
        return;

    console.log("Sending email to: " + email_to);

    let transporter = nodeMailer.createTransport({
        host: config.smtp_server,
        port: config.smtp_port,               //Port must be 465 (encrypted) or 587 (STARTTSL, first pre-request is unencrypted to know the encryption method supported, followed by encrypted request)
        secure: (config.smtp_port == "465"),  //On port 587 secure must be false since it will first send unsecured pre-request to know which encryption to use
		requireTLS: true,                     //Force using encryption on port 587 on the second request
        auth: {
            user: config.smtp_user,
            pass: config.smtp_password,
        }
    });

    let mailOptions = {
        from: '"' + config.smtp_name + '" <' + config.smtp_email + '>', // sender address
        to: email_to, // list of receivers
        subject: subject, // Subject line
        //text: text, // plain text body
        html: text, // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            if(callback)
                callback(false, error);
            console.log(error);
            return;
        }

        if(callback)
            callback(true);
    });

};

//Send same mail to multiple recipients (emails array)
exports.SendEmailList = function(emails, subject, text, callback){

    if(!config.smtp_enabled)
        return;

    if(!Array.isArray(emails))
        return;

    if(emails.length == 0)
        return;

    let transporter = nodeMailer.createTransport({
        pool: true,
        host: config.smtp_server,
        port: config.smtp_port,
        secure: (config.smtp_port == "465"),
		requireTLS: true,
        auth: {
            user: config.smtp_user,
            pass: config.smtp_password,
        }
    });

    var email_list = emails;
    var email_from = '"' + config.smtp_name + '" <' + config.smtp_email + '>';
    var total = emails.length;
    var sent_success = 0;
    var sent_count = 0;
    var ended = false;

    transporter.on("idle", function () {

        while (transporter.isIdle() && email_list.length > 0)
        {
            var email_to = email_list.shift();
            let mailOptions = {
                from: email_from,
                to: email_to, 
                subject: subject,
                html: text,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                sent_count++;
                if (!error) {
                    sent_success++;
                }

                if(email_list.length == 0 && sent_count == total && !ended)
                {
                    ended = true;
                    if(callback)
                        callback(sent_success);
                }
            });
        }
    });
};

exports.ReadTemplate = function(template)
{
    const rootDir = path.dirname(require.main.filename);
    const fullpath = rootDir + "/emails/" + template;
    
    try{
        const html = fs.readFileSync(fullpath, "utf8");
        return html;
    }
    catch
    {
        return null;
    }
}