# frontend-ai-npc-orchestrator

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_9AV7pHez2wJQT2oRFdA1mM5imswA)

## Getting Started

Create an env file before running the app:

```bash
cp .env.example .env.local
```

The frontend will call the backend URL in `NEXT_PUBLIC_BACKEND_URL`.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Flujo de perfiles

- En `/perfiles` puedes crear, editar, eliminar o clonar perfiles.
- La clonación no crea el perfil automáticamente: abre el wizard de creación con los datos precargados para que revises cada campo antes de guardar.
- Si el perfil original tiene un escenario que el frontend puede identificar, ese escenario también se usa como base del clon.
- Si eliges un escenario existente desde el wizard, se reutiliza ese mismo escenario. Si lo editas desde ahí, se actualiza ese escenario existente; solo se crea uno nuevo cuando usas `Crear nuevo`.
- Los controles de severidad de los escenarios permiten valores enteros de `1` a `5` (el backend rechaza decimales). La severidad máxima del NPC en el perfil admite pasos de `0.1`.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/Juan110-2/frontend-ai-npc-orchestrator" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
