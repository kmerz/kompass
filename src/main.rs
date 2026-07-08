use axum::{
    extract::{Path, State},
    http::StatusCode,
    http::Method,
    routing::{delete, get, post, put},
    Json, Router,
};
use tower_http::cors::{CorsLayer, Any};

use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    net::SocketAddr,
    sync::{Arc, Mutex},
};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Page {
    id: u64,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Todo {
    id: u64,
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
    todos: Arc<Mutex<HashMap<u64, Todo>>>,
    pages: Arc<Mutex<HashMap<u64, Page>>>,
    next_todo_id: Arc<Mutex<u64>>,
    next_page_id: Arc<Mutex<u64>>,
}

#[tokio::main]
async fn main() {
    let state = AppState {
        todos: Arc::new(Mutex::new(HashMap::new())),
	pages: Arc::new(Mutex::new(HashMap::new())),
        next_todo_id: Arc::new(Mutex::new(1)),
	next_page_id: Arc::new(Mutex::new(1)),
    };

    let cors = CorsLayer::new()
    .allow_origin(Any)
    .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
    .allow_headers(Any);

    let app = Router::new()
    .route("/todos", post(create_todo))
    .route("/todos", get(list_todos))
    .route("/todos/{id}", get(get_todo))
    .route("/todos/{id}", put(update_todo))
    .route("/todos/{id}", delete(delete_todo))
    .route("/pages", post(create_page))
    .route("/pages", get(list_pages))
    .route("/pages/{id}", get(get_page))
    .route("/pages/{id}", put(update_page))
    .route("/pages/{id}", delete(delete_page))
    .route("/pages/{id}/title", get(get_title))
    .with_state(state)
    .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));

    println!("Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .unwrap();

    axum::serve(listener, app).await.unwrap();
}

async fn create_page(
    State(state): State<AppState>,
    Json(payload): Json<CreatePage>,
) -> (StatusCode, Json<Page>) {
    let mut next = state.next_page_id.lock().unwrap();
    let id = *next;
    *next += 1;

    let page = Page {
        id,
        title: payload.title,
        content: payload.content,
    };

    state.pages.lock().unwrap().insert(id, page.clone());

    (StatusCode::CREATED, Json(page))
}

async fn list_pages(
    State(state): State<AppState>,
) -> Json<Vec<Page>> {
    let pages = state.pages.lock().unwrap();

    Json(pages.values().cloned().collect())
}

async fn get_page(
    Path(id): Path<u64>,
    State(state): State<AppState>,
) -> Result<Json<Page>, StatusCode> {
    let pages = state.pages.lock().unwrap();

    pages
        .get(&id)
        .cloned()
        .map(Json)
        .ok_or(StatusCode::NOT_FOUND)
}

async fn get_title(
    Path(id): Path<u64>,
    State(state): State<AppState>,
) -> Result<Json<String>, StatusCode> {
    let pages = state.pages.lock().unwrap();

    pages
      .get(&id)
      .cloned()
      .map(|p| Json(p.title))
      .ok_or(StatusCode::NOT_FOUND)
}

async fn update_page(
    Path(id): Path<u64>,
    State(state): State<AppState>,
    Json(update): Json<UpdatePage>,
) -> Result<Json<Page>, StatusCode> {
    let mut pages = state.pages.lock().unwrap();

    let page = pages.get_mut(&id).ok_or(StatusCode::NOT_FOUND)?;

    if let Some(title) = update.title {
        page.title = title;
    }

    if let Some(content) = update.content {
        page.content = content;
    }

    Ok(Json(page.clone()))
}

async fn delete_page(
    Path(id): Path<u64>,
    State(state): State<AppState>,
) -> StatusCode {
    let mut pages = state.pages.lock().unwrap();

    if pages.remove(&id).is_some() {
        StatusCode::NO_CONTENT
    } else {
        StatusCode::NOT_FOUND
    }
}

async fn create_todo(
    State(state): State<AppState>,
    Json(payload): Json<CreateTodo>,
) -> (StatusCode, Json<Todo>) {
    let mut next = state.next_todo_id.lock().unwrap();
    let id = *next;
    *next += 1;

    let todo = Todo {
        id,
        title: payload.title,
        completed: false,
    };

    state.todos.lock().unwrap().insert(id, todo.clone());

    (StatusCode::CREATED, Json(todo))
}

async fn list_todos(
    State(state): State<AppState>,
) -> Json<Vec<Todo>> {
    let todos = state.todos.lock().unwrap();

    Json(todos.values().cloned().collect())
}

async fn get_todo(
    Path(id): Path<u64>,
    State(state): State<AppState>,
) -> Result<Json<Todo>, StatusCode> {
    let todos = state.todos.lock().unwrap();

    todos
        .get(&id)
        .cloned()
        .map(Json)
        .ok_or(StatusCode::NOT_FOUND)
}

async fn update_todo(
    Path(id): Path<u64>,
    State(state): State<AppState>,
    Json(update): Json<UpdateTodo>,
) -> Result<Json<Todo>, StatusCode> {
    let mut todos = state.todos.lock().unwrap();

    let todo = todos.get_mut(&id).ok_or(StatusCode::NOT_FOUND)?;

    if let Some(title) = update.title {
        todo.title = title;
    }

    if let Some(completed) = update.completed {
        todo.completed = completed;
    }

    Ok(Json(todo.clone()))
}

async fn delete_todo(
    Path(id): Path<u64>,
    State(state): State<AppState>,
) -> StatusCode {
    let mut todos = state.todos.lock().unwrap();

    if todos.remove(&id).is_some() {
        StatusCode::NO_CONTENT
    } else {
        StatusCode::NOT_FOUND
    }
}
