// Lab 4 Step 1.3: render the projects page from lib/projects.json
import { fetchJSON, renderProjects } from '../global.js';
// Lab 5 Step 1.3: D3
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = (await fetchJSON('../lib/projects.json')) ?? [];

const projectsContainer = document.querySelector('.projects');

// Lab 4 Step 1.6: show the project count in the page title
const projectsTitle = document.querySelector('.projects-title');

if (projectsTitle) {
  projectsTitle.textContent = `${projects.length} Projects`;
}

// Lab 5 Step 1.3: arc generator for the pie wedges
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// Lab 5 Step 1.5: ordinal color scale. Colors are keyed by year (not wedge index)
// so a year keeps its color when searching changes which wedges exist.
let colors = d3.scaleOrdinal(d3.schemeTableau10).domain(projects.map((p) => p.year));

// Lab 5 Step 4.1 + 5.2: filter state.
// The selection is stored as a year label rather than a wedge index,
// because indices shift when the search changes the pie's data (Step 5.4 fix).
let query = '';
let selectedYear = null;

// Lab 5 Step 4.3: case-insensitive search across all project fields
function filterByQuery(projectsGiven) {
  return projectsGiven.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

// Lab 5 Step 4.4: all plotting in one function, re-run whenever the data changes
function renderPieChart(projectsGiven) {
  // Step 3.1: projects per year
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  // Step 1.4 + 2.1: slice angles, then wedge paths
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  // Step 4.4: clear the old wedges and legend before redrawing
  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  // Step 1.4: one <path> per wedge; Step 5.2: click to select/deselect a year
  newArcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(newData[i].label))
      .attr('class', newData[i].label === selectedYear ? 'selected' : null)
      .on('click', () => toggleYear(newData[i].label))
      .append('title')
      .text(`${newData[i].label}: ${newData[i].value} project(s)`);
  });

  // Step 2.2: legend items; clicking one does the same as clicking its wedge
  newData.forEach((d) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr('class', d.label === selectedYear ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => toggleYear(d.label));
  });
}

// Lab 5 Step 5.2: clicking the selected year again deselects it
function toggleYear(year) {
  selectedYear = selectedYear === year ? null : year;
  update();
}

// Lab 5 Step 5.3 + 5.4: apply BOTH filters every time either one changes.
// The pie shows the search results; the project list is further narrowed to the selected year.
function update() {
  let searchedProjects = filterByQuery(projects);

  // If the search removed every project from the selected year, drop the selection
  if (!searchedProjects.some((p) => p.year === selectedYear)) {
    selectedYear = null;
  }

  renderPieChart(searchedProjects);

  let visibleProjects =
    selectedYear === null
      ? searchedProjects
      : searchedProjects.filter((p) => p.year === selectedYear);

  renderProjects(visibleProjects, projectsContainer, 'h2');
}

// Lab 5 Step 4.2: re-filter as the user types ('input' instead of 'change' for live results)
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  update();
});

// Lab 5 Step 4.4: first render on page load
update();
