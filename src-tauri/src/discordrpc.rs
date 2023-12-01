use std::{sync::Mutex, thread, time};

use discord_rpc_client::Client;

pub struct RichPresence(pub Mutex<Option<Client>>);

// TODO: Make this configurable
const CLIENT_ID: u64 = 1175267910818742353;

async fn get_client(state: tauri::State<'_, RichPresence>) -> Result<Client, String> {
    let existing_client = state.0.lock().unwrap().clone();

    if let Some(client) = existing_client {
        return Ok(client);
    } else {
        let mut client = Client::new(CLIENT_ID);

        client.on_error(|e| {
            println!("RPC Client Error: {:#?}", e);
        });

        // TODO
        // *state.0.lock().unwrap() = Some(client);

        // Return *state.0.lock().unwrap() as a Result
        Ok(client)
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
    let mut client = get_client(state).await.expect("Failed to get client");

    client.clear_activity().expect("Failed to clear activity");

    println!("Cleared activity");
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
