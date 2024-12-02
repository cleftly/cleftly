// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// mod audio;
mod discordrpc;
mod files;
mod library;
mod stream;
mod ytdl;
// use audio::Audio;
use declarative_discord_rich_presence::DeclarativeDiscordIpcClient;
use http::{header::CONTENT_TYPE, response::Builder as ResponseBuilder, StatusCode};
use rodio::OutputStream;
use std::sync::Mutex;
use stream::handle_stream_request;
use tauri::Manager;
use tauri_plugin_log::{Target, TargetKind};

#[cfg(target_os = "linux")]
pub struct DbusState(Mutex<Option<dbus::blocking::SyncConnection>>);

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

#[cfg(target_os = "macos")]
use tauri::WindowEvent;

#[cfg(target_os = "macos")]
mod window_ext;

#[cfg(target_os = "macos")]
use window_ext::WindowExt;

const DISCORD_RPC_CLIENT_ID: &str = "1175267910818742353";

fn main() {
    let (_stream, stream_handle) = OutputStream::try_default().unwrap();

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            #[cfg(target_os = "linux")]
            app.manage(DbusState(Mutex::new(
                dbus::blocking::SyncConnection::new_session().ok(),
            )));

            #[cfg(target_os = "macos")]
            {
                let win = app.get_window("main").unwrap();
                win.set_transparent_titlebar(true);
                win.position_traffic_lights(25.0, 25.0);
            }

            let discord_ipc_client = DeclarativeDiscordIpcClient::new(DISCORD_RPC_CLIENT_ID);

            discord_ipc_client.enable();

            app.manage(discord_ipc_client);

            Ok(())
        })
        .on_window_event(|_e, _| {
            #[cfg(target_os = "macos")]
            if let WindowEvent::Resized(..) = _e.event() {
                let win = _e.window();
                win.position_traffic_lights(15.0, 20.0);
            }
        })
        // .manage(Audio(Mutex::new(Sink::try_new(&stream_handle).unwrap())))
        .plugin(tauri_plugin_persisted_scope::init())
        // .plugin(tauri_plugin_context_menu::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .register_asynchronous_uri_scheme_protocol("stream", move |_ctx, request, responder| {
            match handle_stream_request(_ctx.app_handle(), request) {
                Ok(http_response) => responder.respond(http_response),
                Err(e) => responder.respond(
                    ResponseBuilder::new()
                        .status(StatusCode::INTERNAL_SERVER_ERROR)
                        .header(CONTENT_TYPE, "text/plain")
                        .body(e.to_string().as_bytes().to_vec())
                        .unwrap(),
                ),
            }
        })
        .invoke_handler(tauri::generate_handler![
            // audio::audio_play_track,
            // audio::audio_play,
            // audio::audio_pause,
            // audio::audio_seek,
            // audio::audio_current_time,
            // audio::audio_duration,
            discordrpc::clear_activity,
            discordrpc::set_activity,
            files::show_in_folder,
            library::update_library,
            ytdl::get_ytdl_url,
            ytdl::check_for_ytdl,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running application");
}
