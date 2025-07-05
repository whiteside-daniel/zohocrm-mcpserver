import express from "express";
const app = express();
const port = 3000;
import { getZohoRefreshToken, getZohoAccessToken } from "./zoho-helper.js";

console.error(`[${new Date().toISOString()}] Express Server - Starting server...`);
console.error(`[${new Date().toISOString()}] Express Server - Node.js version: ${process.version}`);
console.error(`[${new Date().toISOString()}] Express Server - Process PID: ${process.pid}`);
console.error(`[${new Date().toISOString()}] Express Server - trying now in folder ${process.cwd()}`);


//START AN EXPRESS SERVER
app.get('/authRedirect', (req, res) => {
    console.error('reached redirect auth');
    const authCode = String(req.query.code);
    console.error(`[${new Date().toISOString()}] Express Server - AuthCode: ${authCode}`);
    try {
        console.error(`[${new Date().toISOString()}] Express Server - trying to get Refresh Token`);
        getZohoRefreshToken(authCode)
        .then(({token , path }) => {
            console.error('token acquired: ' + token);
            process.env.ZOHO_REFRESH_TOKEN = token;
            res.send('You can close this page now. Refresh token acquired.');
        })
        .catch(err => {
            console.error(`[${new Date().toISOString()}] Express Server - Error: ${err}`);
        });
    } catch(err) {
        console.error(`[${new Date().toISOString()}] Express Server - Error: ${err}`);
    }
});

app.get('/', (req, res) => {
    res.send('Express Server working. You can close this page');
});
//try{
//    const token = await getZohoAccessToken();
//    console.error( `got a token : ${token}`);
//}
//catch(err) {
//    console.error(err);
//}

app.listen(port, () => {
  console.error(`Auth server listening on port ${port}`);
});

