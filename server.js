const dgram = require('dgram');
const fs = require('fs');
const path = require('path');
const server = dgram.createSocket('udp4');

const PORTI = 40000;
const MAX_KONEKTIME = 1;
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

