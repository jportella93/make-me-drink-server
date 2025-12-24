# make-me-drink-server

Back end for online drinking game made with express and web sockets.

[Play here](https://makemedrink.netlify.app/)

[Front-end](https://github.com/jportella93/make-me-drink-client)

## Deployment (Render)

This repository is a **Node.js Socket.IO server** (no database).

- **Start command**: `yarn start`
- **Health check**: `GET /healthz`
- **Port**: uses `PORT` (set by Render automatically)

### Environment variables

- **`ALLOWED_ORIGINS`** (optional): Comma-separated list of allowed browser origins for Socket.IO, for example:
  - `ALLOWED_ORIGINS=https://your-site.pages.dev,https://your-custom-domain.com`
  - If omitted/empty, **all origins are allowed** (convenient for demos).

### One-click blueprint

There is a `render.yaml` in the repo that can be used as a Render Blueprint.

## Local development

```bash
yarn install
yarn dev
```
