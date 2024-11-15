const dgram = require('dgram');
const readline = require('readline');
const client = dgram.createSocket('udp4');

const SERVER_PORT = 40000;
const SERVER_IP = '127.0.0.1';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let clientId;

// Lidhja e klientit ne nje port random.
client.bind(() => {
    promptClientId();
});

const promptClientId = () => {

    const promptText = '\x1b[32mJepni ID tuaj:\x1b[0m'; // ndryshimi i ngjyres ne terminal.
    const promptText2= '\x1b[31mError ne ID-ne tuaj:\x1b[0m';

    rl.question(promptText+ ' ', (id) => {
        clientId = id;

        // Dergon klientID te serveri me e kqyr a o admin a viewer.
        client.send(`checkPrivilege ${clientId}`, SERVER_PORT, SERVER_IP, (err) => {
            if (err) {
                console.error(promptText2 + '', err);
                client.close();
            }
        });
    });
};

const promptText3= '\x1b[31mKomand jo-valide. Ju lutem jepni vetem njeren nga komandat: "read", "write", ose "execute".\x1b[0m';

const promptText6= '\x1b[32mJepni komanden qe deshironi (read, write, execute):\x1b[0m';
const promptUser = () => {
    rl.question(promptText6 + ' ', (action) => {
        if (!['read', 'write', 'execute'].includes(action)) {
            console.log(promptText3 + ' ');
            return promptUser();
        }

        const promptText4= '\x1b[32mJu lutem jepni emrin e fajllit:\x1b[0m';
        const promptText5= '\x1b[32mCka deshironi te shkruani:\x1b[0m';

        rl.question(promptText4 + ' ', (filename) => {
            if (action === 'write') {
                rl.question(promptText5 + ' ', (content) => {
                    const message = `${action} ${filename} ${content}`;
                    sendMessage(message);
                });
            } else {
                const message = `${action} ${filename}`;
                sendMessage(message);
            }
        });
    });
};
const sendMessage = (message) => {
    console.log(`Duke derguar kerkese: "${message}" nga klienti me ID: "${clientId}"`);
    client.send(message, SERVER_PORT, SERVER_IP, (err) => {
        if (err) {
            console.error('Gabim gjate dergimit te kerkeses:', err);
            client.close();
        }
    });
};

client.on('message', (msg) => {
    const response = msg.toString();

    const promptText3= '\x1b[32mPrivilegji juaj eshte:\x1b[0m';

    if (response.startsWith('Privilegji:')) {
        const privilege = response.split(':')[1].trim();
        console.log(promptText3 + ` ${privilege}`);
        promptUser();
    } else {
        console.log(`Pergjigja nga serveri: ${response}`);
        promptUser();
    }
});

client.on('error', (err) => {
    console.error(`Gabim ne klient: ${err}`);
    client.close();
});

// Starton programi nga ky funksion duke kerkuar ID e klientit.
promptClientId();
