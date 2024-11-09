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