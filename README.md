# kompass

A personal notes and to-do app. Pages are written in Markdown and can link to each other by
title; a simple to-do list sits next to them. One small Rust server, a React frontend.

- **Backend**: Rust, [axum](https://github.com/tokio-rs/axum), SQLite via [sqlx](https://github.com/launchbadge/sqlx),
  login with argon2 password hashes and a JWT in an HTTP-only cookie
- **Frontend**: React, TypeScript, Vite, react-markdown with GitHub-flavoured Markdown

## Run it locally

```sh
cp config.example.toml config.toml   # set jwt_secret and your user (see below)
export DATABASE_URL=sqlite:data.db
sqlx database create && sqlx migrate run   # cargo install sqlx-cli
cargo run                                  # API on http://127.0.0.1:3001

cd frontend && npm install && npm run dev  # app on http://localhost:5173
```

`config.toml` holds the secret for signing logins and the users. Create a password hash with
the `argon2` command line tool:

```sh
echo -n 'your password' | argon2 "$(openssl rand -hex 16)" -id -e
```

`config.toml` and `data.db` are in `.gitignore`; never commit them.

## Status

A hobby project in progress. The API is local-only for now (`127.0.0.1:3001`, CORS for the
Vite dev server, cookies without `Secure`), so put it behind HTTPS before using it anywhere else.

## License

MIT, see [LICENSE](LICENSE).
