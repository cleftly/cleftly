// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audio;
mod discordrpc;
mod stream;
use audio::Audio;
use discordrpc::RichPresence;
use rodio::{OutputStream, Sink};
use std::sync::Mutex;
use stream::handle_stream_request;

fn main() {
    let (_stream, stream_handle) = OutputStream::try_default().unwrap();

    tauri::Builder::default()
        .manage(Audio(Mutex::new(Sink::try_new(&stream_handle).unwrap())))
        .manage(RichPresence(Mutex::new(None)))
        .plugin(tauri_plugin_persisted_scope::init())
        .register_uri_scheme_protocol("stream", |app, request| handle_stream_request(app, request))
        .invoke_handler(tauri::generate_handler![
            audio::play_audio,
            audio::get_info,
            audio::set_info,
            discordrpc::clear_activity,
            discordrpc::set_activity
        ])
        .run(tauri::generate_context!())
        .expect("Error while running application");
}
