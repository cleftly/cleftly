use std::{sync::Mutex, thread, time};

use discord_rpc_client::Client;

pub struct RichPresence(pub Mutex<Option<Client>>);

const CLIENT_ID: u64 = 1175267910818742353;

// Get or create the client
async fn get_client(state: tauri::State<'_, RichPresence>) -> Result<Client, String> {
    // Check if the client already exists
    if let Some(client) = state.0.lock().unwrap().as_ref() {
        return Ok(client.clone());
    } else {
        let client = Client::new(CLIENT_ID);
        *state.0.lock().unwrap() = Some(client.clone());
        return Ok(client);
    }
}

#[derive(serde::Deserialize)]
pub struct Activity {
    title: String,
    artist: String,
    album: String,
}

#[tauri::command]
pub async fn clear_activity(state: tauri::State<'_, RichPresence>) -> Result<(), String> {
    let mut client = get_client(state).await?;
    client.clear_activity().expect("Failed to clear activity");
    Ok(())
}

#[tauri::command]
pub async fn set_activity(
    state: tauri::State<'_, RichPresence>,
    activity: Activity,
) -> Result<(), String> {
    let mut client = get_client(state).await.expect("Failed to get client");

    client.start();
    client
        .set_activity(|a| a.state(&activity.title))
        .map_err(|e| format!("Failed to set activity: {}", e))?;

    println!(
        "Set activity: {} - {} - {}",
        activity.title, activity.artist, activity.album
    );

    Ok(())
}
