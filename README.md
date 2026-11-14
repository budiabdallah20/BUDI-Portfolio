# BUDI Portfolio

The personal portfolio of **Mohamed Abdallah (BUDI)**, a full-stack developer based in Suez, Egypt. The site presents his work as a bilingual digital museum, with an Egyptian-inspired entrance and interactive galleries.

[View the portfolio](https://budi-portfolio-dev.vercel.app/en) · [Version française](https://budi-portfolio-dev.vercel.app/fr) · [Security overview](https://budi-portfolio-dev.vercel.app/security)

## Explore

- **Services and skills** — illustrated exhibits and technology vitrines with keyboard-accessible details.
- **Projects** — featured showcases with a preview of the next project and direct demo and repository links.
- **Certificate gallery** — a document viewer with zoom and keyboard navigation. Unissued design studies carry a visible disclosure.
- **Contact and support** — direct contact links, downloadable vCard, and configured payment instructions.
- **BUDI OS** — private administration at `/admin`, with Supabase-backed portfolio content.

## Local development

Requires Node.js 22 or later and npm. The app uses Next.js, React, TypeScript, Tailwind CSS, Motion, GSAP, and Supabase.

```bash
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). For local TLS, use `npm run dev:https` and open [localhost:8443](https://localhost:8443).

## Configuration

Use [`.env.example`](.env.example) as the template for `.env.local`. Supabase URL and anonymous key are client-facing. Keep service-role keys, admin credentials, and private push keys in server-side environment variables. Configure production values in Vercel and keep environment files and private TLS keys out of Git.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

GitHub Actions runs these checks for changes to `main`. Asset sources and licenses are recorded in [ASSET_CREDITS.md](ASSET_CREDITS.md).
