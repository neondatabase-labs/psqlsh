# psql.sh - browser native PostgreSQL command line client

This project aims to provide a browser native psql-like experience.

## Start
First you need to pick a dataset to work with. You can start with the empty database or one of the following datasets:
- **Chinook**. A sample database representing a digital media store.
- **Pokemon**. A dataset with a single table containing information about Pokemon.
- **Netflix**. A dataset with a single table containing information about Netflix shows.
- **pgrag**. A demo database for the <a href="https://neon.tech/docs/extensions/pgrag" target="_blank">pgrag</a> extension. It contains two tables: `docs` and `embeddings`. The `docs` table contains text from PGConfEU presentations. `embeddings` table contains chunks and their embedding vectors.

## Features
- No need to install anything
- Big portion of psql backslash commands are supported (inspection commands)
- Instant fresh database spin-up

## How does it work
This project is powered by <a href="https://neon.tech" target="_blank">Neon</a>. It uses Neon instant branching feature to create a new database for each session

## Disclaimer
This project is at early stage, some problems may occur. If you find a bug, please report it in the issues section.
This project is not a one-to-one replacement for psql. It aims to provide a similar experience in the browser, but it's an imitation.
