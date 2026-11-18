<p align="center">
  <img src="client/public/icon.png" height="75" alt="Task App Icon">
  <h1 align="center"><b>Task Manager App</b></h1>
</p>

<p align="center">
  <a href="https://jhbserver.tail4bcb71.ts.net/task-app/">
    <img alt="Live Preview" src="https://badgen.net/badge/icon/Live%20Preview?icon=terminal&label=Self-Hosted&color=blue" />
  </a>
  <img alt="Docker" src="https://badgen.net/badge/Docker/Multi-Stage%20Alpine?color=2496ED" />
  <img alt="Tests" src="https://badgen.net/badge/Tests/Jest%20%26%20Cypress?color=green" />
  <img alt="CI/CD" src="https://badgen.net/badge/CI%2FCD/GitHub%20Actions?color=black" />
</p>

> A Full Stack, containerized task management platform engineered with **Node.js**, **Express**, **MongoDB**, and **Vue 3 (IBM Carbon Design System)** — featuring JWT authentication, user avatar processing, real-time KPI metrics, automated testing, and self-hosted CI/CD deployment.

---

## Live Preview

Check out the [***Live App***](https://jhbserver.tail4bcb71.ts.net/task-app/) self-hosted on Ubuntu Server via Docker, Nginx Proxy Manager, and Tailscale Funnel.

## Documentation

Access my official projects [**documentation**](https://joaohb07.github.io/documentation/).

---

## Features

* **Authentication & Security:** JWT-based stateless/session token authentication, password hashing with `bcryptjs`, single-device or global multi-device logout, and permanent account deletion.
* **Task Management (CRUD):** Create, toggle completion status, inline-edit descriptions, delete tasks, and filter (`All` / `Pending` / `Completed`), sort, and paginate across personal backlogs.
* **Real-Time KPI Dashboard:** Live summary tiles tracking total, pending, and completed task counts.
* **Profile & Avatar Processing:** Update user credentials and upload PNG/JPEG profile avatars automatically resized and normalized (`250x250`) via `Sharp`.
* **Adaptive IBM Carbon UI:** Built with `@carbon/styles` and `@carbon/icons-vue`, supporting dynamic Dark (`g100`) and Light (`g10`) theme switching and responsive mobile drawer navigation.
* **Automated Email Notifications:** Welcome and account cancellation emails powered by `Nodemailer`.

---

## Prerequisites

* **Docker** & **Docker Compose** — for containerized execution (recommended)
* **Node.js** (v22+) & **npm** + **MongoDB** — for native local development without Docker

---

## Installation & Environment Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/joaohb07/task-app.git
    cd task-app
    ```

2. Create a `.env` file in the root directory and configure your environment variables:

    ```env
    PORT=3000
    JWT_SECRET=your_super_secret_jwt_key
    MONGODB_URL_DB=mongodb://task-mongo:27017/task-manager-api

    # Optional SMTP settings for Nodemailer
    SMTP_HOST=smtp.example.com
    SMTP_PORT=587
    SMTP_USER=your_smtp_user
    SMTP_PASS=your_smtp_password
    ```

---

## Running with Docker (Recommended)

The multi-stage `Dockerfile` compiles the Vue 3 + Vite bundle (`client/dist`) and serves both the static SPA and the `/api` REST endpoints from a single hardened `node:22-alpine` container (`USER node`), paired with an isolated `mongo:7` database container.

1. Ensure the shared reverse-proxy network exists (or remove the external network requirement for standalone testing):

    ```bash
    docker network create global-proxy
    ```

2. Build and start the containers in detached mode:

    ```bash
    docker compose up -d --build
    ```

3. Verify container health and logs:

    ```bash
    docker ps
    docker logs task-app
    ```

*(Note: If running locally without a reverse proxy, uncomment the `ports` sections in `docker-compose.yml` and access `http://localhost:3000`.)*

---

## Running Locally (Without Docker)

1. Install dependencies for both backend and frontend:

    ```bash
    # Install backend dependencies
    npm install

    # Install frontend dependencies
    cd client && npm install && cd ..
    ```

2. Make sure a local MongoDB instance is running and update `MONGODB_URL_DB=mongodb://127.0.0.1:27017/task-manager-api` in `.env`.

3. Start the backend API server (runs on `http://localhost:3000`):

    ```bash
    npm run dev
    ```

4. In a separate terminal, start the Vite frontend dev server (runs on `http://localhost:5173` with automatic `/api` proxy to port `3000`):

    ```bash
    cd client
    npm run dev
    ```

5. Open `http://localhost:5173` in your browser.

---

## Testing

The project enforces automated quality gates via GitHub Actions (`ci.yml`) covering both backend and frontend layers.

### Backend Unit & Integration Tests (Jest + Supertest)

Runs against an isolated in-memory MongoDB instance (`mongodb-memory-server`) with mocked email transport — no external database required:

```bash
npm test
```

### Frontend Component & E2E Tests (Cypress)

1. Run Cypress **Component Tests** headlessly:

    ```bash
    cd client
    npm run test:component
    ```

2. Run Cypress **End-to-End (E2E) Tests** headlessly (with `npm run dev` running on `http://localhost:5173`):

    ```bash
    cd client
    npm run test:e2e
    ```

3. Or open the interactive Cypress Test Runner:

    ```bash
    cd client
    npm run cy:open
    ```

---

## Technologies

### Backend & Persistence
* **[Node.js](https://nodejs.org/)** & **[Express](https://expressjs.com/)** — RESTful API server and static SPA host.
* **[MongoDB](https://www.mongodb.com/)** & **[Mongoose](https://mongoosejs.com/)** — Document persistence, schema validation, virtual relations, and cascade deletion hooks.
* **[JSON Web Tokens (JWT)](https://jwt.io/)** & **[bcryptjs](https://www.npmjs.com/package/bcryptjs)** — Authentication and cryptographic password hashing.
* **[Multer](https://www.npmjs.com/package/multer)** & **[Sharp](https://sharp.pixelplumbing.com/)** — Multipart file upload validation and high-performance image resizing.
* **[Nodemailer](https://nodemailer.com/)** — Transactional email delivery.

### Frontend & Design System
* **[Vue 3](https://vuejs.org/)** (Composition API) & **[Vite](https://vite.dev/)** — Reactive Single-Page Application and optimized asset bundling.
* **[Pinia](https://pinia.vuejs.org/)** & **[Vue Router](https://router.vuejs.org/)** — Centralized state management and guarded client-side routing.
* **[IBM Carbon Design System](https://carbondesignsystem.com/)** (`@carbon/styles`, `@carbon/icons-vue`) — Enterprise UI components, design tokens, and adaptive `g100`/`g10` themes.
* **[Axios](https://axios-http.com/)** — HTTP client with automatic Bearer token injection and relative subpath resolution.

### Testing, Infrastructure & DevOps
* **[Jest](https://jestjs.io/)**, **[Supertest](https://www.npmjs.com/package/supertest)**, & **[mongodb-memory-server](https://www.npmjs.com/package/mongodb-memory-server)** — Isolated backend unit and API integration testing.
* **[Cypress](https://www.cypress.io/)** — Automated Vue component and end-to-end browser testing.
* **[Docker](https://www.docker.com/)**, **[Nginx Proxy Manager](https://nginxproxymanager.com/)**, **[Tailscale Funnel](https://tailscale.com/kb/1223/funnel)**, & **[GitHub Actions](https://github.com/features/actions)** — Multi-stage containerization, reverse proxy subpath routing, zero-trust edge ingress, and automated CI/CD pipelines.