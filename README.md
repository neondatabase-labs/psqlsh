<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://neon.com/brand/neon-logo-dark-color.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://neon.com/brand/neon-logo-light-color.svg">
  <img width="250px" alt="Neon Logo fallback" src="https://neon.com/brand/neon-logo-dark-color.svg">
</picture>

# [psql.sh](https://psql.sh) - browser native PostgreSQL command line client

This project gives you a browser-native, psql-like experience for working with a Postgres database, without having to install anything.

Check out the demo video:

https://www.loom.com/share/17743bb0cc55445a84e6138a43a2557f?sid=2ba5854b-1ecd-4e86-9a4c-b76b997379b6

## Start
First, pick a dataset to work with. You can start with an empty database or choose one of these sample datasets:

- **Chinook**. A sample database representing a digital media store.
- **Pokemon**. A dataset with a single table containing information about Pokemon.
- **Netflix**. A dataset with a single table containing information about Netflix shows.
- **pgrag**. A demo database for the <a href="https://neon.tech/docs/extensions/pgrag" target="_blank">pgrag</a> extension. It contains two tables: `docs` and `embeddings`. The `docs` table contains text from PGConfEU presentations and the `embeddings` table contains chunks and their embedding vectors.

Make your selection and watch as your database spins up in real-time — don't blink!

Once created, you can execute any queries you want. Feel free to explore, experiment, and run as many queries as you'd like. You can't break anything, as this is a temporary database and will be destroyed after you leave the page or stay inactive for several minutes.

## Features

- No installation required
- Supports most psql backslash commands (inspection commands)
- Instant database spin-up with each session
- AI-powered SQL generation:
    - Type `\ai <your query description>` to get a SQL query generated for you
    - Example: `\ai find all pokemons`, `\ai create a "users" table with two columns: "id" and "name"`

## How does it work

This project is powered by <a href="https://neon.tech" target="_blank">Neon</a>. It leverages Neon's instant branching feature to create a new database for each session. Database connections are handled using the [Neon serverless driver](https://github.com/neondatabase/serverless).

## Disclaimer

This project is in its early stages, some issues may occur. If you find a bug, please report it in the issues section.

Also, note that this project is not intended as a direct replacement for psql, but instead provides a similar experience in the browser.
