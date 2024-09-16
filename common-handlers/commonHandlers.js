// const { Whatsapp } = require('../routes/index');
const whatsappClient = require('./whatsappClient');
 const sendTextMessageOptionsWithButtons = async (
    recipientPhone,
    message,
    listOfButtons
) => {
    if (listOfButtons.length==0) {
        await whatsappClient.sendText({
            message,
            recipientPhone,
        });
    } else {
        await whatsappClient.sendSimpleButtons({
            message,
            recipientPhone,
            listOfButtons,
        });
    }
};
module.exports = { sendTextMessageOptionsWithButtons };