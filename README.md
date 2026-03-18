> Looking for a shareable component template? Visit: https://github.com/sveltejs/component-template

---

# Svelte App

This is a project template for building applications using [Svelte](https://svelte.dev).
The template is maintained at: https://github.com/sveltejs/template

## Overview

This template provides a minimal setup for developing, building, and deploying Svelte applications using Rollup.

## Creating a New Project

To create a new project using this template with [degit](https://github.com/Rich-Harris/degit):

```bash
npx degit sveltejs/template svelte-app
cd svelte-app
```

> Ensure that [Node.js](https://nodejs.org) is installed on your system.

---

## Getting Started

Install project dependencies:

```bash
cd svelte-app
npm install
```

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to: http://localhost:5000

You should see your app running. Edit files inside the `src` directory and reload the page to view changes.

---

## Development Notes

By default, the server only accepts requests from `localhost`.
To allow access from other devices, update the `sirv` command in `package.json`:

```bash
--host 0.0.0.0
```

---

## Project Structure

```
/src        → Application source code  
/public     → Static assets  
rollup.config.js → Build configuration  
package.json → Project dependencies and scripts  
```

---

## Building for Production

To build an optimized production version:

```bash
npm run build
```

To run the production build:

```bash
npm run start
```

This uses [sirv](https://github.com/lukeed/sirv), which is included as a dependency for deployment compatibility.

---

## Single-Page App (SPA) Mode

By default, `sirv` serves only files in the `public` directory.

For SPA routing support, update the `start` script in `package.json`:

```js
"start": "sirv public --single"
```

---

## Deployment

### Using Now

Install Now:

```bash
npm install -g now
```

Deploy your app:

```bash
cd public
now deploy --name my-project
```

---

### Using Surge

Install Surge:

```bash
npm install -g surge
```

Build and deploy:

```bash
npm run build
surge public my-project.surge.sh
```

---

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

