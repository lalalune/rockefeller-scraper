const puppeteer = require('puppeteer-extra');

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// read links.json into an array of links
const fs = require('fs');
// read all files in data
const files = fs.readdirSync('data');

// for each file in data, if its json, read it
const filteredFiles = files.filter(file => file.includes('teamMemberData') && file.includes('.json'));

// for each file in data, read it
const data = filteredFiles.map(file => {
    return JSON.parse(fs.readFileSync(`data/${file}`, 'utf8'));
});

// for each in data, check if the first key in the first object in the array is 'teamMemberData'
// if it is, then we want to save these files to "fix"

let flatMap = [];

const finalData = data.map(datum => {
    flatMap.push(datum);
});

// flatMap is na array of arrays
// unpack into a single array
flatMap = flatMap.reduce((acc, val) => acc.concat(val), []);

// write the finalData to a file
fs.writeFileSync('data/gooddata.json', JSON.stringify(flatMap), 'utf8');

// conditions to fix in objectMap:
// 1 - jobTitle contains .com (filter into by-hand)
// 2 - email contains Biography (remove remail)
// jobtitle includes jobTitle -- not split properly
// name includes "         " -- remove

// save the objectMap to csv

// import ObjectsToCsv 
const inputPath = './data/gooddata.json';

const outputPath = './gooddata.csv';

const { createReadStream, createWriteStream } = require('fs');
const { Transform } = require('@json2csv/node');

const input = createReadStream(inputPath, { encoding: 'utf8' });

const output = createWriteStream(outputPath, { encoding: 'utf8' });

const opts = {};
const transformOpts = {};
const asyncOpts = {};
const parser = new Transform(opts, transformOpts, asyncOpts);
const parser2 = new Transform(opts, transformOpts, asyncOpts);

const processor1 = input.pipe(parser).pipe(output);

processor1.on('finish', () => {
    console.log('Done!');
});