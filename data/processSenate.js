var d3 = require('d3'),
    fs = require("fs");
var masterSenates = {};
var e2008 = fs.readFileSync('./files/2008.csv', 'utf8');
var e2010 = fs.readFileSync('./files/2010.csv', 'utf8');
var e2012 = fs.readFileSync('./files/2012.csv', 'utf8');
var electionResults = e2008 + e2010 + e2012;
var count = 0;
var lengthTotal = electionResults.split('\n').length;
lengthTotal -= 2;
d3.csv.parse(electionResults, function(dat, ind) {
    count += 1;
    processRows(dat);
});

function processRows(dat){
    var race = [];
    race.push(dat.Democratic);
    race.push(dat.Republican);
    if(masterSenates.hasOwnProperty(dat.FIPS)){
        masterSenates[dat.FIPS].push(race);
    }
    else {
        masterSenates[dat.FIPS] = [];
        masterSenates[dat.FIPS].push(race);
    }
    if(count == lengthTotal){
        createCSV(masterSenates);
    }
}

function sortNumber(a,b) {
    return a - b;
}

function createCSV(masterSenates){
    var countyResults = [];
    Object.keys(masterSenates).forEach(function(data,index){
        var county = masterSenates[data];
        var countyResult = [];
        countyResult[0] = data;
        if(county.length == 2){
            countyResult[1] = county[0][0];
            countyResult[2] = county[0][1];
            countyResult[3] = county[1][0];
            countyResult[4] = county[1][1];
        }
        else {
            var newCounty = county.slice(-2);
            newCounty.forEach(function(d,i){
                if(d.length == 2){
                    countyResult.push(d[0]);
                    countyResult.push(d[1]);                    
                }
            });
        }
        countyResults.push(countyResult);
    });
    writeCSV(countyResults);
}

function writeCSV(countyResult){
    var csvString = '';
    countyResult.forEach(function(dat,ind){
        csvString += dat.join(',') + '\n';
    });
    fs.writeFileSync('finalSenateResults.csv', csvString);
    console.log('File Write Complete');
}
function writeJSONFile(row) {
    var filename = "specialities.json";
    fs.writeFileSync(filename, JSON.stringify(row, null, 2));
}