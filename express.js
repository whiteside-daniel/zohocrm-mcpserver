import express from "express";
const app = express();
const port = 3000;
import { getZohoRefreshToken } from "./zoho-helper.js";

console.error(`[${new Date().toISOString()}] Express Server - Starting server...`);
console.error(`[${new Date().toISOString()}] Express Server - Node.js version: ${process.version}`);
console.error(`[${new Date().toISOString()}] Express Server - Process PID: ${process.pid}`);

//START AN EXPRESS SERVER
app.get('/authRedirect', (req, res) => {
    const authCode = req.query.code;
    try {
        getZohoRefreshToken(authCode)
        .then(token => {
            //console.log('token acquired: ' + token);
            process.env.ZOHO_REFRESH_TOKEN = token;
            res.send('You can close this page now. Refresh token acquired.');
        })
        .catch(err => {
            console.error(err);
        });
    } catch(err) {
        console.error(err);
    }
});

app.get('/', (req, res) => {
    res.send('Express Server working. You can close this page');
});

app.listen(port, () => {
  console.error(`Auth server listening on port ${port}`);
});