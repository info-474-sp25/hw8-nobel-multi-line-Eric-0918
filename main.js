// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 },
      width = 800 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

const svgLine = d3.select("#lineChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 2: LOAD DATA
d3.csv("nobel_laureates.csv").then(data => {
    data.forEach(d => {
        d.year = +d.year;
        d.name = d.fullname;
    });

    // 3: CATEGORIZE
    const stemCategories = ["chemistry", "physics", "medicine"];
    const categorizedData = data.map(d => ({
        ...d,
        categoryGroup: stemCategories.includes(d.category) ? "STEM" : "Non-STEM"
    }));

    // 4: GROUP AND COUNT BY YEAR AND CATEGORY GROUP
    const categories = d3.rollup(categorizedData,
        v => d3.rollup(v, values => values.length, d => d.year),
        d => d.categoryGroup
    );

    const allYears = Array.from(categories.values())
        .flatMap(yearMap => Array.from(yearMap.keys()));
    const yearCounts = Array.from(categories.values())
        .map(yearMap => Array.from(yearMap.values()));
    const maxCount = d3.max(yearCounts, values => d3.max(values));

    // 5: SCALES
    const xScale = d3.scaleLinear()
        .domain(d3.extent(allYears))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, maxCount + 1])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(Array.from(categories.keys()))
        .range(d3.schemeCategory10);

    // 6: LINE GENERATOR
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.count));

    // 7: PLOT LINES
    const lineData = Array.from(categories.entries());
    svgLine.selectAll("path")
        .data(lineData)
        .enter()
        .append("path")
        .attr("d", d => {
            const yearMap = d[1];
            const values = Array.from(yearMap.entries()).map(([year, count]) => ({ year, count }));
            return line(values);
        })
        .style("stroke", d => colorScale(d[0]))
        .style("fill", "none")
        .style("stroke-width", 2);

    // 8: AXES
    svgLine.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    svgLine.append("g")
        .call(d3.axisLeft(yScale));

    // 9: LABELS
    svgLine.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Number of Nobel Laureates by Year (STEM vs Non-STEM)");

    svgLine.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text("Year");

    svgLine.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .text("Number of Laureates");

    // 10: LEGEND
    const legend = svgLine.selectAll(".legend")
        .data(colorScale.domain())
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`);

    legend.append("rect")
        .attr("x", width - 20)
        .attr("y", 0)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", colorScale);

    legend.append("text")
        .attr("x", width - 25)
        .attr("y", 9)
        .attr("text-anchor", "end")
        .style("font-size", "12px")
        .text(d => d);
});
