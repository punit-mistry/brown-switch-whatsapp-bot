const Whatsapp = require('../common-handlers/whatsappClient');
exports.processOrder = async (orderItems, customerReference) => {
    // Process the order logic here
    // You might want to save the order to a database
    console.log('Processing order:', orderItems);
  };
  
  exports.cancelOrder = async (sessionId) => {
    // Cancel the order logic here
    console.log('Canceling order:', sessionId);
  };
  
  exports.sendConfirmationMessage = async (customerReference) => {
    const customer = CustomerSession.get(customerReference);
    const orderSummary = getOrderSummary(customer.cart);
    
    await Whatsapp.sendText({
      message: `Your order has been confirmed!\n\n${orderSummary}`,
      recipientPhone: customer.phone,
    });
  };