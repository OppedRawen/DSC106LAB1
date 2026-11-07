// Lab 6 Step 1.1: D3
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Lab 6 Step 5.4: scales live at module level so the brush code can reach them
let xScale;
let yScale;

// Lab 6 Step 1.1: read the CSV and convert numbers and dates from strings
async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

// Lab 6 Step 1.2: one object per commit, with the lines it touched kept as a hidden property
function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/OppedRawen/DSC106LAB1/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        // Hour as a decimal, e.g. 2:30 PM = 14.5
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        // hidden from console.log and loops, read-only, can't be redefined
        enumerable: false,
        writable: false,
        configurable: false,
      });

      return ret;
    });
}

// Lab 6 Step 1.3: one label/value pair in a stats <dl>.
// Each pair is wrapped in a <div> (valid inside <dl>) so the grid can wrap pairs together.
function addStat(dl, labelHtml, value) {
  const pair = dl.append('div');
  pair.append('dt').html(labelHtml);
  pair.append('dd').text(value);
}

// Lab 6 Step 1.3: summary stats about the whole codebase
function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  addStat(dl, 'Total <abbr title="Lines of code">LOC</abbr>', data.length);
  addStat(dl, 'Total commits', commits.length);

  // Number of distinct values
  addStat(dl, 'Files', d3.group(data, (d) => d.file).size);

  // Grouped aggregate: longest line number per file, then the mean of those
  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (v) => v.line),
    (d) => d.file,
  );
  addStat(dl, 'Avg file length', `${Math.round(d3.mean(fileLengths, (d) => d[1]))} lines`);

  // Aggregates over the whole dataset
  addStat(dl, 'Longest line', `${d3.max(data, (d) => d.length)} chars`);
  addStat(dl, 'Max depth', d3.max(data, (d) => d.depth));

  // Min/max value: the time of day and weekday with the most lines written
  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' }),
  );
  addStat(dl, 'Most active time', d3.greatest(workByPeriod, (d) => d[1])?.[0]);

  const workByDay = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { weekday: 'long' }),
  );
  addStat(dl, 'Most active day', d3.greatest(workByDay, (d) => d[1])?.[0]);
}

// Lab 6 Step 3.1: fill the tooltip with the hovered commit's data
function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
  time.textContent = commit.datetime?.toLocaleString('en', {
    timeStyle: 'short',
  });
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

// Lab 6 Step 3.3
function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

// Lab 6 Step 3.4: place the tooltip just below-right of the cursor
function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX + 12}px`;
  tooltip.style.top = `${event.clientY + 12}px`;
}

// Lab 6 Step 2: scatterplot of commits, date on X and time of day on Y
function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

  // Step 2.2: room for the axes (left is wider than the lab's 20 so "00:00" labels fit)
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  // Step 2.3: gridlines, drawn first so they sit behind everything
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  // Step 2.3 (optional): bluer gridlines at night, orange during the day
  gridlines
    .selectAll('.tick line')
    .attr('stroke', (hour) => (hour >= 6 && hour <= 18 ? 'orange' : 'steelblue'));

  // Step 2.2: axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  // Step 4.1 + 4.2: dot area proportional to lines edited
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  // Step 4.3: biggest dots first, so small ones are drawn on top and stay hoverable
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  // Step 2.1 + 3: the dots, with tooltip events
  const dots = svg.append('g').attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // Step 5.1: brushing, set up once the dots exist
  createBrushSelector(svg);
}

// Lab 6 Step 5.1 + 5.2
function createBrushSelector(svg) {
  svg.call(d3.brush().on('start brush end', brushed));

  // Step 5.2: move the dots (and anything after the overlay) above the brush overlay
  // so hovering still reaches them
  svg.selectAll('.dots, .overlay ~ *').raise();
}

// Lab 6 Step 5.4
function brushed(event) {
  const selection = event.selection;
  d3.selectAll('#chart circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
  );
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

// Lab 6 Step 5.4: is the commit's dot inside the brush rectangle?
function isCommitSelected(selection, commit) {
  if (!selection) {
    return false;
  }
  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

// Lab 6 Step 5.5
function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

// Lab 6 Step 5.6: lines per language in the selected commits
function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    // wrapped in a <div> to match the .stats layout (see addStat)
    container.innerHTML += `
            <div>
                <dt>${language}</dt>
                <dd>${count} lines (${formatted})</dd>
            </div>
        `;
  }
}

let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
