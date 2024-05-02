use std::process::Command;
use which::which;

#[tauri::command]
pub async fn check_for_ytdl() -> Option<String> {
    if which("yt-dlp").is_ok() {
        return Some("yt-dlp".to_string());
    } else if which("youtube-dl").is_ok() {
        return Some("youtube-dl".to_string());
    } else {
        return None;
    };
}

#[tauri::command]
pub async fn get_ytdl_url(track_url: String) -> Result<String, String> {
    // yt-dlp -f "bestaudio[ext=m4a]" --get-url {url}
    let cmd = if which("yt-dlp").is_ok() {
        "yt-dlp"
    } else {
        "youtube-dl"
    };

    if which(cmd).is_err() {
        return Err("yt-dlp or youtube-dl not found".to_string());
    }

    let output = Command::new(cmd)
        .arg("-f")
        .arg("bestaudio[ext=m4a]")
        .arg("--get-url")
        .arg("--extractor-args")
        .arg("youtube:player-client=web")
        .arg("--socket-timeout")
        .arg("10")
        .arg(track_url)
        .output();

    match output {
        Ok(output) => {
            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).to_string())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).to_string())
            }
        }
        Err(err) => Err(err.to_string()),
    }
}
