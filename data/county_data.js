var downcache = require("downcache"),
	fs = require("fs"),
	csv = require("d3").csv,
	log = require("npmlog");

log.level = "verbose";

var argv = require('minimist')(process.argv.slice(2));

var options = {
	AGEGRP: "0",
	YEAR: "6"
}

if (argv.year) {
	switch(argv.year.toLowerCase()) {
		case "census": options.YEAR = "1"; break;
		case "base": options.YEAR = "2"; break;
		case "2010": options.YEAR = "3"; break;
		case "2011": options.YEAR = "4"; break;
		case "2012": options.YEAR = "5"; break;
		case "2013": options.YEAR = "6"; break;
		default: options.YEAR = "6";
	}
}

if (argv.age) {
	// do this later		
}


downcache("https://www.census.gov/popest/data/counties/asrh/2013/files/CC-EST2013-ALLDATA.csv", function(err, resp, body) {
	var data = csv.parse(body),
		counties = {};

	data.forEach(function(datum) {
		if (datum.YEAR == options.YEAR && datum.AGEGRP == options.AGEGRP) {
			var county = {
				fips: datum.STATE + datum.COUNTY,
				state: datum.STNAME,
				name: datum.CTYNAME,
				population: parseInt(datum.TOT_POP, 10),
				white:  parseInt(datum.NHWA_MALE, 10) + parseInt(datum.NHWA_FEMALE, 10),
				black:  parseInt(datum.NHBA_MALE, 10) + parseInt(datum.NHBA_FEMALE, 10),
				indian: parseInt(datum.NHIA_MALE, 10) + parseInt(datum.NHIA_FEMALE, 10),
				asian:  parseInt(datum.NHAA_MALE, 10) + parseInt(datum.NHAA_FEMALE, 10),
				hispanic: parseInt(datum.H_MALE, 10) + parseInt(datum.H_FEMALE, 10)
			};

			if (counties[county.fips]) {
				console.log("DUPLICATE", datum);
			}
			counties[county.fips] = county;
		}
	});
	fs.writeFileSync("files/data.json", JSON.stringify(counties, null, 2));
});