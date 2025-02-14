use declarative_discord_rich_presence::{
    activity::{self, Assets, Button, Timestamps},
    DeclarativeDiscordIpcClient,
};
use tauri::State;

#[derive(serde::Deserialize)]
pub struct But {
    pub label: String,
    pub url: String,
}

#[derive(serde::Deserialize)]
pub struct Activity<'a> {
    pub state: Option<&'a str>,
    pub details: Option<&'a str>,
    pub large_image: Option<&'a str>,
    pub small_image: Option<&'a str>,
    pub large_text: Option<&'a str>,
    pub small_text: Option<&'a str>,
    pub start: Option<i64>,
    pub end: Option<i64>,
    pub buttons: Option<Vec<But>>,
    pub listening_type: Option<bool>,
}

#[tauri::command]
pub fn set_activity(
    activity: Activity,
    discord_ipc_client: State<'_, DeclarativeDiscordIpcClient>,
) -> Result<(), String> {
    let mut act = activity::Activity::new().state("Test");

    if let Some(state) = activity.state {
        act = act.state(state);
    }

    if let Some(details) = activity.details {
        act = act.details(details);
    }

    if activity.start.is_some() || activity.end.is_some() {
        let mut timestamp = Timestamps::new();

        if let Some(start) = activity.start {
            timestamp = timestamp.start(start);
        }

        if let Some(end) = activity.end {
            timestamp = timestamp.end(end);
        }

        act = act.timestamps(timestamp);
    }

    if activity.large_image.is_some()
        || activity.small_image.is_some()
        || activity.large_text.is_some()
        || activity.small_text.is_some()
    {
        let mut assets = Assets::new();

        if let Some(large_image) = activity.large_image {
            assets = assets.large_image(large_image);
        }

        if let Some(small_image) = activity.small_image {
            assets = assets.small_image(small_image);
        }

        if let Some(large_text) = activity.large_text {
            assets = assets.large_text(large_text);
        }

        if let Some(small_text) = activity.small_text {
            assets = assets.small_text(small_text);
        }

        act = act.assets(assets);
    }

    if let Some(buttons) = activity.buttons {
        // Vec of buttons
        let buttons = buttons
            .into_iter()
            .map(|b| Button::new(b.label, b.url))
            .collect();

        act = act.buttons(buttons);
    }

    if activity.listening_type.is_some() {
        act = act.activity_type(activity::ActivityType::Listening);
    }

    let _ = discord_ipc_client
        .set_activity(act)
        .map_err(|e| e.to_string());

    Ok(())
}

#[tauri::command]
pub fn clear_activity(
    discord_ipc_client: State<'_, DeclarativeDiscordIpcClient>,
) -> Result<(), String> {
    let _ = discord_ipc_client
        .clear_activity()
        .map_err(|e| e.to_string());

    Ok(())
}
