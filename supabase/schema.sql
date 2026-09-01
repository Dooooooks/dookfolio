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
