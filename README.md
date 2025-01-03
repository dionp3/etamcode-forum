# etamcode-forum

Forum sub-domain for Etamcode verse.

This project uses SQLite for development. After cloning the remote repo, you need to setup sqlite and node packages:

- create a directory called `tmp` and `.env`
- copy the content of `.env.example` to `.env`
- run `npm i`, after the installation done, run `node ace migration:run`

to start development, to run the app use `npm run dev`.
