// Lab 4 Step 2.1: show the latest projects on the home page
import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects?.slice(0, 3) ?? [];

const projectsContainer = document.querySelector('.projects');

renderProjects(latestProjects, projectsContainer, 'h2');

// Lab 4 Step 3: GitHub profile stats from the GitHub API
const githubData = await fetchGitHubData('OppedRawen');

const profileStats = document.querySelector('#profile-stats');

if (profileStats && githubData) {
  profileStats.innerHTML = `
        <h2>My GitHub Stats</h2>
        <dl>
          <dt>Public Repos</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists</dt><dd>${githubData.public_gists}</dd>
          <dt>Followers</dt><dd>${githubData.followers}</dd>
          <dt>Following</dt><dd>${githubData.following}</dd>
        </dl>
    `;
}
