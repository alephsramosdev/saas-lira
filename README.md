# Lira

Aplicacao Next.js para controle financeiro com metas, transacoes e persistencia em Supabase.

## Requisitos

- Node.js 20+
- Projeto Supabase com o schema de `supabase/schema.sql` aplicado
- Variaveis de ambiente configuradas

## Ambiente local

1. Instale as dependencias:

	```bash
	npm install
	```

2. Crie o arquivo `.env.local` a partir de `.env.example`.

3. Preencha as variaveis:

	```bash
	NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
	SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key
	```

	A aplicacao tambem aceita `SUPABASE_SECRET_KEY` por compatibilidade, mas `SUPABASE_SERVICE_ROLE_KEY` e o nome recomendado.

4. Rode o projeto:

	```bash
	npm run dev
	```

## Publicacao no GitHub

Se o remoto ainda nao estiver configurado:

```bash
git remote add origin https://github.com/alephsramosdev/saas-lira.git
git branch -M main
git push -u origin main
```

## Deploy na Vercel

1. Importe o repositorio `alephsramosdev/saas-lira` na Vercel.
2. Framework preset: `Next.js`.
3. Configure estas variaveis de ambiente no projeto:

	```bash
	NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
	SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key
	```

4. Execute o SQL de `supabase/schema.sql` no Supabase.
5. Dispare o deploy.

Nao e necessario `vercel.json` para este projeto: o build padrao `next build` ja esta funcionando em producao.

## Build de producao

```bash
npm run build
```
