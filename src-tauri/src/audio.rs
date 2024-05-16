/*
    Native audio backend - Can be used instead of web audio api for:
    - Better audio format compatibility
    - More customizablity (EQ, )
    - Prevent suffering from silly Webkit bugs
*/

use std::{fs::File, io::BufReader, sync::Mutex, time::Duration};

use rodio::{Decoder, Sink};
use tauri::{Manager, State};

pub struct Audio(pub Mutex<Sink>);

#[tauri::command]
pub fn audio_play_track(
    app_handle: tauri::AppHandle,
    file_path: &str,
    audio: State<Audio>,
) -> Result<(), String> {
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
            Ok(())
        }
        Err(err) => Err(format!("Failed to acquire audio lock: {}", err)),
    }
}

#[tauri::command]
pub fn audio_pause(audio: State<Audio>) -> Result<(), String> {
    match audio.0.lock() {
        Ok(audio_lock) => {
            if !audio_lock.is_paused() {
                audio_lock.pause();
            }
            Ok(())
        }
        Err(err) => Err(format!("Failed to acquire audio lock: {}", err)),
    }
}

#[tauri::command]
pub fn audio_play(audio: State<Audio>) -> Result<(), String> {
    match audio.0.lock() {
        Ok(audio_lock) => {
            if audio_lock.is_paused() {
                audio_lock.play();
            }

            Ok(())
        }
        Err(err) => Err(format!("Failed to acquire audio lock: {}", err)),
    }
}

#[tauri::command]
pub fn audio_seek(audio: State<Audio>, time: f32) -> Result<(), String> {
    match audio.0.lock() {
        Ok(audio_lock) => match audio_lock.try_seek(Duration::from_secs_f32(time)) {
            Ok(_) => Ok(()),
            Err(err) => Err(format!("Failed to seek: {}", err)),
        },
        Err(err) => Err(format!("Failed to acquire audio lock: {}", err)),
    }
}

#[tauri::command]
pub fn audio_current_time() -> Result<f32, String> {
    Ok(0.0)
}

#[tauri::command]
pub fn audio_duration() -> Result<f32, String> {
    Ok(0.0)
}
