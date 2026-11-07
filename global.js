// Step 1
console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}
// Step 2
// let navLinks = $$('nav a');
// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname,
// );
// currentLink?.classList.add('current');
// Step 3
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' },
  { url: 'meta/', title: 'Meta' },
  { url: 'https://github.com/OppedRawen', title: 'GitHub' },
];

const BASE_PATH =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? '/' // Local server
    : '/DSC106LAB1/'; // GitHub Pages repo name

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  url = !url.startsWith('http') ? BASE_PATH + url : url;

  // Step 3.2: create elements instead of HTML strings
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  // Step 3.2: highlight the current page
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname,
  );

  // Step 3.2: open external links in a new tab
  a.toggleAttribute('target', a.host !== location.host);
  if (a.hasAttribute('target')) {
    a.target = '_blank';
  }

  nav.append(a);
}

// Step 4.2: theme switcher, labelled with the OS scheme for "Automatic"
let osScheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light';

document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
			<option value="light dark">Automatic (${osScheme})</option>
			<option value="light">Light</option>
			<option value="dark">Dark</option>
		</select>
	</label>`,
);

// Step 4.4: apply the chosen scheme
let select = document.querySelector('.color-scheme select');

function setColorScheme(colorScheme) {
  document.documentElement.style.setProperty('color-scheme', colorScheme);
  select.value = colorScheme;
}

select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  setColorScheme(event.target.value);
  // Step 4.5: remember the choice
  localStorage.colorScheme = event.target.value;
});

// Step 4.5: restore the saved choice on page load
if ('colorScheme' in localStorage) {
  setColorScheme(localStorage.colorScheme);
}

// Step 5 (optional): build the mailto: URL with proper percent-encoding
let form = document.querySelector('form');

form?.addEventListener('submit', function (event) {
  event.preventDefault();

  let data = new FormData(form);
  let params = [];

  for (let [name, value] of data) {
    params.push(`${name}=${encodeURIComponent(value)}`);
  }

  let url = form.action + '?' + params.join('&');
  location.href = url;
});


// ---------------- Lab 4 ----------------

// Lab 4 Step 1.2: load and parse a JSON file
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

// Lab 4 Step 1.4: render a list of projects into a container
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Step 1.4 (challenge): bail out if the container is missing
  if (!(containerElement instanceof Element)) {
    console.error('renderProjects: containerElement is not a valid DOM element');
    return;
  }

  // Step 1.4 (challenge): only allow h1–h6 as the heading level
  if (!/^h[1-6]$/.test(headingLevel)) {
    console.warn(`renderProjects: invalid heading level "${headingLevel}", using h2`);
    headingLevel = 'h2';
  }

  // Step 1.4.2: clear existing content to avoid duplicates
  containerElement.innerHTML = '';

  // Step 1.3 (check your understanding): placeholder for an empty list
  if (!projects || projects.length === 0) {
    containerElement.innerHTML = '<p>No projects to show yet.</p>';
    return;
  }

  for (let project of projects) {
    // Step 1.4.3
    const article = document.createElement('article');

    // Step 1.4.4 + 1.4.6: content with a dynamic heading level
    // Lab 5 Step 0.1: year under the description, wrapped together so they share one grid row
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
      <div>
        <p>${project.description}</p>
        <p class="project-year">c. ${project.year}</p>
      </div>
    `;

    // Step 1.4.5
    containerElement.appendChild(article);
  }
}

// Lab 4 Step 3.2: public profile data from the GitHub API
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
