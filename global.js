// Step 1
console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Step 2 (replaced by Step 3, which adds the current class while building the nav)
// let navLinks = $$('nav a');
// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname,
// );
// currentLink?.classList.add('current');

// Step 3.1: build the navigation menu from data
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' },
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
