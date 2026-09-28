// 桌面端：托盘里的「快发」—— 草稿先落本地，再调服务端发消息，发完通知窗口
// 只用来演示 atlas 的 Rust 腿（tree-sitter 解析，不需要编译）
use tauri::{AppHandle, Emitter, State};

const API_BASE: &str = "http://localhost:5000";
const QUICK_SENT: &str = "quick_sent";

pub struct Db(pub sqlx::SqlitePool);

/// 快发一条消息：离线也不丢，先存草稿
#[tauri::command]
async fn quick_send(app: AppHandle, db: State<'_, Db>, project_id: String, text: String) -> Result<(), String> {
    save_draft(&db.0, &project_id, &text).await?;
    let client = reqwest::Client::new();
    client
        .post(format!("{}/api/projects/{}/messages", API_BASE, project_id))
        .json(&serde_json::json!({ "text": text }))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    clear_draft(&db.0, &project_id).await?;
    app.emit(QUICK_SENT, &project_id).map_err(|e| e.to_string())
}

/// 草稿落本地 SQLite
async fn save_draft(db: &sqlx::SqlitePool, project_id: &str, text: &str) -> Result<(), String> {
    sqlx::query("INSERT INTO drafts (project_id, text) VALUES (?, ?)")
        .bind(project_id)
        .bind(text)
        .execute(db)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

/// 发成功了清掉草稿
async fn clear_draft(db: &sqlx::SqlitePool, project_id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM drafts WHERE project_id = ?")
        .bind(project_id)
        .execute(db)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![quick_send])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
