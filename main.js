const newCaseUrl =
  "https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/cases_deaths/new_cases.csv";

const newDeathUrl =
  "https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/cases_deaths/new_deaths.csv";

const width = window.innerWidth;
const height = window.innerHeight * 0.9;
const margin = { left: 10, right: 10, top: 50, bottom: 10 };
const outerRadius =
  Math.min(
    width - margin.left - margin.right,
    height - margin.top - margin.bottom
  ) / 2;
const radius = outerRadius / 2;
const innerRadius = 100;
const padAngle = 0.01;
const deathTicks = 3;
const caseTicks = 5;

const spinnerOptions = {
  lines: 13, // The number of lines to draw
  length: 60, // The length of each line
  width: 17, // The line thickness
  radius: 80, // The radius of the inner circle
  scale: 1, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  speed: 1, // Rounds per second
  rotate: 0, // The rotation offset
  animation: "spinner-line-fade-quick", // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: "#ffffff", // CSS color or array of colors
  fadeColor: "transparent", // CSS color or array of colors
  top: "50%", // Top position relative to parent
  left: "50%", // Left position relative to parent
  shadow: "0 0 1px transparent", // Box-shadow for the lines
  zIndex: 2000000000, // The z-index (defaults to 2e9)
  className: "spinner", // The CSS class to assign to the spinner
  position: "absolute", // Element positioning
};

const binnedProcess = (data) => {
  const binScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .ticks(d3.timeMonth);

  const binnedData = d3
    .bin()
    .value((d) => d.date)
    .thresholds(binScale)(data);

  const processedData = binnedData.map((d) => ({
    month: d3.timeFormat("%b-%Y")(d.x0),
    sumValue: d.reduce((acc, cv) => acc + cv.value, 0),
  }));

  return processedData;
};

const drawChart = (caseData, deathData, svg, location) => {
  const processedCaseData = binnedProcess(caseData);
  const processedDeathData = binnedProcess(deathData);

  const xScale = d3
    .scaleBand()
    .domain(processedCaseData.map((d) => d.month))
    .range([0, 2 * Math.PI])
    .align(0);

  const yCaseScale = d3
    .scaleRadial()
    .domain([0, d3.max(processedCaseData, (d) => d.sumValue)])
    .range([radius, outerRadius]);

  const caseArc = d3
    .arc()
    .innerRadius((d) => yCaseScale(0))
    .outerRadius((d) => yCaseScale(d.sumValue))
    .startAngle((d) => xScale(d.month))
    .endAngle((d) => xScale(d.month) + xScale.bandwidth())
    .padAngle(padAngle)
    .padRadius(radius);

  const yDeathScale = d3
    .scaleRadial()
    .domain([0, d3.max(processedDeathData, (d) => d.sumValue)])
    .range([radius, innerRadius]);

  const deathArc = d3
    .arc()
    .innerRadius((d) => yDeathScale(d.sumValue))
    .outerRadius((d) => yDeathScale(0))
    .startAngle((d) => xScale(d.month))
    .endAngle((d) => xScale(d.month) + xScale.bandwidth())
    .padAngle(padAngle)
    .padRadius(radius);

  const chartGroup = svg
    .selectAll(".chart-group")
    .data([null])
    .join("g")
    .attr("class", "chart-group")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  chartGroup
    .selectAll(".location-label")
    .data([null])
    .join("text")
    .attr("class", "location-label")
    .attr("text-anchor", "middle")
    .text(location);

  const caseArcDraw = chartGroup
    .selectAll(".case-path")
    .data(processedCaseData)
    .join("path")
    .attr("class", "case-path")
    .attr("fill", "skyblue")
    .attr("d", caseArc);

  const deathArcDraw = chartGroup
    .selectAll(".death-path")
    .data(processedDeathData)
    .join("path")
    .attr("class", "death-path")
    .attr("fill", "red")
    .attr("d", deathArc);

  const xAxis = (g) =>
    g
      .selectAll("g")
      .data(processedCaseData)
      .join("g")
      .attr(
        "transform",
        (d) =>
          `rotate(${
            ((xScale(d.month) + xScale.bandwidth() / 2) * 180) / Math.PI - 90
          }) translate(${radius}, 0)`
      )
      .call((g) =>
        g
          .selectAll(".x-axis-label")
          .data((d) => [d])
          .join("text")
          .attr("class", "x-axis-label")
          .attr("text-anchor", "middle")
          .attr("transform", (d) =>
            ((xScale(d.month) + xScale.bandwidth() / 2) * 180) / Math.PI - 90 <
            90
              ? "rotate(0)"
              : "rotate(180)"
          )
          .attr("dy", "0.32em")
          .text((d) => d.month)
      );

  const xAxisDraw = chartGroup
    .selectAll(".x-axis")
    .data([null])
    .join("g")
    .attr("class", "x-axis")
    .call(xAxis);

  const yCaseAxis = (g) =>
    g
      .attr("text-anchor", "middle")
      .call((g) =>
        g
          .selectAll(".case-label")
          .data([null])
          .join("text")
          .attr("class", "case-label")
          .attr("y", -yCaseScale(yCaseScale.ticks(caseTicks).pop()))
          .attr("dy", "-1em")
          .text("New Cases")
      )
      .call((g) =>
        g
          .selectAll("g")
          .data(yCaseScale.ticks(caseTicks).slice(1))
          .join("g")
          .attr("fill", "none")
          .call((g) =>
            g
              .selectAll("circle")
              .data((d) => [d])
              .join("circle")
              .attr("stroke", "#000")
              .attr("stroke-opacity", 0.5)
              .attr("r", (d) => yCaseScale(d))
          )
          .call((g) =>
            g
              .selectAll("text")
              .data((d) => [d])
              .join("text")
              .attr("y", (d) => -yCaseScale(d))
              .attr("dy", "0.35em")
              .attr("stroke", "#fff")
              .attr("stroke-width", 5)
              .text((d) => d3.format(",")(d))
              .clone(true)
              .attr("fill", "#000")
              .attr("stroke", "none")
          )
      );

  const yCaseAxisDraw = chartGroup
    .selectAll(".y-case-axis")
    .data([null])
    .join("g")
    .attr("class", "y-case-axis")
    .call(yCaseAxis);

  const yDeathAxis = (g) =>
    g
      .attr("text-anchor", "middle")
      .call((g) =>
        g
          .selectAll(".death-label")
          .data([null])
          .join("text")
          .attr("class", "death-label")
          .attr("y", -yDeathScale(yDeathScale.ticks(deathTicks).pop()))
          .attr("dy", "2em")
          .text("Deaths")
      )
      .call((g) =>
        g
          .selectAll("g")
          .data(yDeathScale.ticks(deathTicks).slice(1))
          .join("g")
          .attr("fill", "none")
          .call((g) =>
            g
              .selectAll("circle")
              .data((d) => [d])
              .join("circle")
              .attr("stroke", "#000")
              .attr("stroke-opacity", 0.5)
              .attr("r", (d) => yDeathScale(d))
          )
          .call((g) =>
            g
              .selectAll("text")
              .data((d) => [d])
              .join("text")
              .attr("y", (d) => -yDeathScale(d))
              .attr("dy", "0.35em")
              .attr("stroke", "#fff")
              .attr("stroke-width", 5)
              .text((d) => d3.format(",")(d))
              .clone(true)
              .attr("fill", "#000")
              .attr("stroke", "none")
          )
      );

  const yDeathAxisDraw = chartGroup
    .selectAll(".y-death-axis")
    .data([null])
    .join("g")
    .attr("class", "y-death-axis")
    .call(yDeathAxis);
};

const dataParse = (d) => {
  Object.keys(d).forEach((t) => {
    if (t === "date") {
      d[t] = d3.timeParse("%Y-%m-%d")(d[t]);
    } else {
      d[t] = +d[t];
    }
  });
  return d;
};

const main = async () => {
  const spinnerTarget = document.getElementById("spinner");
  const spinner = new Spinner(spinnerOptions).spin(spinnerTarget);

  const newDeathData = await d3.csv(newDeathUrl, dataParse);
  const newCaseData = await d3.csv(newCaseUrl, dataParse);

  spinner.stop();

  console.log(newDeathData);

  const locationList = newCaseData.columns.filter((d) => d !== "date");

  const svg = d3
    .select("#main-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  jSuites.dropdown(document.getElementById("location"), {
    data: locationList,
    value: "World",
    autocomplete: true,
    width: "280px",
    onload: () => {
      drawChart(
        newCaseData.map((t) => ({ date: t.date, value: t["World"] })),
        newDeathData.map((t) => ({ date: t.date, value: t["World"] })),
        svg,
        "World"
      );
    },
    onchange: (d) => {
      drawChart(
        newCaseData.map((t) => ({ date: t.date, value: t[d.value] })),
        newDeathData.map((t) => ({ date: t.date, value: t[d.value] })),
        svg,
        d.value
      );
    },
  });
};

main();
