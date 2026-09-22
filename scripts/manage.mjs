#!/usr/bin/env node
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PROJECTS_FILE = path.join(ROOT_DIR, 'src/lib/data/projects.json');
const BLOGS_DIR = path.join(ROOT_DIR, 'src/content/blogs');
const PROJECT_PICTURES_DIR = path.join(ROOT_DIR, 'static/ProjectPictures');
const BLOG_PICTURES_DIR = path.join(ROOT_DIR, 'static/BlogPictures');

// Terminal colors
const c = {
	reset: '\x1b[0m',
	bold: '\x1b[1m',
	dim: '\x1b[2m',
	green: '\x1b[32m',
	cyan: '\x1b[36m',
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	magenta: '\x1b[35m',
	blue: '\x1b[34m'
};

function formatPath(raw) {
	if (!raw) return '';
	let p = raw.trim();
	// Strip surrounding quotes often added by terminal drag-and-drop
	if ((p.startsWith("'") && p.endsWith("'")) || (p.startsWith('"') && p.endsWith('"'))) {
		p = p.slice(1, -1);
	}
	// Expand ~ to user home
	if (p.startsWith('~/') || p === '~') {
		p = path.join(os.homedir(), p.slice(1));
	}
	return path.resolve(p);
}

async function ask(rl, query) {
	try {
		return await rl.question(query);
	} catch (err) {
		if (err.code === 'ERR_USE_AFTER_CLOSE') {
			return '';
		}
		throw err;
	}
}

async function prompt(rl, label, defaultValue = '') {
	const defaultHint = defaultValue ? ` ${c.dim}(default: ${defaultValue})${c.reset}` : '';
	const answer = await ask(rl, `${c.bold}${label}${c.reset}${defaultHint}: `);
	const trimmed = answer.trim();
	return trimmed || defaultValue;
}

async function promptOptional(rl, label, defaultValue = '') {
	const defaultHint = defaultValue
		? ` ${c.dim}(default: ${defaultValue})${c.reset}`
		: ` ${c.dim}(leave empty for none)${c.reset}`;
	const answer = await ask(rl, `${c.bold}${label}${c.reset}${defaultHint}: `);
	const trimmed = answer.trim();
	if (!trimmed) return defaultValue || null;
	return trimmed;
}

async function handleCoverImage(rl, targetCategory = 'project', currentCover = null) {
	console.log(`\n${c.cyan}Cover Image:${c.reset}`);
	console.log(`  ${c.dim}• Leave blank for none`);
	console.log(
		`  • Enter/drag a local image path (e.g. ~/Downloads/photo.png) to copy it to static/`
	);
	console.log(
		`  • Or enter an existing relative path or URL (e.g. /ProjectPictures/...)${c.reset}`
	);
	if (currentCover) {
		console.log(`  ${c.dim}Current: ${currentCover}${c.reset}`);
	}

	const answer = await ask(
		rl,
		`${c.bold}Image path or URL${c.reset}${currentCover ? ` ${c.dim}(Enter to keep)` : ''}: `
	);
	const raw = answer.trim();

	if (!raw) {
		return currentCover;
	}

	if (raw.toLowerCase() === 'none' || raw.toLowerCase() === 'clear') {
		return null;
	}

	if (raw.startsWith('http://') || raw.startsWith('https://')) {
		return raw;
	}

	const targetFolder = targetCategory === 'project' ? PROJECT_PICTURES_DIR : BLOG_PICTURES_DIR;
	const urlPrefix = targetCategory === 'project' ? '/ProjectPictures' : '/BlogPictures';

	if (raw.startsWith(urlPrefix)) {
		return raw;
	}

	const resolvedLocal = formatPath(raw);
	try {
		const stat = await fs.stat(resolvedLocal);
		if (stat.isFile()) {
			await fs.mkdir(targetFolder, { recursive: true });
			const filename = path.basename(resolvedLocal);
			const destFile = path.join(targetFolder, filename);

			await fs.copyFile(resolvedLocal, destFile);
			console.log(`  ${c.green}✓ Copied image to static:${c.reset} ${destFile}`);
			return `${urlPrefix}/${filename}`;
		}
	} catch {
		console.log(
			`  ${c.yellow}Notice: Local file not found at "${resolvedLocal}". Keeping as raw value.${c.reset}`
		);
	}

	return raw;
}

function getCurrentMonth() {
	const d = new Date();
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	return `${yyyy}-${mm}`;
}

function getCurrentDate() {
	const d = new Date();
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

// -------------------------------------------------------------
// PROJECTS MANAGEMENT
// -------------------------------------------------------------

async function loadProjects() {
	try {
		const raw = await fs.readFile(PROJECTS_FILE, 'utf-8');
		return JSON.parse(raw);
	} catch (err) {
		console.error(`${c.red}Error reading projects.json:${c.reset}`, err);
		return [];
	}
}

async function saveProjects(projects) {
	await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, '\t') + '\n', 'utf-8');
}

function listProjectsSummary(projects) {
	console.log(`\n${c.bold}=== Projects (${projects.length}) ===${c.reset}`);
	if (projects.length === 0) {
		console.log(`${c.dim}No projects found.${c.reset}`);
		return;
	}
	projects.forEach((p, idx) => {
		console.log(
			` ${c.cyan}[${idx + 1}]${c.reset} ${c.bold}${p.title}${c.reset} ${c.dim}(${p.date || 'no date'})${c.reset}`
		);
		console.log(`     ${c.dim}Tags:${c.reset} ${p.tags ? p.tags.join(', ') : 'none'}`);
		if (p.cover_url) console.log(`     ${c.dim}Cover:${c.reset} ${p.cover_url}`);
		if (p.github_url) console.log(`     ${c.dim}GitHub:${c.reset} ${p.github_url}`);
		if (p.demo_url) console.log(`     ${c.dim}Demo:${c.reset} ${p.demo_url}`);
	});
	console.log();
}

async function addProject(rl) {
	console.log(`\n${c.bold}${c.green}--- Add New Project ---${c.reset}`);

	let title = '';
	while (!title) {
		title = (await ask(rl, `${c.bold}Project Title:${c.reset} `)).trim();
		if (!title && !rl.closed) console.log(`${c.red}Title cannot be empty.${c.reset}`);
		if (rl.closed) return;
	}

	let description = '';
	while (!description) {
		description = (await ask(rl, `${c.bold}Description:${c.reset} `)).trim();
		if (!description && !rl.closed) console.log(`${c.red}Description cannot be empty.${c.reset}`);
		if (rl.closed) return;
	}

	const tagsInput = await prompt(rl, 'Tags (comma separated, e.g. React, Vite, Webapp)', 'Webapp');
	const tags = tagsInput
		.split(',')
		.map((t) => t.trim())
		.filter(Boolean);

	const date = await prompt(rl, 'Date (YYYY-MM)', getCurrentMonth());
	const demo_url = await promptOptional(rl, 'Demo URL');
	const github_url = await promptOptional(rl, 'GitHub URL');
	const cover_url = await handleCoverImage(rl, 'project');

	const newProject = {
		title,
		description,
		tags,
		demo_url,
		github_url,
		cover_url,
		date
	};

	const projects = await loadProjects();
	// Add to beginning of array
	projects.unshift(newProject);
	await saveProjects(projects);

	console.log(`\n${c.green}✓ Project "${title}" added successfully!${c.reset}\n`);
}

async function editProject(rl) {
	const projects = await loadProjects();
	if (projects.length === 0) {
		console.log(`\n${c.yellow}No projects to edit.${c.reset}\n`);
		return;
	}

	listProjectsSummary(projects);
	const answer = await ask(
		rl,
		`${c.bold}Select project number to edit (1-${projects.length}) or Enter to cancel:${c.reset} `
	);
	const num = parseInt(answer.trim(), 10);
	if (isNaN(num) || num < 1 || num > projects.length) {
		console.log(`${c.dim}Cancelled.${c.reset}\n`);
		return;
	}

	const idx = num - 1;
	const p = projects[idx];

	console.log(
		`\n${c.bold}${c.green}Editing "${p.title}":${c.reset} (Press Enter to keep current value)\n`
	);

	const title = await prompt(rl, 'Title', p.title);
	const description = await prompt(rl, 'Description', p.description);

	const currentTags = (p.tags || []).join(', ');
	const tagsInput = await prompt(rl, 'Tags (comma separated)', currentTags);
	const tags = tagsInput
		.split(',')
		.map((t) => t.trim())
		.filter(Boolean);

	const date = await prompt(rl, 'Date (YYYY-MM)', p.date || getCurrentMonth());
	const demo_url = await promptOptional(rl, 'Demo URL', p.demo_url || '');
	const github_url = await promptOptional(rl, 'GitHub URL', p.github_url || '');
	const cover_url = await handleCoverImage(rl, 'project', p.cover_url);

	projects[idx] = {
		title,
		description,
		tags,
		demo_url: demo_url === '' ? null : demo_url,
		github_url: github_url === '' ? null : github_url,
		cover_url: cover_url === '' ? null : cover_url,
		date
	};

	await saveProjects(projects);
	console.log(`\n${c.green}✓ Project "${title}" updated successfully!${c.reset}\n`);
}

async function deleteProject(rl) {
	const projects = await loadProjects();
	if (projects.length === 0) {
		console.log(`\n${c.yellow}No projects to delete.${c.reset}\n`);
		return;
	}

	listProjectsSummary(projects);
	const answer = await ask(
		rl,
		`${c.bold}Select project number to delete (1-${projects.length}) or Enter to cancel:${c.reset} `
	);
	const num = parseInt(answer.trim(), 10);
	if (isNaN(num) || num < 1 || num > projects.length) {
		console.log(`${c.dim}Cancelled.${c.reset}\n`);
		return;
	}

	const target = projects[num - 1];
	const confirm = await ask(
		rl,
		`${c.red}${c.bold}Are you sure you want to delete "${target.title}"? (y/N):${c.reset} `
	);
	if (confirm.trim().toLowerCase() === 'y' || confirm.trim().toLowerCase() === 'yes') {
		projects.splice(num - 1, 1);
		await saveProjects(projects);
		console.log(`\n${c.green}✓ Project "${target.title}" deleted.${c.reset}\n`);
	} else {
		console.log(`${c.dim}Aborted.${c.reset}\n`);
	}
}

// -------------------------------------------------------------
// BLOGS MANAGEMENT
// -------------------------------------------------------------

function parseFrontmatter(raw) {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) {
		return { data: {}, content: raw.trim() };
	}

	const yamlBlock = match[1];
	const content = match[2].trim();
	const data = {};

	for (const line of yamlBlock.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const colonIdx = trimmed.indexOf(':');
		if (colonIdx === -1) continue;

		const key = trimmed.slice(0, colonIdx).trim();
		let val = trimmed.slice(colonIdx + 1).trim();

		// Strip quotes
		if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
			val = val.slice(1, -1);
		}

		// Parse inline arrays: [tag1, tag2]
		if (val.startsWith('[') && val.endsWith(']')) {
			const items = val
				.slice(1, -1)
				.split(',')
				.map((s) => s.trim().replace(/^["']|["']$/g, ''))
				.filter(Boolean);
			data[key] = items;
		} else {
			data[key] = val;
		}
	}

	return { data, content };
}

function serializeBlogMarkdown({ title, date, description, cover, tags, author, content }) {
	const safeTags = Array.isArray(tags) ? tags : [];
	const frontmatter = [
		'---',
		`title: ${JSON.stringify(title)}`,
		`date: "${date}"`,
		`description: ${JSON.stringify(description || '')}`,
		`cover: ${JSON.stringify(cover || '')}`,
		`tags: [${safeTags.map((t) => JSON.stringify(t)).join(', ')}]`,
		`author: ${JSON.stringify(author || 'Lloyd Nicolas')}`,
		'---',
		'',
		content ? content.trim() : ''
	].join('\n');

	return frontmatter + '\n';
}

async function loadBlogs() {
	await fs.mkdir(BLOGS_DIR, { recursive: true });
	const files = await fs.readdir(BLOGS_DIR);
	const mdFiles = files.filter((f) => f.endsWith('.md'));

	const blogs = [];
	for (const filename of mdFiles) {
		const slug = filename.replace(/\.md$/, '');
		const filepath = path.join(BLOGS_DIR, filename);
		const raw = await fs.readFile(filepath, 'utf-8');
		const { data, content } = parseFrontmatter(raw);
		blogs.push({
			slug,
			filename,
			filepath,
			title: data.title || slug,
			date: data.date || '',
			description: data.description || '',
			cover: data.cover || '',
			tags: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
			author: data.author || 'Lloyd Nicolas',
			content
		});
	}

	return blogs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

function listBlogsSummary(blogs) {
	console.log(`\n${c.bold}=== Blog Posts (${blogs.length}) ===${c.reset}`);
	if (blogs.length === 0) {
		console.log(`${c.dim}No blog posts found.${c.reset}`);
		return;
	}
	blogs.forEach((b, idx) => {
		console.log(
			` ${c.magenta}[${idx + 1}]${c.reset} ${c.bold}${b.title}${c.reset} ${c.dim}(${b.date || 'no date'})${c.reset}`
		);
		console.log(
			`     ${c.dim}Slug:${c.reset} ${b.slug} | ${c.dim}File:${c.reset} src/content/blogs/${b.filename}`
		);
		if (b.tags && b.tags.length) console.log(`     ${c.dim}Tags:${c.reset} ${b.tags.join(', ')}`);
		if (b.cover) console.log(`     ${c.dim}Cover:${c.reset} ${b.cover}`);
	});
	console.log();
}

function slugify(text) {
	return text
		.toString()
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-') // Replace spaces with -
		.replace(/[^\w-]+/g, '') // Remove non-word characters
		.replace(/--+/g, '-') // Replace multiple - with single -
		.replace(/^-+/, '') // Trim - from start
		.replace(/-+$/, ''); // Trim - from end
}

function openFileInEditor(filePath) {
	const editorEnv = process.env.EDITOR || process.env.VISUAL;
	if (editorEnv) {
		const parts = editorEnv.split(' ');
		const cmd = parts[0];
		const args = [...parts.slice(1), filePath];
		try {
			const res = spawnSync(cmd, args, { stdio: 'inherit' });
			if (res.status === 0) return true;
		} catch {
			// fall through
		}
	}

	for (const cmd of ['code', 'nano', 'nvim', 'vim', 'xdg-open']) {
		try {
			const res = spawnSync(cmd, [filePath], { stdio: 'inherit' });
			if (res.status === 0) return true;
		} catch {
			continue;
		}
	}
	return false;
}

async function addBlog(rl) {
	console.log(`\n${c.bold}${c.magenta}--- Create New Blog Post ---${c.reset}`);

	let title = '';
	while (!title) {
		title = (await ask(rl, `${c.bold}Blog Title:${c.reset} `)).trim();
		if (!title && !rl.closed) console.log(`${c.red}Title cannot be empty.${c.reset}`);
		if (rl.closed) return;
	}

	const defaultSlug = slugify(title);
	let slug = await prompt(rl, 'URL Slug', defaultSlug);
	slug = slugify(slug);

	const filePath = path.join(BLOGS_DIR, `${slug}.md`);
	try {
		await fs.access(filePath);
		console.log(`${c.yellow}Warning: A post with slug "${slug}" already exists!${c.reset}`);
		const overwrite = await ask(rl, `${c.bold}Overwrite existing file? (y/N):${c.reset} `);
		if (overwrite.trim().toLowerCase() !== 'y') {
			console.log(`${c.dim}Cancelled creation.${c.reset}\n`);
			return;
		}
	} catch {
		// File does not exist, good
	}

	const date = await prompt(rl, 'Date (YYYY-MM-DD)', getCurrentDate());
	const description = await prompt(
		rl,
		'Description / Summary',
		'A quick post on my latest thoughts and work.'
	);
	const tagsInput = await prompt(rl, 'Tags (comma separated)', 'Thoughts, Tech');
	const tags = tagsInput
		.split(',')
		.map((t) => t.trim())
		.filter(Boolean);
	const author = await prompt(rl, 'Author', 'Lloyd Nicolas');
	const cover = await handleCoverImage(rl, 'blog');

	const starterContent = `# ${title}\n\nWrite your blog post content here...`;
	const fileContent = serializeBlogMarkdown({
		title,
		date,
		description,
		cover: cover || '',
		tags,
		author,
		content: starterContent
	});

	await fs.writeFile(filePath, fileContent, 'utf-8');
	console.log(`\n${c.green}✓ Blog post created at src/content/blogs/${slug}.md${c.reset}\n`);

	const openNow = await ask(rl, `${c.bold}Open in editor now? (Y/n):${c.reset} `);
	if (openNow.trim().toLowerCase() !== 'n') {
		console.log(`${c.dim}Launching editor...${c.reset}`);
		const opened = openFileInEditor(filePath);
		if (!opened) {
			console.log(
				`${c.dim}Could not launch editor automatically. You can edit:${c.reset} src/content/blogs/${slug}.md`
			);
		}
	}
}

async function editBlog(rl) {
	const blogs = await loadBlogs();
	if (blogs.length === 0) {
		console.log(`\n${c.yellow}No blog posts found to edit.${c.reset}\n`);
		return;
	}

	listBlogsSummary(blogs);
	const answer = await ask(
		rl,
		`${c.bold}Select blog post number (1-${blogs.length}) or Enter to cancel:${c.reset} `
	);
	const num = parseInt(answer.trim(), 10);
	if (isNaN(num) || num < 1 || num > blogs.length) {
		console.log(`${c.dim}Cancelled.${c.reset}\n`);
		return;
	}

	const blog = blogs[num - 1];

	console.log(`\n${c.bold}What would you like to do with "${blog.title}"?${c.reset}`);
	console.log(`  ${c.cyan}1)${c.reset} Open markdown file in editor`);
	console.log(
		`  ${c.cyan}2)${c.reset} Edit frontmatter metadata (title, date, description, tags, cover)`
	);
	console.log(`  ${c.cyan}3)${c.reset} Back`);

	const choice = (await ask(rl, `${c.bold}Option [1-3]:${c.reset} `)).trim();

	if (choice === '1') {
		console.log(`${c.dim}Launching editor for ${blog.filepath}...${c.reset}`);
		openFileInEditor(blog.filepath);
		return;
	}

	if (choice === '2') {
		const title = await prompt(rl, 'Title', blog.title);
		const date = await prompt(rl, 'Date (YYYY-MM-DD)', blog.date || getCurrentDate());
		const description = await prompt(rl, 'Description', blog.description);
		const tagsInput = await prompt(rl, 'Tags (comma separated)', (blog.tags || []).join(', '));
		const tags = tagsInput
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);
		const author = await prompt(rl, 'Author', blog.author || 'Lloyd Nicolas');
		const cover = await handleCoverImage(rl, 'blog', blog.cover);

		const updatedContent = serializeBlogMarkdown({
			title,
			date,
			description,
			cover: cover || '',
			tags,
			author,
			content: blog.content
		});

		await fs.writeFile(blog.filepath, updatedContent, 'utf-8');
		console.log(`\n${c.green}✓ Blog post metadata updated!${c.reset}\n`);
	}
}

async function deleteBlog(rl) {
	const blogs = await loadBlogs();
	if (blogs.length === 0) {
		console.log(`\n${c.yellow}No blog posts found to delete.${c.reset}\n`);
		return;
	}

	listBlogsSummary(blogs);
	const answer = await ask(
		rl,
		`${c.bold}Select blog post number to delete (1-${blogs.length}) or Enter to cancel:${c.reset} `
	);
	const num = parseInt(answer.trim(), 10);
	if (isNaN(num) || num < 1 || num > blogs.length) {
		console.log(`${c.dim}Cancelled.${c.reset}\n`);
		return;
	}

	const target = blogs[num - 1];
	const confirm = await ask(
		rl,
		`${c.red}${c.bold}Are you sure you want to delete "${target.title}" (${target.filename})? (y/N):${c.reset} `
	);
	if (confirm.trim().toLowerCase() === 'y' || confirm.trim().toLowerCase() === 'yes') {
		await fs.unlink(target.filepath);
		console.log(`\n${c.green}✓ Blog post "${target.title}" removed!${c.reset}\n`);
	} else {
		console.log(`${c.dim}Aborted.${c.reset}\n`);
	}
}

// -------------------------------------------------------------
// MENUS & MAIN LOOP
// -------------------------------------------------------------

async function projectsMenu(rl, isDirect = false) {
	while (true) {
		console.log(`\n${c.bold}${c.cyan}=== Projects Manager ===${c.reset}`);
		console.log(`  ${c.cyan}1)${c.reset} Add a new project`);
		console.log(`  ${c.cyan}2)${c.reset} Edit an existing project`);
		console.log(`  ${c.cyan}3)${c.reset} Delete a project`);
		console.log(`  ${c.cyan}4)${c.reset} List all projects`);
		console.log(`  ${c.cyan}5)${c.reset} ${isDirect ? 'Exit' : 'Back to main menu'}`);

		const choice = (await ask(rl, `\n${c.bold}Select an option [1-5]:${c.reset} `)).trim();
		if (rl.closed || (choice === '' && !process.stdin.isTTY)) {
			break;
		}

		if (choice === '1') {
			await addProject(rl);
		} else if (choice === '2') {
			await editProject(rl);
		} else if (choice === '3') {
			await deleteProject(rl);
		} else if (choice === '4') {
			const projects = await loadProjects();
			listProjectsSummary(projects);
		} else if (choice === '5' || choice === 'q' || choice === 'exit') {
			break;
		} else {
			console.log(`${c.yellow}Invalid option.${c.reset}`);
		}
	}
}

async function blogsMenu(rl, isDirect = false) {
	while (true) {
		console.log(`\n${c.bold}${c.magenta}=== Blogs Manager ===${c.reset}`);
		console.log(`  ${c.magenta}1)${c.reset} Create a new blog post`);
		console.log(`  ${c.magenta}2)${c.reset} Edit a blog post (metadata or open in editor)`);
		console.log(`  ${c.magenta}3)${c.reset} Delete a blog post`);
		console.log(`  ${c.magenta}4)${c.reset} List all blog posts`);
		console.log(`  ${c.magenta}5)${c.reset} ${isDirect ? 'Exit' : 'Back to main menu'}`);

		const choice = (await ask(rl, `\n${c.bold}Select an option [1-5]:${c.reset} `)).trim();
		if (rl.closed || (choice === '' && !process.stdin.isTTY)) {
			break;
		}

		if (choice === '1') {
			await addBlog(rl);
		} else if (choice === '2') {
			await editBlog(rl);
		} else if (choice === '3') {
			await deleteBlog(rl);
		} else if (choice === '4') {
			const blogs = await loadBlogs();
			listBlogsSummary(blogs);
		} else if (choice === '5' || choice === 'q' || choice === 'exit') {
			break;
		} else {
			console.log(`${c.yellow}Invalid option.${c.reset}`);
		}
	}
}

async function main() {
	const rl = readline.createInterface({ input, output });

	rl.on('SIGINT', () => {
		console.log(`\n\n${c.dim}Goodbye!${c.reset}\n`);
		rl.close();
		process.exit(0);
	});

	const arg = (process.argv[2] || '').toLowerCase();

	try {
		if (arg === 'project' || arg === 'projects') {
			await projectsMenu(rl, true);
		} else if (arg === 'blog' || arg === 'blogs') {
			await blogsMenu(rl, true);
		} else {
			while (true) {
				console.log(`\n${c.bold}${c.green}=== Dookfolio Content Manager ===${c.reset}`);
				console.log(`  ${c.cyan}1)${c.reset} Manage Projects`);
				console.log(`  ${c.magenta}2)${c.reset} Manage Blog Posts`);
				console.log(`  ${c.yellow}3)${c.reset} Exit`);

				const choice = (await ask(rl, `\n${c.bold}Select an option [1-3]:${c.reset} `)).trim();
				if (rl.closed || (choice === '' && !process.stdin.isTTY)) {
					break;
				}

				if (choice === '1') {
					await projectsMenu(rl, false);
				} else if (choice === '2') {
					await blogsMenu(rl, false);
				} else if (choice === '3' || choice === 'q' || choice === 'exit') {
					break;
				} else {
					console.log(`${c.yellow}Invalid option.${c.reset}`);
				}
			}
		}
	} finally {
		rl.close();
		console.log(`\n${c.dim}Done!${c.reset}\n`);
	}
}

main().catch((err) => {
	console.error('Unexpected error:', err);
	process.exit(1);
});
