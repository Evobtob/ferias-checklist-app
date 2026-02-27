-- Criar tabela para a checklist de férias
create table if not exists public.trip_checklist_rows (
  id uuid primary key default gen_random_uuid(),
  ord integer not null default 1,
  campo text,
  praia text,
  neve text,
  updated_at timestamptz not null default now()
);

-- Ativar RLS
alter table public.trip_checklist_rows enable row level security;

-- Política simples para demo (anon pode ler/escrever/apagar)
-- Ajusta depois para segurança mais apertada.
drop policy if exists "anon_all_trip_checklist_rows" on public.trip_checklist_rows;
create policy "anon_all_trip_checklist_rows"
  on public.trip_checklist_rows
  for all
  to anon
  using (true)
  with check (true);
