# [psql.sh](https://psql.sh) - browser native PostgreSQL command line client

This project aims to provide a browser native psql-like experience.

https://www.loom.com/share/17743bb0cc55445a84e6138a43a2557f?sid=2ba5854b-1ecd-4e86-9a4c-b76b997379b6

## Start
First, you need to pick a dataset to work with. You can start with the empty database or one of the following datasets:
- **Chinook**. A sample database representing a digital media store.
- **Pokemon**. A dataset with a single table containing information about Pokemon.
- **Netflix**. A dataset with a single table containing information about Netflix shows.
- **pgrag**. A demo database for the <a href="https://neon.tech/docs/extensions/pgrag" target="_blank">pgrag</a> extension. It contains two tables: `docs` and `embeddings`. The `docs` table contains text from PGConfEU presentations. `embeddings` table contains chunks and their embedding vectors.

Now, you can observe how fast your database is created! Don't blink!
After creation, you can execute different queries and do whatever you want. After you leave the page or sit inactive for several minutes, the database will be destroyed.


## Features
- No need to install anything
- A big portion of psql backslash commands are supported (inspection commands)
- Instant fresh database spin-up

## How does it work
This project is powered by <a href="https://neon.tech" target="_blank">Neon</a>. It uses Neon instant branching feature to create a new database for each session.
To connect to the database we use the [Neon serverless driver](https://github.com/neondatabase/serverless).

## Disclaimer
This project is at early stage, some problems may occur. If you find a bug, please report it in the issues section.
This project is not a one-to-one replacement for psql. It aims to provide a similar experience in the browser, but it's an imitation.
