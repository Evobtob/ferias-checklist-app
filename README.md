# Checklist de Férias (Campo / Praia / Neve)

Web app simples, mobile-friendly, com persistência em Supabase.

## 1) Configurar base de dados
1. No Supabase SQL Editor, correr `supabase.sql`.
2. Confirmar que a tabela `trip_checklist_rows` foi criada.

## 2) Configurar credenciais
Editar `supabase-config.js`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## 3) Correr localmente
Na pasta do projeto:

```bash
python3 -m http.server 8080
```

Abrir:
- http://localhost:8080

## Funcionalidades
- Adicionar linha
- Editar células (auto-save)
- Apagar linha
- Ler dados persistentes ao abrir a app

## Nota de segurança
A policy atual permite `anon` total (demo rápida). Em produção, usar autenticação + policies restritas.
