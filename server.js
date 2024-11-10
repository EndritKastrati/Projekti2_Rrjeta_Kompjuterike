const dgram = require('dgram');
const fs = require('fs');
const path = require('path');
const server = dgram.createSocket('udp4');

const PORTI = 40000;
const MAX_KONEKTIME = 4;
const KOHA_JOAKTIVE = 20000;
const LOKACIONI_FAJLLAV = './test-files';
const FAJLL_INFO = path.join(LOKACIONI_FAJLLAV, 'example.txt');

const ADMIN_ID = '2025';  // vec me qit ID munet clienti mu kon ADMIN.

let connections = 0;
const clients = {};

const PRIVILEGES = {
    admin: ['read', 'write', 'execute'],
    viewer: ['read']
};

const loadClientPrivileges = () => {
    const clientPrivileges = {};
    const data = fs.readFileSync(FAJLL_INFO, 'utf8');

    data.split('\n').forEach(line => {
        const [clientId, privilege] = line.trim().split(' ');
        if (clientId && privilege) {
            clientPrivileges[clientId] = privilege;
        }
    });

    return clientPrivileges;
};

const hasPermission = (clientId, action) => {
    const clientPrivilege = clients[clientId]?.privilege;
    return PRIVILEGES[clientPrivilege]?.includes(action);
};

server.on('listening', () => {
    const address = server.address();
    console.log(`Serveri po degjon ne portin: "${address.port}"`);
});

server.on('message', (message, remote) => {
    const clientId = `${remote.address}:${remote.port}`;
    const messageStr = message.toString();

    if (!clients[clientId]) {
        if (connections >= MAX_KONEKTIME) {
            server.send('U arrit numri maksimal i lidhjeve ne server. Ju lutem provoni me vone.', remote.port, remote.address);
            return;
        }

        const clientPrivileges = loadClientPrivileges();
        
        // KONTROLLOJM adminID
        const privilege = (messageStr === `checkPrivilege ${ADMIN_ID}`) ? 'admin' : (clientPrivileges[clientId] || 'viewer');
        
        clients[clientId] = { lastSeen: Date.now(), privilege };
        connections++;
        console.log(`Lidhje e re nga klienti me IP-adress: ${clientId} me privilegjin: "${privilege}"`);
    } else {
        clients[clientId].lastSeen = Date.now();
    }

    if (messageStr.startsWith('checkPrivilege')) {
        const privilege = clients[clientId]?.privilege || 'viewer';
        server.send(`Privilegji i juaj: ${privilege}`, remote.port, remote.address);
        return;
    }

    const [action, filename, ...rest] = messageStr.split(' ');

    if (action && filename) {
        const filePath = path.join(LOKACIONI_FAJLLAV, filename);

        if (action === 'read' && hasPermission(clientId, 'read')) {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    server.send(`Gabim ne lexim: ${err.message}`, remote.port, remote.address);
                } else {
                    server.send(`Te dhenat e fajllit: ${data}`, remote.port, remote.address);
                }
            });
        } else if (action === 'write' && hasPermission(clientId, 'write')) {
            const content = rest.join(' ');
            fs.writeFile(filePath, content, (err) => {
                if (err) {
                    server.send(`Gabim ne shkrim: ${err.message}`, remote.port, remote.address);
                } else {
                    server.send(`Fajlli: ${filename} u shkrua me sukses.`, remote.port, remote.address);
                }
            });
        } else if (action === 'execute' && hasPermission(clientId, 'execute')) {
            const { exec } = require('child_process');
            exec(`cat ${filePath}`, (err, stdout, stderr) => {
                if (err) {
                    server.send(`Gabim ne ekzekutim: ${stderr}`, remote.port, remote.address);
                } else {
                    server.send(`Dalja nga ekzekutimi: ${stdout}`, remote.port, remote.address);
                }
            });
        } else {
            server.send(`Refuzohet veprimi per aksionin: "${action}"`, remote.port, remote.address);
        }
    } else {
        server.send('Komand jo-valide. Perdorni: <action> <file>', remote.port, remote.address);
    }

    const timestamp = new Date().toISOString();
    fs.appendFileSync('kerkesat.log', `[${timestamp}] ${clientId} kerkoi: ${messageStr}\n`);
});

setInterval(() => {
    const now = Date.now();
    for (const clientId in clients) {
        if (now - clients[clientId].lastSeen > KOHA_JOAKTIVE) {
            console.log(`Duke hequr klientin jo-aktiv me ID: ${clientId}`);
            delete clients[clientId];
            connections--;
        }
    }
}, 1);

server.bind(PORTI);