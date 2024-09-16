const production = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
};

const development = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: '3000',
     Meta_WA_VerifyToken: '123',
     Meta_WA_accessToken: 'EAAJxD6ZBIZBZC0BO034FiYwuRcDc9zZBJjpjVvAT6wpqRam4bCIhZCjg1agB4ww257tWvqboX2Bg0ZAZB69maO2RscK5nxZArIOevGrov2jqPZBRghSt2FhyA2JANegsErJQgug3b58BSITbV7NzB5gv51ZCLd5tqq5h1ll8ZCodqHFjZBwzp02PZAwLkiU3G1bLb9PJTIxrxOJbOamQSBZCJVnZCZAUtTD5xH6lJgZDZD',
     Meta_WA_SenderPhoneNumberId: '206259279247584',
     Meta_WA_wabaId: '273316809193037',
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
