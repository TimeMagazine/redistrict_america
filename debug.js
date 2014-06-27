(function($) {
	var time = require('time-interactive'),
		base = require("d3-base"),
		d3 = require('d3'),
		topojson = require("topojson"),
		helper = require("./src/topojson.helper.js"),
		cb = require("colorbrewer");

	var el = time("redistrict_america");

	//MARKUP
	$(require("./src/base.html")({
		headline: "",
		intro: ""
	})).appendTo(el);

	var b = base(el);

	var topology = require("./src/us.json");

	var path = d3.geo.path();

	var data = {};

	var states = {};

	//CSS
	require("./src/styles.less");

	var color = d3.scale.category20c(),
		new_colors = cb.Accent[7];

	var counties = topojson.feature(topology, topology.objects.counties).features,
    	neighbors = topojson.neighbors(topology.objects.counties.geometries);

	require("./data/counties.csv").forEach(function(d) {
		d.id = d.FIPS;
    	if (d.id.length == 4) {
    		d.id = "0" + d.id;
    	}
    	d.state = d.id.slice(0, 2);
    	data[d.id] = d;
	});

    counties.forEach(function(county, i) {
    	county.properties.id = String(county.id);
    	if (county.properties.id.length == 4) {
    		county.properties.id = "0" + county.properties.id;
    	}
    	county.properties.neighbors = neighbors[i];
    	county.properties.index = i;
    	county.properties.state = county.properties.id.slice(0,2);
    	county.properties.newstate = county.properties.state;
    });

    var pressed = null,
    	next_state = 0;

	b.svg.selectAll(".county")
      .data(counties)
    .enter().append("path")
    	.attr("class", "county")
      .attr("d", path)
		.attr("id", function(d) {
			return "county_" + d.properties.index;
		})
		.style("fill", function(d, i) { 
			return color(d.properties.state);
		}).on("click", function(d) {
			/*
			console.log(d3.select(this).attr("d").split(/[ML]/g));
			d.properties.neighbors.forEach(function(n) {
				d3.select("#county_" + n).style("fill", "yellow");
			})
			*/
		}).on("mousedown", function(d) {
			pressed = d;
			console.log(pressed);
		}).on("mouseup", function(d) {
			pressed = false;
		}).on("mouseover", function(d) {
			if (!pressed) {
				return;
			}
			console.log(pressed.properties.newstate)
			var isAdjacent = false;
			d.properties.neighbors.forEach(function(n) {
				if (counties[n].properties.newstate === pressed.properties.newstate) {
					isAdjacent = true;
					return 0;
				}
			});
			if (isAdjacent) {
				d.properties.newstate = pressed.properties.newstate;
				d3.select(this).style("fill", pressed.color || color(pressed.properties.newstate));
			}
		}).on("dblclick", function(d) {
			d3.select(this).style("fill", new_colors[next_state]);
			d.color = new_colors[next_state];
			d.properties.newstate = next_state + 100;
			next_state += 1;
		});

}(window.jQuery));

