   // whatsappClient.js
   const WhatsappCloudAPI = require('whatsappcloudapi_wrapper');
   
   const whatsappClient = new WhatsappCloudAPI({
     accessToken: process.env.Meta_WA_accessToken,
     senderPhoneNumberId: process.env.Meta_WA_SenderPhoneNumberId,
     WABA_ID: process.env.Meta_WA_wabaId,
   });

   module.exports = whatsappClient;