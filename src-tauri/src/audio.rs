/*
    Native audio backend - Can be used instead of web audio api for:
    - Better audio format compatibility
    - More customizablity (EQ, )
    - Prevent suffering from silly Webkit bugs
*/

use std::{fs::File, io::BufReader, sync::Mutex};

use rodio::{Decoder, Sink};
use tauri::{Manager, State};

pub struct Audio(pub Mutex<Sink>);

#[tauri::command]
pub fn play_audio(
    app_handle: tauri::AppHandle,
    file_path: &str,
    audio: State<Audio>,
) -> Result<String, String> {
    if !app_handle.fs_scope().is_allowed(&file_path) {
        return Err("File not in scope".into());
    }

    let file = match File::open(file_path) {
        Ok(file) => BufReader::new(file),
        Err(err) => return Err(format!("Failed to open file: {}", err)),
    };

    let source = match Decoder::new(file) {
        Ok(decoder) => decoder,
        Err(err) => return Err(format!("Failed to create audio decoder: {}", err)),
    };

    match audio.0.lock() {
        Ok(audio_lock) => {
            audio_lock.clear();
            audio_lock.append(source);
            audio_lock.play();
            Ok("Playing".into())
        }
        Err(err) => Err(format!("Failed to acquire audio lock: {}", err)),
    }
}

#[derive(serde::Serialize)]
pub struct AudioInfo {
    paused: bool,
    volume: f32,
    current_time: f32,
    muted: bool,
}

#[derive(serde::Deserialize)]
pub struct AudioInfoIn {
    paused: bool,
    volume: f32,
    current_time: f32,
    muted: bool,
}

#[tauri::command]
pub fn get_info(audio: State<Audio>) -> Result<AudioInfo, String> {
    match audio.0.lock() {
        Ok(audio_lock) => {
            // Assuming you can get the necessary information from the `audio_lock`
            let info = AudioInfo {
                paused: audio_lock.is_paused(),
                volume: audio_lock.volume(),
                current_time: 0.0,
                muted: audio_lock.volume() == 0.0,
            };
            Ok(info)
        }
        Err(err) => Err(format!("Failed to acquire audio lock: {}", err)),
    }
}

#[tauri::command]
pub fn set_info(audio: State<Audio>, info: AudioInfoIn) -> Result<String, String> {
    match audio.0.lock() {
        Ok(audio_lock) => {
            audio_lock.set_volume(info.volume);

            if info.muted {
                audio_lock.set_volume(0.0);
            } else if audio_lock.volume() == 0.0 {
                audio_lock.set_volume(info.volume);
            }

            if info.paused && !audio_lock.is_paused() {
                audio_lock.pause();
            } else if !info.paused && audio_lock.is_paused() {
                audio_lock.play();
            }

            Ok("Set".into())
        }
        Err(err) => Err(format!("Failed to acquire audio lock: {}", err)),
    }
}
