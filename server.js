const dgram = require('dgram');
const fs = require('fs');
const path = require('path');
const server = dgram.createSocket('udp4');

const PORTI = 40000;
const MAX_KONEKTIME = 1;
const KOHA_JOAKTIVE = 20000;
const LOKACIONI_FAJLLAV = './test-files';
const FAJLL_INFO = path.join(LOKACIONI_FAJLLAV, 'example.txt');