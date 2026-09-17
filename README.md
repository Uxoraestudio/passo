# Passo

Monorepo con dos aplicaciones independientes:

- [`web/`](web) — Sitio web público (Next.js).
- [`admin/`](admin) — Panel administrativo (Next.js).

## Desarrollo

Cada carpeta es una app Next.js independiente con su propio `package.json`.

```bash
# Sitio público
cd web
npm install
npm run dev

# Panel administrativo
cd admin
npm install
npm run dev
```
