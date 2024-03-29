(function($) {
    var time = require('time-interactive'),
        base = require("d3-base"),
        d3 = require('d3'),
        topojson = require("topojson"),
        helper = require("./src/topojson.helper.js");
    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 9])
        .on("zoom", move);

    var stateMaster = {};
    countyData = require('./data/files/cleanedCounties.csv');
    countyJSON = {};
    countyData.forEach(function(dat, ind) {
        countyJSON[dat.FIPS] = dat;
    });
    //CSS
    require("./src/styles.less");

    //MARKUP
    var stat_field = require("./src/stat_field.html");

    var el = time("redistrict_america");
    $(require("./src/base.html")({
        headline: "<span>REDISTRICT AMERICA</span>",
        intro: "<strong>CLICK AND DRAG</strong> to expand a state into neighboring counties. <strong>DOUBLECLICK</strong> a county to break it off into a new state."
    })).appendTo(el);

    // DATA
    var topology = require("./data/files/counties.json"), // boundary definitions
        data = require("./data/files/data.json"), // demographic data
        counties = topojson.feature(topology, topology.objects.counties).features,
        neighbors = topojson.neighbors(topology.objects.counties.geometries),
        index = {}; // dictionary of counties for looking up neighbors


    // connect data to counties
    counties.forEach(function(county, i) {
        county.data = countyJSON[parseInt(county.id)];
        delete countyJSON[parseInt(county.id)];
        county.properties.neighbors = neighbors[i];
        county.properties.state = county.properties.original_state = county.id.slice(0, 2); // get state from two-digit abbrev in fips code 
        index[county.id] = county.properties.state;
    });

    // SVG
    var b = base("#usmap", {
        width: 900,
        dontresize: true
    });
    var path = d3.geo.path().projection(null);

    var pressed = null, // which state we originally pressed
        justpressed = null, // weird thing where mouseup triggers mouseout
        next_state = 0; // for tracking new states

    b.svg.call(zoom);

    // state borders, which go under the thinkly transparent boundaries for simplicity's sake
    b.svg.append("g").attr("class", "borders");

    // draw counties
    b.svg.append("g").attr("class", "counties").selectAll(".county")
        .data(counties)
        .enter()
        .append("path")
        .attr("class", function(d) {
            return "county state-" + d.properties.state;
        })
        .attr("id", function(d) {
            return "county-" + d.properties.id;
        })
        .attr("d", path)
        .on("click", function(d) {})
        .on("mousedown", function(d) {
            pressed = d;
            fillConsole(pressed);
        })
        .on("mouseup", function(d) {
            pressed = false;
            justpressed = true;
            updateBorders();
        })
        .on("mouseover", function(d) {
            if (!pressed) {
                // highlight entire state
                fillConsole(d);
                d3.selectAll(".county").classed("over", false);
                d3.selectAll(".state-" + d.properties.state).classed("over", true);
                return;
            }

            // is this new county eligible for inclusion into current new state?
            if (d.properties.state === pressed.properties.state) {
                return;
            }

            // see if any of the adjacent counties have the same state value as the original pressed one 
            var isAdjacent = false;
            d.properties.neighbors.forEach(function(n) {
                if (counties[n].properties.state === pressed.properties.state) {
                    isAdjacent = true;
                    return 0;
                }
            });

            if (isAdjacent) {
                moveCounty(this, d, pressed);
            }
        }).on("mouseout", function(d) {
            if (!pressed && !justpressed) {
                d3.selectAll(".state-" + d.properties.state).classed("over", false);
            }
            justpressed = false;
        }).on("dblclick", function(d) {
            var name = window.prompt("Please enter a name for your new state.");
            if (name && name !== "") {
                var new_id = next_state + 100;
                next_state += 1;
                d.properties.state = new_id;
                d.data.STATE = name;
                moveCounty(this, d, d);
                updateBorders();

                d3.selectAll(".county").classed("over", false);
                d3.selectAll(".state-" + d.properties.state).classed("over", true);

            } else {
                alert("Sorry, you need to enter a name for a new state.");
            }
        });

    function fillConsole(st) {
        $("#stname").html(st.data.STATE.split(", ")[1].toUpperCase());
        $("#stat_fields").empty();
        $(stat_field({
            name: "POPULATION",
            value: time.commafy(getPop(st.properties.state)),
            border_color: "pink"
        })).appendTo("#stat_fields");

        $(stat_field({
            name: "MEAN INCOME",
            value: time.commafy(Math.round(getWeightedAvg(st.properties.state, "MPE"))),
            border_color: "green"
        })).appendTo("#stat_fields");

        $(stat_field({
            name: "ROMNEY",
            value: Math.round(100 * getSum(st.properties.state, "ROMNEY") / (getSum(st.properties.state, "OBAMA") + getSum(st.properties.state, "ROMNEY"))) + "%",
            border_color: "red"
        })).appendTo("#stat_fields");

        $(stat_field({
            name: "OBAMA",
            value: Math.round(100 * getSum(st.properties.state, "OBAMA") / (getSum(st.properties.state, "OBAMA") + getSum(st.properties.state, "ROMNEY"))) + "%",
            border_color: "blue"
        })).appendTo("#stat_fields");

        $(stat_field({
            name: "WHITE",
            value: Math.round(100 * getSum(st.properties.state, "WNLPOP") / getPop(st.properties.state)) + "%",
            border_color: "gray"
        })).appendTo("#stat_fields");

        $(stat_field({
            name: "AFRICAN AMERICAN",
            value: Math.round(100 * getSum(st.properties.state, "AFAPOP") / getPop(st.properties.state)) + "%",
            border_color: "gray"
        })).appendTo("#stat_fields");

        $(stat_field({
            name: "HISPANIC",
            value: Math.round(100 * getSum(st.properties.state, "LATPOP") / getPop(st.properties.state)) + "%",
            border_color: "gray"
        })).appendTo("#stat_fields");

        $(stat_field({
            name: "ASIAN AMERICAN",
            value: Math.round(100 * getSum(st.properties.state, "ASAPOP") / getPop(st.properties.state)) + "%",
            border_color: "gray"
        })).appendTo("#stat_fields");

        $(stat_field({
            name: "NATIVE AMERICAN",
            value: Math.round(100 * getSum(st.properties.state, "NAPOP") / getPop(st.properties.state)) + "%",
            border_color: "gray"
        })).appendTo("#stat_fields");

        $(stat_field({
            name: "Congressional Seats",
            value: stateMaster[st.properties.state].totalReps,
            border_color: "gray"
        })).appendTo("#stat_fields");
        $(stat_field({
            name: "Senate",
            value: calculateSenate(st.properties.state, 1) + ' \n ' + calculateSenate(st.properties.state, 2),
            border_color: "gray"
        })).appendTo("#stat_fields");

        /*
        $(stat_field({
            name: "OTHER ETHNICITY",
            value: time.commafy(getSum(st.properties.state, "OTHERPOP")),
            border_color: "pink"
        })).appendTo("#stat_fields");
        */
    }

    function calculateSenate(state, seat) {
        var Democratic = getSum(state, "s" + seat + "D");
        var Republican = getSum(state, "s" + seat + "R");
        var total = Democratic + Republican;
        var DemPct = Math.floor((Democratic / total) * 100);
        var RepPct = Math.floor((Republican / total) * 100);
        var winner = 0;
        if (DemPct > RepPct) {
            winner = ' D:' + DemPct;
        } else {
            winner = ' R:' + RepPct;
        }
        return 'S' + seat + winner;
    }

    function moveCounty(obj, county, new_state) {
        county.properties.state = new_state.properties.state;
        county.data.STATE = new_state.data.STATE;
        d3.select(obj).attr("class", "over county state-" + new_state.properties.state);
        index[county.id] = new_state.properties.state;
        fillConsole(new_state);
    }

    function makeStates() {
        return d3.nest()
            .key(function(d) {
                return index[d.id];
            })
            .sortKeys(function(a, b) {
                return a - b;
            })
            .entries(topology.objects.counties.geometries);
    }

    function move() {
    var shiftDown = event.shiftKey;
    var mousedown = event.mousedown;
    console.log(shiftDown,mousedown);
    if(shiftDown){
        var t = d3.event.translate;
        var s = d3.event.scale;
        zscale = s;
        var height = $('#usmap').height();
        var width = $('#usmap').width();
        var h = height / 4;


        t[0] = Math.min(
            (width / height) * (s - 1),
            Math.max(width * (1 - s), t[0])
        );

        t[1] = Math.min(
            h * (s - 1) + h * s,
            Math.max(height * (1 - s) - h * s, t[1])
        );
        console.log(s,t);
        zoom.translate(t);
        b.svg.selectAll('g').attr("transform", "translate(" + t + ")scale(" + s + ")");
        //adjust the country hover stroke width based on zoom level
    }
    }

    function updateBorders() {
        b.svg.select(".borders").selectAll(".border")
            .data(makeStates())
            .enter()
            .append("path")
            .attr("id", function(d) {
                return "state-" + d.key;
            })
            .attr("class", "border");

        b.svg.select(".borders").selectAll(".border")
            .data(makeStates())
            .exit()
            .remove();


        b.svg.select(".borders").selectAll(".border")
            .attr("d", function(d) {
                return path(topojson.merge(topology, d.values));
            });
        calculateReps();
    }

    updateBorders();

    function getPop(state) {
        var pop = 0;
        counties.forEach(function(county) {
            if (state === county.properties.state) {
                pop += parseInt(county.data.TOTALPOP);
            }
        });
        return pop;
    }

    function getSum(state, prop) {
        var pop = 0;
        counties.forEach(function(county) {
            if (state === county.properties.state) {
                pop += parseFloat(county.data[prop]);
            }
        });
        return pop;
    }

    function getAvg(state, prop) {
        var mpe = 0;
        var count = 0;
        counties.forEach(function(county) {
            if (state === county.properties.state) {
                mpe += parseFloat(county.data[prop]);
                count += 1;
            }
        });
        var avgMPE = mpe / count;
        return avgMPE;
    }

    function getWeightedAvg(state, prop) {
        var totalPopulation = getSum(state, "TOTALPOP");
        var mpe = 0;
        var count = 0;
        counties.forEach(function(county) {
            if (state === county.properties.state) {
                mpe += (parseFloat(county.data[prop]) * parseFloat(county.data.TOTALPOP));
                count += 1;
            }
        });
        var avgMPE = mpe / totalPopulation;
        return avgMPE;
    }

    function calculateReps() {
        totalReps = 435; //Set by congress
        states = [];
        stateArray = makeStates();
        stateArray.forEach(function(data, index) {
            //Taxation without Representation!!!!
            if (data.values.length > 0 && data.key != 11) {
                state = {};
                state.key = data.key;
                state.totalPopulation = getPop(data.key);
                state.totalReps = 1;
                state.priority = state.totalPopulation / (Math.sqrt(2)); //Calculate default quota
                state.counties = data.values;
                totalReps -= 1;
                states.push(state);
            }
        });
        var sortDesc = function(a, b) {
            return b.priority - a.priority;
        };
        for (totalReps; totalReps > 0; totalReps -= 1) {
            states.sort(sortDesc);
            states[0].totalReps += 1;
            //Huntington Hill method, assign seat and recalculate priority by population
            states[0].priority = states[0].totalPopulation / Math.sqrt(states[0].totalReps * (states[0].totalReps + 1));
        }
        stateMaster = {};
        states.forEach(function(data, index) {
            stateMaster[data.key] = data;
        });
        return stateMaster;
    }


    $("#saveme").click(function() {
        var output = {};
        counties.forEach(function(county) {
            if (!output[county.properties.state]) {
                output[county.properties.state] = {
                    id: county.data.STATE,
                    counties: []
                };
            }
            if (county.properties.original_state !== county.properties.state) {
                output[county.properties.state].counties.push(county.id);
            }
        });
        console.log(JSON.stringify(output, null, 2));
    });

}(window.jQuery));
