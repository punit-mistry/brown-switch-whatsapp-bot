'use strict';
const fs = require('fs');
const path = require('path');
const express = require('express');
const { stripePayment } = require('../utils/stripe');
const switchDetails = require('../utils/switch_data');
const Whatsapp = require('../common-handlers/whatsappClient');
const {sendTextMessageOptionsWithButtons} = require('../common-handlers/commonHandlers');
const {
    processOrder,
    cancelOrder,
    sendConfirmationMessage,
} = require('../utils/orderUtils');

const router = express.Router();
const CustomerSession = new Map();
const messagesFilePath = path.join(__dirname, 'messages.json');

// Initialize messages file if it doesn't exist
if (!fs.existsSync(messagesFilePath)) {
    fs.writeFileSync(messagesFilePath, JSON.stringify([]));
}

// Function to append incoming message to the JSON file
let storeMessageMain = [];
const storeMessage = (message) => {
    storeMessageMain.push(message);

    // fs.readFile(messagesFilePath, (err, data) => {
    //     if (err) {
    //         console.error('Error reading messages file:', err);
    //         return;
    //     }
    //     const messages = JSON.parse(data);
    //     messages.push(message);
    //     fs.writeFile(
    //         messagesFilePath,
    //         JSON.stringify(messages, null, 2),
    //         (err) => {
    //             if (err) {
    //                 console.error('Error writing to messages file:', err);
    //             }
    //         }
    //     );
    // });
};
// stripe payment
router.post('/success', async (req, res) => {
    const { sessionId, success } = req.body;

    if (success) {
        const { client_reference_id } = req.body.metadata;

        // Find the customer based on the reference ID
        const customer = CustomerSession.get(client_reference_id);

        if (customer && customer.cart.length > 0) {
            // Process the order
            await processOrder(customer.cart, client_reference_id);

            // Clear the cart
            clearCart(client_reference_id);

            // Send confirmation message
            await sendConfirmationMessage(client_reference_id);

            res.status(200).send('Payment successful');
        } else {
            res.status(400).send('Invalid customer reference');
        }
    } else {
        res.status(400).send('Payment failed');
    }
});

router.post('/cancel', async (req, res) => {
    const { sessionId } = req.body;

    // Cancel the order
    await cancelOrder(sessionId);

    res.status(200).send('Payment cancelled');
});

router.get('/meta_wa_callbackurl', (req, res) => {
    console.log('GET: Someone is pinging me!');

    const {
        'hub.mode': mode,
        'hub.verify_token': token,
        'hub.challenge': challenge,
    } = req.query;

    if (
        mode &&
        token &&
        mode === 'subscribe' &&
        process.env.Meta_WA_VerifyToken === token
    ) {
        return res.status(200).send(challenge);
    } else {
        return res.sendStatus(403);
    }
});

router.post('/meta_wa_callbackurl', async (req, res) => {
    console.log('POST: Someone is pinging me!');
    try {
        const data = Whatsapp.parseMessage(req.body);

        if (data?.isMessage) {
            const { message: incomingMessage } = data;
            console.log(incomingMessage);
            const { phone: recipientPhone, name: recipientName } =
                incomingMessage.from;
            const currentMessageCount = storeMessageMain.length;
            const { type: typeOfMsg, message_id } = incomingMessage;
            // Store the incoming message in the JSON file
            storeMessage(incomingMessage);
            initializeCustomerSession(recipientPhone);

            if (typeOfMsg === 'text_message') {
                console.log('text message', storeMessageMain.length);
                if (currentMessageCount == 0) {
                    const message = `Hey ${recipientName}, \n\nWelcome to Hansabhen Switches! We are dedicated to making high-quality and reliable switches. I'm here to assist you with your orders and any questions you might have about our products. 🌟\n\nInterested in learning more about our popular "brown switches"? You can place an order, inquire about availability, or ask for more details. Select an option below to view our products: 📦`;
                    const listOfButtons = [
                        { title: 'View Products', id: 'see_switches' },
                    ];
                    await sendTextMessageOptionsWithButtons(
                        recipientPhone,
                        message,
                        listOfButtons
                    );
                }
                if (incomingMessage.text.body == 10) {
                    const selected_quantity = incomingMessage.text.body;
                    const message = `You've selected a quantity of ${selected_quantity}.\n\nWhat do you want to do next?`;
                    updatedCartQuantity(recipientPhone, selected_quantity);
                    const listOfButtons = [
                        { title: 'Checkout 🛍️', id: 'checkout' },
                        { title: 'See more products', id: 'see_switches' },
                    ];
                    await sendTextMessageOptionsWithButtons(
                        recipientPhone,
                        message,
                        listOfButtons
                    );
                }
                if (incomingMessage.text.body == 'stripe') {
                    await printInvoice(recipientPhone, recipientName);
                }
            }

            if (typeOfMsg === 'radio_button_message') {
                await handleRadioButtonMessage(
                    incomingMessage,
                    recipientPhone,
                    message_id
                );
            }

            if (typeOfMsg === 'simple_button_message') {
                await handleSimpleButtonMessage(
                    incomingMessage,
                    recipientPhone,
                    message_id,
                    recipientName
                );
            }

            await Whatsapp.markMessageAsRead({ message_id });
        }

        res.sendStatus(200);
    } catch (error) {
        console.error({ error });
        res.sendStatus(500);
    }
});

const initializeCustomerSession = (recipientPhone) => {
    if (!CustomerSession.get(recipientPhone)) {
        CustomerSession.set(recipientPhone, { cart: [] });
    }
};

const handleRadioButtonMessage = async (
    incomingMessage,
    recipientPhone,
    message_id
) => {
    const selectionId = incomingMessage.list_reply.id;

    if (selectionId.startsWith('switch_')) {
        const selected_switch_id = selectionId;
        const switch_detail = await switchDetails.fetchSelectedSwitch(
            selected_switch_id
        );
        const {
            price,
            title,
            description,
            image: imageUrl,
            id,
        } = switch_detail;
        const text = generateSwitchText({
            title,
            description,
            price,
        });

        await Whatsapp.sendImage({
            recipientPhone,
            url: imageUrl,
            caption: text,
        });
        await sendSwitchOptions(recipientPhone, message_id, id);
    }
};

const generateSwitchText = ({ title, description, price }) => {
    return (
        `_Title_: *${title.trim()}*\n\n` +
        `_Description_: ${description.trim()}\n\n` +
        `_Price_: ₹${price}\n`
    );
};

const sendSwitchOptions = async (recipientPhone, message_id, product_id) => {
    const message = `Here is your switch, what do you want to do next?`;
    const listOfButtons = [
        { title: 'Add to cart🛒', id: `add_to_cart_${product_id}` },
        { title: 'Speak to a human', id: 'speak_to_human' },
        { title: 'See more products', id: 'see_switches' },
    ];
    await sendTextMessageOptionsWithButtons(
        recipientPhone,
        message,
        listOfButtons
    );
};

const handleSimpleButtonMessage = async (
    incomingMessage,
    recipientPhone,
    message_id,
    recipientName
) => {
    const button_id = incomingMessage.button_reply.id;

    if (button_id === 'speak_to_human') {
        await sendHumanContactDetails(recipientPhone);
    } else if (button_id.startsWith('add_to_cart_')) {
        const product_id = button_id.split('add_to_cart_')[1];
        await addToCart({ recipientPhone, product_id });
        await updateCart(recipientPhone, message_id);
    } else if (button_id === 'checkout') {
        await checkout(recipientPhone, recipientName, message_id);
    } else if (button_id === 'print_invoice') {
        await printInvoice(recipientPhone, recipientName);
    } else if (button_id === 'set_quantity') {
        await setQuantitUpdatedCart(recipientPhone, incomingMessage);
    } else if (button_id === 'pay_with_stripe') {
        await payWithStripe(recipientPhone, recipientName);
    }
    // switchs
    else if (button_id === 'see_switches') {
        await sendSwitches(recipientPhone, message_id);
    }
    // for indiviual switches
    else if (button_id.startsWith('switch_')) {
        const selectedSwitch = button_id.split('switch_')[1];
        await sendIndividualSwitch(
            selectedSwitch,
            recipientPhone,
            recipientName
        );
    }
};
const sendIndividualSwitch = async (
    selectedSwitch,
    recipientPhone,
    recipientName
) => {
    const switchDetail = switchDetails[selectedSwitch];

    if (switchDetail) {
        await Whatsapp.sendText({
            message: `${recipientName} 😉, \n\nHere are the details for the **${switchDetail.title}**:\n\n${switchDetail.description}\n\n🌟 Rating: ${switchDetail.rating}\n\nYou can place an order, inquire about availability, or ask for more details. Just type your request below! 📦`,
            recipientPhone: recipientPhone,
        });
        await Whatsapp.sendSimpleButtons({
            message: `You've selected the **${switchDetail.title}**. Please choose the desired amperage:`,
            recipientPhone: recipientPhone,
            listOfButtons: [
                { title: '10A', id: 'switch_ampere_1' },
                { title: '20A', id: 'switch_ampere_2' },
                { title: '30A', id: 'switch_ampere_3' },
            ],
        });
    } else {
        await Whatsapp.sendText({
            message: `Sorry, I couldn't find the details for the selected switch.`,
            recipientPhone: recipientPhone,
        });
    }
};
const sendSwitches = async (recipientPhone, message_id) => {
    const listOfSections = [
        {
            title: `🏆 Top Switchs`,
            rows: switchDetails.switchDetails,
        },
    ];
    await Whatsapp.sendRadioButtons({
        headerText: `Power in Both Directions: The Reverse Forward Switch 🔄`,
        bodyText: `Tool and machinery operation: Many industrial tools and machines require the ability to operate in both forward and reverse directions, such as lathes 🔄, drills 🔩, grinders 🛠️, and mixers 🥣.`,
        footerText: 'Unlock Bidirectional Power - Upgrade Your Tools Today! 🚀',
        recipientPhone,
        message_id,
        listOfSections,
    });
};

const sendHumanContactDetails = async (recipientPhone) => {
    await Whatsapp.sendText({
        recipientPhone,
        message: `Not to brag, but unlike humans, chatbots are super fast⚡, we never sleep, never rest, never take lunch🍽 and can multitask.\n\nAnway don't fret, a hoooooman will 📞contact you soon.\n\nWanna blast☎ his/her phone😈?\nHere are the contact details:`,
    });

    await Whatsapp.sendContact({
        recipientPhone,
        contact_profile: {
            addresses: [{ city: 'Mumbai', country: 'India' }],
            name: { first_name: 'Punit', last_name: 'Mistry' },
            org: { company: 'Punit Whatsapp bot Shop' },
            phones: [{ phone: '+91 8286075880' }],
        },
    });
};

const addToCart = async ({ product_id, recipientPhone }) => {
    const product = await switchDetails.fetchSelectedSwitch(product_id);
    product.quantity = 1; // Set default quantity to 1
    CustomerSession.get(recipientPhone).cart.push(product);
};

const listOfItemsInCart = (recipientPhone) => {
    const products = CustomerSession.get(recipientPhone).cart;
    const total = products.reduce(
        (acc, product) => acc + product.price * product.quantity,
        0
    );
    const count = products.length;
    return { total, products, count };
};
const updatedCartQuantity = (recipientPhone, currentQuantity) => {
    const products = CustomerSession.get(recipientPhone).cart;
    products.forEach((product) => {
        product.quantity = currentQuantity;
    });
};

const updateCart = async (recipientPhone, message_id) => {
    const numberOfItemsInCart = listOfItemsInCart(recipientPhone).count;

    const message = `Your cart has been updated.\nNumber of items in cart: ${numberOfItemsInCart}.\n\nWhat do you want to do next?`;
    const listOfButtons = [
        // { title: 'Checkout 🛍️', id: 'checkout' },
        // { title: 'See more products', id: 'see_switches' },
        { title: 'Set Quantity 🔢', id: 'set_quantity' },
    ];
    await sendTextMessageOptionsWithButtons(
        recipientPhone,
        message,
        listOfButtons
    );
};
const setQuantitUpdatedCart = async (recipientPhone, incomingMessage) => {
    console.log('incomingMessage,', incomingMessage);
    // const { message: { text: { body: quantity } } } = incomingMessage;
    const message = ` please let me know how much you would like to order.`;
    // const listOfButtons = [
    //     { title: 'Checkout 🛍️', id: 'checkout' },
    //     { title: 'See more products', id: 'see_switches' },
    // ];
    await sendTextMessageOptionsWithButtons(recipientPhone, message, []);
};

const checkout = async (recipientPhone, recipientName, message_id) => {
    const finalBill = listOfItemsInCart(recipientPhone);
    let invoiceText = `List of items in your cart:\n`;

    finalBill.products.forEach((item, index) => {
        invoiceText += `\n#${index + 1}: ${item.title} @ ₹${item.price} x ${
            item.quantity
        }`;
    });

    // Calculate GST
    const gstPercentage = 0.18;
    const gstAmount = finalBill.total * gstPercentage;
    const totalWithGst = finalBill.total + gstAmount;

    switchDetails.generatePDFInvoice({
        order_details: invoiceText,
        file_path: `./invoice_${recipientName}.pdf`,
        recipientName,
        finalBill: { finalBill, gstAmount, totalWithGst },
    });

    await Whatsapp.sendText({ message: invoiceText, recipientPhone });

    await Whatsapp.sendSimpleButtons({
        recipientPhone,
        message: `Thank you for shopping with us, ${recipientName}.\n\nYour order has been received & will be processed shortly.`,
        message_id,
        listOfButtons: [
            { title: 'See more products', id: 'see_switches' },
            { title: 'Print my invoice', id: 'print_invoice' },
        ],
    });

    // clearCart(recipientPhone);
};

const printInvoice = async (recipientPhone, recipientName) => {
    await Whatsapp.sendDocument({
        recipientPhone,
        caption: `Brown Switches invoice #${recipientName}`,
        file_path: `./invoice_${recipientName}.pdf`,
    });

    // const warehouse = Store.generateRandomGeoLocation();

    const message = `Your order has been fulfilled. Come and pick it up, as you pay, here:`;
    await sendTextMessageOptionsWithButtons(recipientPhone, message, [
        { title: 'Pay with Stripe', id: 'pay_with_stripe' },
    ]);
    //     await Whatsapp.sendLocation({
    //         recipientPhone,
    //         latitude: warehouse.latitude,
    //         longitude: warehouse.longitude,
    //         address: warehouse.address,
    //         name: 'Punit Whatsapp bot Shop',
    //     });
};

const payWithStripe = async (recipientPhone, recipientName) => {
    const finalBill = listOfItemsInCart(recipientPhone);
    const amount = finalBill.total ; 
    const currency = 'inr'; // Indian Rupees

    try {
        const stripeUrl = await stripePayment(amount, currency);
        console.log('stripeUrl', stripeUrl);

        const message = `Please pay ₹${finalBill.total.toFixed(
            2
        )} using Stripe:\n\n${stripeUrl}`;
        await Whatsapp.sendText({ message, recipientPhone });
        await Whatsapp.sendSimpleButtons({
            recipientPhone,
            message: `Your order total is ₹${finalBill.total.toFixed(
                2
            )}. Please complete payment.`,
            listOfButtons: [
                { title: 'Pay Now', id: 'pay_with_stripe' },
                { title: 'Cancel', id: 'cancel_payment' },
            ],
        });
    } catch (error) {
        console.error('Error during Stripe payment:', error);
        await Whatsapp.sendText({
            message: 'An error occurred while processing your payment.',
            recipientPhone,
        });
    }
};
const clearCart = (recipientPhone) => {
    CustomerSession.get(recipientPhone).cart = [];
    CustomerSession.delete(recipientPhone);
    storeMessageMain = [];
};

module.exports = { router };
