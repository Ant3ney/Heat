const config = require('../config.js');
const crypto = require('crypto');
const Email = require('../tools/email.tool');
const AuthTool = require('../authorization/auth.tool');
const DeckModel = require('../decks/decks.model');
const Validator = require('../tools/validator.tool');
const VariantModel = require('../variants/variants.model.js');

const UserTool = {};

UserTool.generateID = function(length, easyRead) {
    var result           = '';
    var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
    if(easyRead)
        characters  = 'abcdefghijklmnpqrstuvwxyz123456789'; //Remove confusing characters like 0 and O
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

UserTool.setUserPassword = (user, password) =>
{
    user.password = AuthTool.hashPassword(password);
    user.password_recovery_key = ""; //After changing password, disable recovery until inited again
    user.refresh_key = crypto.randomBytes(16).toString('base64'); //Logout previous logins by changing the refresh_key
}

//--------- Rewards -----------

UserTool.GainUserReward = async(user, reward) =>
{
    //Add reward to user
    user.coins += reward.coins || 0;
    user.xp += reward.xp || 0;
    
    UserTool.addAvatars(user, reward.avatars);
    UserTool.addCardbacks(user, reward.cardbacks);

    //Add cards and decks
    var valid_c = await UserTool.addCards(user, reward.cards || []);
    var valid_p = await UserTool.addPacks(user, reward.packs || []);
    var valid_d = await UserTool.addDecks(user, reward.decks || []);
    return valid_c && valid_p && valid_d;
};

//--------- Cards, Packs and Decks --------

//newCards is just an array of string (card tid), or an array of object {tid: "", quantity: 1}
UserTool.addCards = async(user, newCards) =>
{
    var cards = user.cards;
    
    if(!Array.isArray(cards) || !Array.isArray(newCards))
        return false; //Wrong params

    if(newCards.length == 0)
        return true; //No card to add, succeeded

    //Count quantities
    var prevTotal = Validator.countQuantity(cards);
    var addTotal = Validator.countQuantity(newCards);
    
    var variant_default = await VariantModel.getDefault();
    var default_tid = variant_default.tid || "";

    //Loop on cards to add
    for (let c = 0; c < newCards.length; c++) {

        var cardAdd = newCards[c];
        var cardAddTid = typeof cardAdd === 'object' ? cardAdd.tid : cardAdd;
        var cardAddVariant = typeof cardAdd === 'object' ? cardAdd.variant : default_tid;
        var cardAddQ = typeof cardAdd === 'object' ? cardAdd.quantity : 1;

        if (cardAddTid && typeof cardAddTid === "string") {
            var quantity = cardAddQ || 1; //default is 1
            var found = false;

            for (let i = 0; i < cards.length; i++) {
                if (cards[i].tid == cardAddTid && cards[i].variant == cardAddVariant) {
                    cards[i].quantity += quantity;
                    found = true;
                    break;
                }
            }

            if (!found) {
                cards.push({
                    tid: cardAddTid,
                    variant: cardAddVariant,
                    quantity: quantity,
                });
            }
        }
    }

    //Remove empty
    for(var i=cards.length-1; i>=0; i--)
    {
        var card = cards[i];
        if(!card.quantity || card.quantity <= 0)
            cards.splice(i, 1);
    }

    //Validate quantities to make sure the array was updated correctly, this is to prevent users from loosing all their cards because of server error which would be terrible.
    var valid = Validator.validateArray(cards, prevTotal + addTotal);
    return valid;
};

UserTool.addPacks = async (user, newPacks) => {

    var packs = user.packs;

    if(!Array.isArray(packs) || !Array.isArray(newPacks))
        return false; //Wrong params

    if(newPacks.length == 0)
        return true; //No pack to add, succeeded
  
    //Count quantities
    var prevTotal = Validator.countQuantity(packs);
    var addTotal = Validator.countQuantity(newPacks);

    //Loop on packs to add
    for (let c = 0; c < newPacks.length; c++) {

        var packAdd = newPacks[c];
        var packAddTid = typeof packAdd === 'object' ? packAdd.tid : packAdd;
        var packAddQ = typeof packAdd === 'object' ? packAdd.quantity : 1;

        if (packAddTid && typeof packAddTid === "string") {
            var quantity = packAddQ || 1; //default is 1
            var found = false;

            for (let i = 0; i < packs.length; i++) {
                if (packs[i].tid == packAddTid) {
                    packs[i].quantity += quantity;
                    found = true;
                }
            }

            if (!found) {
                packs.push({
                    tid: packAddTid,
                    quantity: quantity,
                });
            }
        }
    }

    //Remove empty
    for(var i=packs.length-1; i>=0; i--)
    {
        var pack = packs[i];
        if(!pack.quantity || pack.quantity <= 0)
            packs.splice(i, 1);
    }

    //Validate quantities to make sure the array was updated correctly, this is to prevent users from loosing all their packs because of server error which would be terrible.
    var valid = Validator.validateArray(packs, prevTotal + addTotal);
    return valid;
};

//newDecks is just an array of string (deck tid)
UserTool.addDecks = async(user, newDecks) =>
{
    var decks = user.decks;

    if(!Array.isArray(decks) || !Array.isArray(newDecks))
        return false; //Wrong params

    if(newDecks.length == 0)
        return true; //No deck to add, succeeded

    var ndecks = await DeckModel.getList(newDecks);
    if(!ndecks)
        return false; //Decks not found

    //Loop on cards to add
    for (let c = 0; c < ndecks.length; c++) {

        var deckAdd = ndecks[c];
        var valid_c = await UserTool.addCards(user, deckAdd.cards);
        if(!valid_c)
            return false; //Failed adding cards

        decks.push({
            tid: deckAdd.tid + "_" + UserTool.generateID(5),
            title: deckAdd.title || "",
            hero: deckAdd.hero || {},
            cards: deckAdd.cards || [],
        });
    }

    return true;
};
  
UserTool.addAvatars = (user, avatars) =>
{
    if(!avatars || !Array.isArray(avatars))
        return;

    for (let i = 0; i < avatars.length; i++) {
        var avatar = avatars[i];
        if(avatar && typeof avatar === "string" && !user.avatars.includes(avatar))
            user.avatars.push(avatar);
    }
};

UserTool.addCardbacks = (user, cardbacks) =>
{
    if(!cardbacks || !Array.isArray(cardbacks))
        return;

    for (let i = 0; i < cardbacks.length; i++) {
        var cardback = cardbacks[i];
        if(cardback && typeof cardback === "string" && !user.cardbacks.includes(cardback))
            user.cardbacks.push(cardback);
    }
};

UserTool.hasCard = (user, card_id, variant_id, quantity) =>
{
    for (let c = 0; c < user.cards.length; c++) {
        var acard = user.cards[c];
        var aquantity = acard.quantity || 1;
        if(acard.tid == card_id && acard.variant == variant_id && aquantity >= quantity)
            return true;
    }
    return false;
};

UserTool.hasPack = (user, card_tid, quantity) =>
{
    for (let c = 0; c < user.packs.length; c++) {
        var apack = user.packs[c];
        var aquantity = apack.quantity || 1;
        if(apack.tid == card_tid && aquantity >= quantity)
            return true;
    }
    return false;
};

UserTool.getDeck = (user, deck_tid) =>
{
    var deck = {};
    if(user && user.decks)
    {
        for(var i=0; i<user.decks.length; i++)
        {
            var adeck = user.decks[i];
            if(adeck.tid == deck_tid)
            {
                deck = adeck;
            }
        }
    }  
    return deck;
};

//--------- Emails --------

UserTool.sendEmailConfirmKey = (user, email, email_confirm_key) => {

    if(!email || !user) return;

    var subject = config.api_title + " - Email Confirmation";
    var http = config.allow_https ? "https://" : "http://";
    var confirm_link = http + config.api_url + "/users/email/confirm/" + user.id + "/" + email_confirm_key;

    var text = "Hello " + user.username + "<br>";
    text += "Welcome! <br><br>";
    text += "To confirm your email, click here: <br><a href='" + confirm_link + "'>" + confirm_link + "</a><br><br>";
    text += "Thank you and see you soon!<br>";

    Email.SendEmail(email, subject, text, function(result){
        console.log("Sent email to: " + email + ": " + result);
    });

};

UserTool.sendEmailChangeEmail = (user, email, new_email) => {

    if(!email || !user) return;

    var subject = config.api_title + " - Email Changed";

    var text = "Hello " + user.username + "<br>";
    text += "Your email was succesfully changed to: " + new_email + "<br>";
    text += "If you believe this is an error, please contact support immediately.<br><br>"
    text += "Thank you and see you soon!<br>";
    
    Email.SendEmail(email, subject, text, function(result){
        console.log("Sent email to: " + email + ": " + result);
    });
};

UserTool.sendEmailChangePassword = (user, email) => {

    if(!email || !user) return;

    var subject = config.api_title + " - Password Changed";

    var text = "Hello " + user.username + "<br>";
    text += "Your password was succesfully changed<br>";
    text += "If you believe this is an error, please contact support immediately.<br><br>"
    text += "Thank you and see you soon!<br>";

    Email.SendEmail(email, subject, text, function(result){
        console.log("Sent email to: " + email + ": " + result);
    });

};

UserTool.sendEmailPasswordRecovery = (user, email) => {

    if(!email || !user) return;

    var subject = config.api_title + " - Password Recovery";

    var text = "Hello " + user.username + "<br>";
    text += "Here is your password recovery code: " + user.password_recovery_key.toUpperCase() + "<br><br>";
    text += "Thank you and see you soon!<br>";

    Email.SendEmail(email, subject, text, function(result){
        console.log("Sent email to: " + email + ": " + result);
    });
};


module.exports = UserTool;