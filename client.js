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
    rl.question('Jepni ID tuaj: ', (id) => {
        clientId = id;

        // Dergon klientID te serveri me e kqyr a o admin a viewer.
        client.send(`checkPrivilege ${clientId}`, SERVER_PORT, SERVER_IP, (err) => {
            if (err) {
                console.error('Error ne ID-ne tuaj:', err);
                client.close();
            }
        });
    });
};


const promptUser = () => {
    rl.question('Jepni komanden qe deshironi (read, write, execute): ', (action) => {
        if (!['read', 'write', 'execute'].includes(action)) {
            console.log('Komand jo-valide. Ju lutem jepni vetem njeren nga komandat: "read", "write", ose "execute".');
            return promptUser();
        }

        rl.question('Ju lutem jepni emrin e fajllit: ', (filename) => {
            if (action === 'write') {
                rl.question('Cka deshironi te shkruani: ', (content) => {
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