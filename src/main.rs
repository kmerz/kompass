use axum::{
    Json, Router,
    extract::{Path, State},
    http::Method,
    http::StatusCode,
    http::Request,
    http::HeaderMap,
    http::HeaderValue,
    http::header,
    middleware::Next,
    body::Body,
    middleware::from_fn_with_state,
    response::Response,
    routing::{delete, get, post, put},
    response::IntoResponse,
};

use axum_extra::extract::cookie::{
    Cookie,
    SameSite,
    CookieJar,
};

use std::sync::Arc;

use argon2::{
    password_hash::PasswordHash,
    Argon2,
    PasswordVerifier,
};

use tower_http::cors::{CorsLayer};

use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::net::SocketAddr;

use jsonwebtoken::{encode, EncodingKey, Header, decode, DecodingKey, Validation};

use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Deserialize)]
struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}

#[derive(Deserialize)]
struct Config {
    jwt_secret: String,
    users: Vec<UserConfig>,
}

#[derive(Deserialize)]
struct UserConfig {
    username: String,
    password_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
struct Page {
    id: i64,
    title: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct CreatePage {
    title: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct UpdatePage {
    title: Option<String>,
    content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
struct Todo {
    id: i64,
    title: String,
    completed: bool,
}

#[derive(Serialize)]
struct Me {
  app: String,
}

#[derive(Debug, Deserialize)]
struct CreateTodo {
    title: String,
}

#[derive(Debug, Deserialize)]
struct UpdateTodo {
    title: Option<String>,
    completed: Option<bool>,
}

#[derive(Clone)]
struct AppState {
   db: SqlitePool,
   config: Arc<Config>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config_text = std::fs::read_to_string("config.toml")?;
    let config: Config = toml::from_str(&config_text)?;

    let pool = SqlitePool::connect("sqlite:data.db").await.unwrap();

    let state = AppState {
      db: pool.clone(),
      config: Arc::new(config),
    };

    let cors = CorsLayer::new()
    .allow_origin(
        "http://localhost:5173"
            .parse::<HeaderValue>()
            .unwrap(),
    )
    .allow_methods([
        Method::GET,
        Method::POST,
        Method::PUT,
        Method::DELETE,
    ])
    .allow_headers([
        header::CONTENT_TYPE,
        header::ACCEPT,
    ])
    .allow_credentials(true);

    let protected = Router::new()
        .route("/api/me", get(me))
        .route("/api/todos", post(create_todo))
        .route("/api/todos", get(list_todos))
        .route("/api/todos/{id}", get(get_todo))
        .route("/api/todos/{id}", put(update_todo))
        .route("/api/todos/{id}", delete(delete_todo))
        .route("/api/pages", post(create_page))
        .route("/api/pages", get(list_pages))
        .route("/api/pages/{id}", get(get_page))
        .route("/api/pages/{id}", put(update_page))
        .route("/api/pages/{id}", delete(delete_page))
        .route("/api/pages/by-title/{title}", get(get_by_title))
	.route("/api/logout", post(logout))
	.route_layer(from_fn_with_state(
          state.clone(),
          auth_middleware,
        ));
    
    let app = Router::new()
      .route("/api/login", post(login))
      .merge(protected)
      .with_state(state)
      .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));

    println!("Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await;
    pool.close().await;
    
    Ok(())
}

async fn create_page(
    State(state): State<AppState>,
    Json(payload): Json<CreatePage>,
) -> Result<(StatusCode, Json<Page>), StatusCode> {
    let page = sqlx::query_as!(
        Page,
        r#"
        INSERT INTO pages(title, content)
        VALUES (?, ?)
        RETURNING id, title, content
        "#,
        payload.title,
        payload.content,
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((StatusCode::CREATED, Json(page)))
}

async fn list_pages(State(state): State<AppState>) -> Result<Json<Vec<Page>>, StatusCode> {
    let pages = sqlx::query_as::<_, Page>(
        r#"
        SELECT id, title, content
        FROM pages
        ORDER BY id
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(pages))
}

async fn get_page(
    Path(id): Path<i64>,
    State(state): State<AppState>,
) -> Result<Json<Page>, StatusCode> {
    let page = sqlx::query_as::<_, Page>(
        r#"
        SELECT id, title, content
        FROM pages
        WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match page {
        Some(page) => Ok(Json(page)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn get_by_title(
    Path(title): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Page>, StatusCode> {
    let page = sqlx::query_as::<_, Page>(
        r#"
        SELECT id, title, content
        FROM pages
        WHERE title = ?
        "#,
    )
    .bind(title)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match page {
        Some(page) => Ok(Json(page)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn update_page(
    Path(id): Path<i64>,
    State(state): State<AppState>,
    Json(update): Json<UpdatePage>,
) -> Result<Json<Page>, StatusCode> {
    let mut page = sqlx::query_as::<_, Page>("SELECT id, title, content FROM pages WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    if let Some(title) = update.title {
        page.title = title;
    }

    if let Some(content) = update.content {
        page.content = content;
    }

    sqlx::query(
        r#"
        UPDATE pages
        SET title = ?, content = ?
        WHERE id = ?
        "#,
    )
    .bind(&page.title)
    .bind(&page.content)
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(page))
}

async fn delete_page(Path(id): Path<i64>, State(state): State<AppState>) -> StatusCode {
    match sqlx::query("DELETE FROM pages WHERE id = ?")
        .bind(id)
        .execute(&state.db)
        .await
    {
        Ok(result) if result.rows_affected() == 1 => StatusCode::NO_CONTENT,
        Ok(_) => StatusCode::NOT_FOUND,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

async fn me(
    State(state): State<AppState>
) -> Result<Json<Me>, StatusCode> {
  let me = Me { app: "Me".to_string() };
  Ok(Json(me))
  
}

async fn create_todo(
    State(state): State<AppState>,
    Json(payload): Json<CreateTodo>,
) -> Result<(StatusCode, Json<Todo>), StatusCode> {
    let todo = sqlx::query_as!(
        Todo,
        r#"
        INSERT INTO todos(title, completed)
        VALUES (?, FALSE)
        RETURNING id,title,completed as "completed: bool"
      "#,
        payload.title
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((StatusCode::CREATED, Json(todo)))
}

async fn list_todos(State(state): State<AppState>) -> Result<Json<Vec<Todo>>, StatusCode> {
    let todos = sqlx::query_as!(
        Todo,
        r#"
        SELECT id,title,completed as "completed: bool"
        FROM todos
        "#
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(todos))
}

async fn get_todo(
    Path(id): Path<i64>,
    State(state): State<AppState>,
) -> Result<Json<Todo>, StatusCode> {
    let todo = sqlx::query_as::<_, Todo>(
        r#"
        SELECT id, title, completed
        FROM todos
        WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match todo {
        Some(todo) => Ok(Json(todo)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn update_todo(
    Path(id): Path<i64>,
    State(state): State<AppState>,
    Json(update): Json<UpdateTodo>,
) -> Result<Json<Todo>, StatusCode> {
    let mut todo = sqlx::query_as::<_, Todo>("SELECT id, title, completed FROM todos WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    if let Some(title) = update.title {
        todo.title = title;
    }

    if let Some(completed) = update.completed {
        todo.completed = completed;
    }

    sqlx::query(
        r#"
        UPDATE todos
        SET title = ?, completed = ?
        WHERE id = ?
        "#,
    )
    .bind(&todo.title)
    .bind(todo.completed)
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(todo))
}

async fn delete_todo(Path(id): Path<i64>, State(state): State<AppState>) -> StatusCode {
    match sqlx::query("DELETE FROM todos WHERE id = ?")
        .bind(id)
        .execute(&state.db)
        .await
    {
        Ok(result) if result.rows_affected() == 1 => StatusCode::NO_CONTENT,
        Ok(_) => StatusCode::NOT_FOUND,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("failed to listen for Ctrl+C");

    println!("shutdown signal received");
}


async fn auth_middleware(
    State(state): State<AppState>,
    jar: CookieJar,
    request: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {

    let token = jar
        .get("auth_token")
        .ok_or(StatusCode::UNAUTHORIZED)?
        .value();


    verify_jwt(
        token,
        &state.config.jwt_secret,
    )
    .map_err(|_| StatusCode::UNAUTHORIZED)?;


    Ok(next.run(request).await)
}


fn create_jwt(
    username: &str,
    secret: &str,
) -> Result<String, jsonwebtoken::errors::Error> {

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let claims = Claims {
        sub: username.to_string(),
        exp: (now + 60 * 60 * 24) as usize, // 24 hours
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

fn verify_password(password: &str, hash: &str) -> bool {

    let parsed_hash = match PasswordHash::new(hash) {
        Ok(h) => h,
        Err(_) => return false,
    };

    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok()
}

fn verify_jwt(
    token: &str,
    secret: &str,
) -> Result<Claims, jsonwebtoken::errors::Error> {

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )?;

    Ok(token_data.claims)
}

async fn login(
    State(state): State<AppState>,
    Json(login): Json<LoginRequest>,
) -> Result<impl IntoResponse, StatusCode> {

    let user = state
        .config
        .users
        .iter()
        .find(|u| u.username == login.username)
        .ok_or(StatusCode::UNAUTHORIZED)?;


    if !verify_password(
        &login.password,
        &user.password_hash,
    ) {
        return Err(StatusCode::UNAUTHORIZED);
    }


    let token = create_jwt(
        &user.username,
        &state.config.jwt_secret,
    )
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;


    let cookie = Cookie::build(("auth_token", token))
        .http_only(true)
        .secure(false) // true when using HTTPS
        .same_site(SameSite::Lax)
        .path("/")
        .max_age(time::Duration::hours(24))
        .build();


    let mut headers = HeaderMap::new();

    headers.insert(
        "Set-Cookie",
        cookie
            .to_string()
            .parse()
            .unwrap(),
    );


    Ok((headers, Json("ok")))
}

async fn logout() -> impl IntoResponse {
    let mut cookie = Cookie::new("auth_token", "");
    cookie.set_http_only(true);
    cookie.set_same_site(SameSite::Lax);
    cookie.set_path("/");
    cookie.make_removal();

    let mut headers = HeaderMap::new();
    headers.insert(
        header::SET_COOKIE,
        cookie.to_string().parse().unwrap(),
    );

    (StatusCode::OK, headers)
}
