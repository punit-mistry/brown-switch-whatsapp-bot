const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.stripePayment = async (amount, currency) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency,
          unit_amount: amount,
          product_data: {
            name: 'Brown Switches',
          },
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://your-domain.com/success',
      cancel_url: 'https://your-domain.com/cancel',
      billing_address_collection: 'required',
      shipping_address_collection: {
      allowed_countries: ['IN'], // Adjust this array based on the countries you want to allow
      },
    });

    return session.url;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
