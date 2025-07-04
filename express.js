import express from "express";
const app = express();
const port = 3000;
import { getZohoRefreshToken } from "./zoho-helper.js";

//START AN EXPRESS SERVER
app.get('/authRedirect', (req, res) => {
    const authCode = req.query.code;
    try {
        getZohoRefreshToken(authCode)
        .then(token => {
            //console.log('token acquired: ' + token);
            process.env.ZOHO_REFRESH_TOKEN = token;
            res.send('You can close this page now. Refresh token acquired: ' + process.env.ZOHO_REFRESH_TOKEN);
        })
        .catch(err => {
            console.log(err);
        });
    } catch(err) {
        console.log(err);
    }
});

app.get('/', (req, res) => {
    res.send('Main Route. You can close this page');
});

app.listen(port, () => {
  console.error(`Auth server listening on port ${port}`);
});