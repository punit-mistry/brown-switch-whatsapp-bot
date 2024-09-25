const production = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
};

const development = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: '3000',
     Meta_WA_VerifyToken: '123',
     Meta_WA_accessToken: 'EAAJxD6ZBIZBZC0BOZC83fz0acEjxztoFBVU2eBjospepvZBmgAH4B5zUCk44GJT6va6SMm4gc1WPcySmAYgg4ShI6Gmpl3Npo0l2sV7fT8NtHrh9BBlBZCHMrOswUp6qU7DRyEddtwMVZAcUI490KI94BcyKygVr50LPj9E2rWefItpUVHavqBgRQfrujcX4sVfSWs96ROjiUV10HlSDzaTRw0VCDkZD',
     Meta_WA_SenderPhoneNumberId: '206259279247584',
     Meta_WA_wabaId: '273316809193037',
     STRIPE_SECRET_KEY:'sk_test_51NAVLzSHq0pBp1cL3mr37dZKHIzDktBx8Ov1wfUoKjbo2aFDrUZ3NgMvQ4V9vO267N82zX033g1Mg1uAZAT7sZsI00XkNT9982'
};

const fallback = {
    ...process.env,
    NODE_ENV: undefined,
};

module.exports = (environment) => {
    console.log(`Execution environment selected is: "${environment}"`);
    if (environment === 'production') {
        return production;
    } else if (environment === 'development') {
        return development;
    } else {
        return fallback;
    }
};
