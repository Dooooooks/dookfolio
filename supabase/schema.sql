create extension if not exists "pgcrypto";

create table if not exists public.projects (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	description text not null,
	tags text[] not null default '{}',
	demo_url text,
	github_url text,
	cover_url text,
	created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Public read" on public.projects
	for select to anon, authenticated
	using (true);

create policy "Admin insert" on public.projects
	for insert to authenticated
	with check (true);

create policy "Admin update" on public.projects
	for update to authenticated
	using (true)
	with check (true);

create policy "Admin delete" on public.projects
	for delete to authenticated
	using (true);

create table if not exists public.experiences (
	id uuid primary key default gen_random_uuid(),
	period text not null,
	role text not null,
	company text not null,
	description text not null,
	order_num int not null default 0,
	created_at timestamptz not null default now()
);

alter table public.experiences enable row level security;

create policy "Public read experiences" on public.experiences
	for select to anon, authenticated
	using (true);

create policy "Admin insert experiences" on public.experiences
	for insert to authenticated
	with check (true);

create policy "Admin update experiences" on public.experiences
	for update to authenticated
	using (true)
	with check (true);

create policy "Admin delete experiences" on public.experiences
	for delete to authenticated
	using (true);

-- Initial seed for experiences
insert into public.experiences (period, role, company, description, order_num)
values
	('2023 — PRESENT', 'Software Developer', 'Freelance', 'Building full-stack web applications with SvelteKit, TypeScript, and Supabase — from landing pages to admin dashboards and everything in between.', 1),
	('2021 — PRESENT', 'Game Developer', 'Hobby Projects & Game Jams', 'Prototyping game mechanics, building small playable demos, and learning the craft of game feel — one jam at a time.', 2)
on conflict do nothing;

