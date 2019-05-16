'use strict';

(function() {

  let data = "no data";
  let allYearsData = "no data";
  let tooltipDiv = "";
  let svgLineGraph = "";
  let svgTooltip = ""; // keep SVG reference in global scope
  let country_selected = ""; // keep SVG reference in global scope

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgLineGraph = d3.select('body')
      .append('svg')
      .attr('width', 1400)
      .attr('height', 800);

    d3.csv("./data/dataEveryYear.csv")
      .then((csvData) => {
        data = csvData;
        allYearsData = csvData;

        let each_country = [];

        // loop through and get the unique values for the year
        data.forEach(row => {
          let country = (row["location"])
          if (each_country.indexOf(country) == -1) {
            each_country.push(country)
          }
        });
        each_country.sort()
        country_selected = each_country[0];
        
        // add a dropdown menu
        makeDropDown(each_country);
        makeLineGraphBase();

        tooltipDiv = d3.select("body").append("div")
          .style("opacity", 0)
          .attr("width", 250)
          .attr("height", 300)
          .style("position", "absolute")
          .style("text-align", "center")
          .style("border", "1px solid grey")

        svgTooltip = tooltipDiv.append('svg')
          .attr('width', 300)
          .attr('height', 300);

        makeScatterPlot();
      });
  }

  // Adds the dropdown menu with the years onto the svg
  function makeDropDown(each_country) {

    // Append the dropdown to the SVG
    var dropDown = d3.select("body")
      .append('select')

    var options = dropDown.selectAll('option')
      .data(each_country)
      .enter()
        .append('option')
      .text(d => d)

      dropDown.on("change", function () {
        country_selected = this.value;
        svgLineGraph.selectAll("path").remove()
        svgLineGraph.selectAll("text").remove()
        svgLineGraph.selectAll("g").remove()
        makeLineGraphBase();
    });
  }

  // Make line graph based on the chosen country
  function makeLineGraphBase() {
    let countryData = allYearsData.filter((row) => row["location"] == country_selected);
    let timeData = countryData.map((row) => +row["time"]);
    let popData = countryData.map((row) => +row["pop_mlns"]);

    let minMax = findMinMax(timeData, popData)

    let xRange = {min: 100, max: 1200}
    let yRange = {min: 100, max: 750}

    let funcs = drawAxes(minMax, "time", "pop_mlns", svgLineGraph, xRange, yRange);
    
    plotLineGraph(funcs, countryData, country_selected)
  }

  // plot main line graph
  function plotLineGraph(funcs, countryData, country) {
    let line = d3.line()
      .x((d) => funcs.x(d))
      .y((d) => funcs.y(d));
    
    // make the line
    svgLineGraph.append('path')
      .datum(countryData)
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("stroke-width", 3)
      .attr("d", line)
      .on("mouseover", (d) => {
        tooltipDiv.transition()
          .duration(500)
          .style("opacity", 1)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", (d) => {
        tooltipDiv.transition()
          .duration(500)
          .style("opacity", 0);
      });
      ;
    
    // add x and y axis titles and which country is selected
    svgLineGraph.append('text')
      .attr('x', 500)
      .attr('y', 800)
      .style('font-size', '15pt')
      .text('Year');

    svgLineGraph.append('text')
      .attr('x', 100)
      .attr('y', 80)
      .style('font-size', '15pt')
      .style("font-weight", 'bold')
      .text(country);

    svgLineGraph.append('text')
      .attr('transform', 'translate(50, 475)rotate(-90)')
      .style('font-size', '15pt')
      .text('Population (in millions)');
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y, svg, rangeX, rangeY) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }
    
    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin, limits.xMax]) // give domain buffer room
      .range([rangeX.min, rangeX.max]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG with formatted years
    let xAxis = d3.axisBottom().ticks(25).tickFormat(d3.format("d")).scale(xScale);
    svg.append("g")
      .attr('transform', 'translate(0, ' + rangeY.max + ')')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax, limits.yMin]) // give domain buffer
      .range([rangeY.min, rangeY.max]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(' + rangeX.min + ', 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {
    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // plot tooltiip scatter plot
  function makeScatterPlot() {
    // get arrays of fertility rate data and life exp data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    let xRange = {min: 50, max: 250}
    let yRange = {min: 50, max: 250}
    let mapFunctions = drawAxes(axesLimits, "fertility_rate", "life_expectancy", svgTooltip, xRange, yRange);

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);
    
    // draw title and axes labels
    makeLabels();
  }

  // plot tool tip chart
  function plotData(map) {
    let xMap = map.x;
    let yMap = map.y;

    svgTooltip.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => 1)
        .attr('fill', "blue");
  }

  // make title and axes labels for tooltip chart
  function makeLabels() {
    svgTooltip.append('text')
      .attr('x', 50)
      .attr('y', 30)
      .style('font-size', '8pt')
      .text("Life Expectancy vs. Fertility Rate for all countries");

    svgTooltip.append('text')
      .attr('x', 50)
      .attr('y', 285)
      .style('font-size', '8pt')
      .text('Fertility Rates (Avg Children per Woman)');

    svgTooltip.append('text')
      .attr('transform', 'translate(15, 200)rotate(-90)')
      .style('font-size', '8pt')
      .text('Life Expectancy (years)');
  }
})();