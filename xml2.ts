import * as fs from 'fs';
var expat = require('node-expat');
var parser = new expat.Parser('UTF-8');

var stream = fs.createReadStream('/Users/cody/Downloads/backup.20170208185701.xml');

var i = 0;
parser.on('startElement', function (name:any, attrs:any) {
    i++;
    if (i % 5000 === 0) console.log(i / 5);
    // console.log(name, attrs);
});
//
// parser.on('endElement', function (name:any) {
//     console.log(name);
// });
//
// parser.on('text', function (text:any) {
//     console.log(text);
// });
//
// parser.on('error', function (error:any) {
//     console.error(error);
// });


stream.on('data', (data: Buffer) => {
    parser.parse(data);
});