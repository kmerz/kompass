use axum::{
    Json, Router,
    extract::{Path, State},
    http::Method,
    http::StatusCode,
    routing::{delete, get, post, put},
};
use tower_http::cors::{Any, CorsLayer};

use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::net::SocketAddr;

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
}

#[tokio::main]
async fn main() {
    let pool = SqlitePool::connect("sqlite:data.db").await.unwrap();

    let state = AppState { db: pool.clone() };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers(Any);

    let app = Router::new()
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
        .with_state(state)
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));

    println!("Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await;
    pool.close().await;
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
