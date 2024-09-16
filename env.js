const production = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
};

const development = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: '3000',
     Meta_WA_VerifyToken: '123',
     Meta_WA_accessToken: 'EAAJxD6ZBIZBZC0BO3BWE0x4DLsoAGV3zwbKxTPpJNoriU0I2NgZAKwxuHQcSjAd7rwkvaeGT95wAbD29k20zwu2exXXveN7GEyZCBjXvrX0R8JaoCZALIjkXSJQYwnzV7yP9IiDZAZBxOcNcGVAKZA2v3g8UcmDmikfL65wYhZAUeBf2FcZCQiVmQlD0M8hY0zvKHa4MhzEXTX2ZAZCOiLG6MOvtZBKo6hZC2gZD',
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
