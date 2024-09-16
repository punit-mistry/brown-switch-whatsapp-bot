process.env = require('./env.js')(process.env.NODE_ENV || 'development');
const port = process.env.PORT || 9000;
const express = require('express');

let {router: indexRoutes} = require('./routes/index');

const main = async () => {
    console.log(process.env.Meta_WA_accessToken,"this is the access token")
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use('/', indexRoutes);
    app.use('*', (req, res) => res.status(404).send('404 Not Found'));
    app.listen(port, () =>
        console.log(`App now running and listening on port ${port}`)
    );
};
main();
