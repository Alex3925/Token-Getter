const axios = require('axios');
const fs = require('fs');
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('.'));

function log() {
    console.log("\x1b[32m%s\x1b[0m", ...arguments);
}

function errorLog() {
    console.error("\x1b[31m%s\x1b[0m", ...arguments);
}

let file = [];
try {
    file = JSON.parse(fs.readFileSync('eytokens.json', 'utf-8')) || [];
} catch (err) {
    log("⚠️ Failed to read 'eytokens.json'. Initializing new file.");
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomName() {
    var name = ["nega"];
    return name[Math.floor(Math.random() * name.length)] +
           Array(6).fill(0).map(() => Math.random().toString(36).charAt(2)).join('');
}

function save(data) {
    try {
        fs.writeFileSync('eytokens.json', JSON.stringify(data, null, 4), 'utf-8');
    } catch (err) {
        errorLog("❌ Error saving file:", err.message);
    }
}

const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'requestfrom': 'H5',
    'origin': 'https://slotmax.vip',
    'referer': 'https://slotmax.vip/register',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
};

async function create(retryCount = 3) {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
            const number = "9" + Array(9).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
            const username = randomName();
            const config = {
                method: 'POST',
                url: 'https://slotmax.vip/api/user/custom/register',
                headers,
                data: {
                    username,
                    password: "3b64b35b9ccdc8495e585f83d6d726bb",
                    code: "",
                    phone: number,
                    areaCode: "63"
                },
                timeout: 10000 // 10-second timeout
            };
            const response = await axios.request(config);
            log("Response headers:", JSON.stringify(response.headers, null, 2));
            const cookie = response.headers["set-cookie"]?.join('; ') || null;
            if (cookie) {
                file.push(cookie);
                save(file);
                return { success: true, username, cookie };
            } else {
                errorLog(`Attempt ${attempt}: No cookie received. Response status: ${response.status}`);
                if (attempt === retryCount) {
                    return { success: false, message: "No cookie received after retries." };
                }
                await delay(5000); // Wait 5 seconds before retrying
            }
        } catch (err) {
            errorLog(`Attempt ${attempt}: Error creating account:`, err.message);
            if (attempt === retryCount) {
                return { success: false, message: err.message || "Failed to create account." };
            }
            await delay(5000);
        }
    }
}

async function smsotp(phone) {
    try {
        if (file.length === 0) {
            throw new Error("No tokens available.");
        }
        const cookie = file[Math.floor(Math.random() * file.length)];
        const config = {
            method: 'POST',
            url: 'https://slotmax.vip/api/user/sms/send/bind',
            headers: { ...headers, cookie, 'referer': 'https://slotmax.vip/wallet' },
            data: { phone, areaCode: "63" }
        };
        const response = await axios.request(config);
        return { success: true, data: response.data };
    } catch (err) {
        throw new Error(err.message || err);
    }
}

// API Endpoints
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/create', async (req, res) => {
    try {
        const result = await create();
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/sms', async (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number required.' });
    }
    try {
        const result = await smsotp(phone);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/tokens', (req, res) => {
    res.json(file);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
