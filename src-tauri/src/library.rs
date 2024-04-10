/*
    Library scanning and management
*/

use lofty::{Accessor, AudioFile, Tag, TaggedFile, TaggedFileExt};
use log::{debug, warn};
use regex::Regex;
use std::collections::HashMap;
use std::ffi::OsStr;
use std::fs::read_dir;
use std::path::{Path, PathBuf};
use tauri::Manager;
use time::OffsetDateTime;

const SUPPORTED_EXTENSIONS: &[&str] = &[
    "wav", "wave", "mp3", "m4a", "aac", "ogg", "flac", "webm", "caf",
];

const COVER_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "gif"];
const ANIM_COVER_EXTENSIONS: &[&str] = &["mp4", "webm", "mov"];

#[derive(Clone, serde::Serialize)]
struct ProgressUpdatePayload {
    id: String,
    title: String,
    message: Option<String>,
    progress: Option<f64>,
}

#[derive(Debug)]
struct AlbumArt {
    data: Box<[u8]>,
    mime_type: String,
}

#[derive(Debug)]
struct Metadata {
    title: String,
    artist: String,
    album_artist: String,
    album: String,
    album_art: Option<AlbumArt>,
    duration: u64,
    genres: Vec<String>,
    track_num: u32,
    total_tracks: u32,
    disc_num: u32,
    total_discs: u32,
    year: Option<u32>,
}

#[derive(serde::Deserialize, serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Track {
    id: String,
    location: String,
    r#type: Option<String>,
    title: String,
    artist_id: String,
    album_id: String,
    album_art: Option<String>,
    animated_album_art: Option<String>,
    genres: Vec<String>,
    duration: u64,
    track_num: u32,
    total_tracks: u32,
    disc_num: u32,
    total_discs: u32,
    #[serde(with = "time::serde::rfc3339")]
    created_at: OffsetDateTime,
    #[serde(with = "time::serde::rfc3339")]
    last_played_at: OffsetDateTime, // TODO: Make optional
}

#[derive(serde::Deserialize, serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Album {
    id: String,
    name: String,
    genres: Vec<String>,
    artist_id: String,
    album_art: Option<String>,
    animated_album_art: Option<String>,
    #[serde(with = "time::serde::rfc3339")]
    created_at: OffsetDateTime,
    year: Option<u32>,
}

#[derive(serde::Deserialize, serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Artist {
    id: String,
    name: String,
    genres: Vec<String>,
    #[serde(with = "time::serde::rfc3339")]
    created_at: OffsetDateTime,
}

#[derive(serde::Deserialize, serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Library {
    tracks: Vec<Track>,
    albums: Vec<Album>,
    artists: Vec<Artist>,
}

fn idify(name: &str) -> String {
    let reg = Regex::new("[^a-zA-Z0-9 -]").unwrap();
    format!(
        "{:x}",
        md5::compute(reg.replace_all(&name.to_lowercase(), "").as_bytes())
    )
}

fn recurse(path: impl AsRef<Path>) -> Vec<PathBuf> {
    let Ok(entries) = read_dir(path) else {
        return vec![];
    };

    entries
        .flatten()
        .flat_map(|entry| {
            let Ok(meta) = entry.metadata() else {
                return vec![];
            };

            if meta.is_dir() {
                return recurse(entry.path());
            }

            if meta.is_file() {
                return vec![entry.path()];
            }

            if meta.is_symlink() {
                let Ok(resolved_path) = std::fs::read_link(entry.path()) else {
                    return vec![];
                };

                if resolved_path.is_dir() {
                    return recurse(resolved_path);
                }

                return vec![resolved_path];
            }

            vec![]
        })
        .collect()
}

fn parse_metadata_tags(
    tag: Option<&Tag>,
    file: PathBuf,
    tagged_file: &TaggedFile,
) -> Result<Metadata, String> {
    let fallback_title = file.file_stem().unwrap().to_str().unwrap().to_string();

    let fallback_album = file
        .parent()
        .and_then(|parent| parent.file_stem())
        .and_then(|stem| stem.to_str())
        .unwrap_or("Unknown Album")
        .to_string();

    let fallback_artist = file
        .parent()
        .and_then(|parent| parent.parent())
        .and_then(|parent| parent.file_stem())
        .and_then(|stem| stem.to_str())
        .unwrap_or("Unknown Artist")
        .to_string();

    match tag {
        Some(tag) => {
            let album_artist = if let Some(artist) = tag.artist().as_deref() {
                artist.to_string()
            } else {
                fallback_artist.clone()
            };

            Ok(Metadata {
                title: tag
                    .title()
                    .as_deref()
                    .unwrap_or(&fallback_title)
                    .to_string(),
                artist: tag
                    .artist()
                    .as_deref()
                    .unwrap_or(&fallback_artist.clone())
                    .to_string(),
                album_artist: tag
                    .get_string(&lofty::ItemKey::AlbumArtist)
                    .unwrap_or(album_artist.as_str())
                    .to_string(),
                album: tag
                    .album()
                    .as_deref()
                    .unwrap_or(&fallback_album)
                    .to_string(),
                album_art: tag.pictures().first().and_then(|v| {
                    Some(AlbumArt {
                        mime_type: v
                            .mime_type()
                            .unwrap_or(&lofty::MimeType::Jpeg)
                            .as_str()
                            .to_string(),
                        data: v.data().into(),
                    })
                }),
                duration: tagged_file.properties().duration().as_secs(),
                genres: tag
                    .genre()
                    .as_deref()
                    .map(|v| vec![v.to_string()])
                    .unwrap_or_default(),
                track_num: tag.track().unwrap_or(1),
                total_tracks: tag.track_total().unwrap_or(1),
                disc_num: tag.disk().unwrap_or(1),
                total_discs: tag.disk_total().unwrap_or(1),
                year: tag.year(),
            })
        }

        None => Ok(Metadata {
            title: fallback_title,
            artist: fallback_artist.clone(),
            album_artist: fallback_artist,
            album: fallback_album,
            album_art: None,
            duration: tagged_file.properties().duration().as_secs(),
            genres: vec![],
            track_num: 1,
            total_tracks: 1,
            disc_num: 1,
            total_discs: 1,
            year: None,
        }),
    }
}

fn get_or_add_album_art(
    cache_dir: PathBuf,
    album_id: String,
    album_art: AlbumArt,
) -> Result<PathBuf, String> {
    let mimes = HashMap::from([
        ("image/jpeg", "jpg"),
        ("image/png", "png"),
        ("image/gif", "gif"),
    ]);

    let mut ext = "jpg";

    // Try to match the mime type to an extension
    if let Some(mime) = mimes.get(album_art.mime_type.as_str()) {
        ext = mime;
    }

    let path = cache_dir.join(format!("{}.{}", album_id, ext).as_str());

    if !cache_dir.exists() {
        std::fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    }

    std::fs::write(&path, album_art.data).map_err(|e| e.to_string())?;

    Ok(path)
}

#[tauri::command(async)] // Run me in a separate thread
pub fn update_library(
    app_handle: tauri::AppHandle,
    library: Library,
    music_directories: Vec<String>,
) -> Result<Library, String> {
    if music_directories.is_empty() {
        return Ok(Library {
            tracks: vec![],
            albums: vec![],
            artists: vec![],
        });
    }

    let mut new_library = library.clone();

    let all_files = music_directories
        .iter()
        .map(|dir| recurse(PathBuf::from(dir)))
        .flatten()
        .filter(|path| {
            !path.iter().any(|_f| {
                path.file_name()
                    .unwrap()
                    .to_str()
                    .unwrap()
                    .starts_with("._")
            })
        });

    let files = all_files.clone().filter(|path| {
        SUPPORTED_EXTENSIONS.iter().any(|ext| {
            path.extension()
                .map(|pext| pext.to_str().unwrap() == ext.to_string().as_str())
                .unwrap_or(false)
        })
    });

    // Files not in library
    let new_files = files.clone().filter(|path| {
        !library
            .tracks
            .iter()
            .any(|track| track.location == path.to_str().unwrap())
    });

    // Files named cover.png/jpg/jpeg/gif
    let cover_files = all_files.clone().into_iter().filter(|path| {
        str::to_lowercase(
            path.with_extension("")
                .file_name()
                .unwrap()
                .to_str()
                .unwrap(),
        ) == "cover"
            && COVER_EXTENSIONS.iter().any(|ext| {
                path.extension()
                    .unwrap_or(OsStr::new(""))
                    .to_ascii_lowercase()
                    .to_string_lossy()
                    == ext.to_string()
            })
    });

    let anim_cover_files = all_files.clone().into_iter().filter(|path| {
        str::to_lowercase(
            path.with_extension("")
                .file_name()
                .unwrap()
                .to_str()
                .unwrap(),
        ) == "anim"
            && ANIM_COVER_EXTENSIONS.iter().any(|ext| {
                path.extension()
                    .unwrap_or(OsStr::new(""))
                    .to_ascii_lowercase()
                    .to_string_lossy()
                    == ext.to_string()
            })
    });

    debug!(
        "{} files found, {} new",
        files.clone().count(),
        new_files.clone().count()
    );

    let mut prev_perc = 0.0;

    for (filei, file) in new_files.clone().enumerate() {
        debug!("Scanning {}", file.display());

        let new_perc = (filei + 1) as f64 / new_files.clone().count() as f64;

        if (new_perc - prev_perc) > 0.01 {
            app_handle
                .emit_all(
                    "progressUpdate",
                    ProgressUpdatePayload {
                        id: "updateLibrary".to_string(),
                        title: "Updating Library".to_string(),
                        message: None,
                        progress: Some(new_perc),
                    },
                )
                .unwrap();
            prev_perc = new_perc;
        }

        let tagged_file = lofty::Probe::open(file.clone())
            .unwrap()
            .guess_file_type()
            .unwrap()
            .read()
            .unwrap();

        let metadata = parse_metadata_tags(tagged_file.primary_tag(), file.clone(), &tagged_file);

        if let Ok(metadata) = metadata {
            let album_artist_id = idify(&metadata.album_artist);
            let artist_id = idify(&metadata.artist);
            let album_id = idify(format!("{}-{}", &metadata.album, album_artist_id).as_str());
            let id = idify(format!("{}-{}-{}", &metadata.title, artist_id, album_id).as_str());

            // Create artist if it doesn't exist in the library
            if !new_library
                .artists
                .iter()
                .any(|artist| artist.id == album_artist_id)
            {
                new_library.artists.push(Artist {
                    id: album_artist_id.clone(),
                    name: metadata.album_artist,
                    genres: vec![],
                    created_at: OffsetDateTime::now_utc(),
                });
            }

            if !new_library
                .artists
                .iter()
                .any(|artist| artist.id == artist_id)
            {
                new_library.artists.push(Artist {
                    id: artist_id.clone(),
                    name: metadata.artist,
                    genres: vec![],
                    created_at: OffsetDateTime::now_utc(),
                });
            }

            // Create album if it doesn't exist in the library
            if !new_library.albums.iter().any(|album| album.id == album_id) {
                // If cover_files len > 0, use the first file
                let mut album_art_path: Option<String> = None;
                let mut anim_album_art_path: Option<String> = None;

                // Find cover_files wiht same directory
                let covers = cover_files
                    .clone()
                    .filter(|cover_file| cover_file.parent().unwrap() == file.parent().unwrap());

                if covers.clone().count() > 0 {
                    album_art_path =
                        Some(covers.clone().next().unwrap().to_str().unwrap().to_string());
                } else {
                    // Get album art if it exists
                    let album_art = metadata.album_art;

                    if let Some(album_art) = album_art {
                        album_art_path = match get_or_add_album_art(
                            app_handle.path_resolver().app_cache_dir().unwrap(),
                            album_id.clone(),
                            album_art,
                        ) {
                            Ok(path) => Some(path.to_str().unwrap_or_default().to_string()),
                            Err(err) => {
                                eprintln!("Failed to get or add album art: {}", err);
                                None
                            }
                        };
                    }
                }

                let anim_covers = anim_cover_files
                    .clone()
                    .filter(|cover_file| cover_file.parent().unwrap() == file.parent().unwrap());

                if anim_covers.clone().count() > 0 {
                    anim_album_art_path = Some(
                        anim_covers
                            .clone()
                            .next()
                            .unwrap()
                            .to_string_lossy()
                            .to_string(),
                    );
                }

                debug!("Album art path: {:?}", album_art_path);

                new_library.albums.push(Album {
                    id: album_id.clone(),
                    name: metadata.album,
                    artist_id: album_artist_id.clone(),
                    genres: metadata.genres.clone(),
                    album_art: album_art_path,
                    animated_album_art: anim_album_art_path,
                    year: metadata.year,
                    created_at: OffsetDateTime::now_utc(),
                })
            }

            // Create track if it doesn't exist in the library
            if !new_library
                .tracks
                .iter()
                .any(|track| track.id == id && track.album_id == album_id)
            {
                new_library.tracks.push(Track {
                    id,
                    title: metadata.title,
                    artist_id: artist_id,
                    album_id: album_id,
                    track_num: metadata.track_num,
                    disc_num: metadata.disc_num,
                    total_discs: metadata.total_discs,
                    album_art: None,
                    animated_album_art: None,
                    duration: metadata.duration,
                    genres: metadata.genres,
                    location: file.to_str().unwrap().to_string(),
                    total_tracks: metadata.total_tracks,
                    r#type: Some("local".to_string()),
                    created_at: OffsetDateTime::now_utc(),
                    last_played_at: OffsetDateTime::now_utc(),
                });
            }
        } else {
            warn!("Failed to parse metadata: {}", file.to_str().unwrap());
        }
    }

    // Remove deleted files from tracklist
    new_library.tracks.retain(|track| {
        all_files
            .clone()
            .any(|file| file.to_str().unwrap() == track.location)
    });

    // Remove all albums with 0 tracks
    new_library.albums.retain(|album| {
        new_library
            .tracks
            .iter()
            .any(|track| track.album_id == album.id)
    });

    // Remove all artists with 0 tracks
    new_library.artists.retain(|artist| {
        new_library
            .tracks
            .iter()
            .any(|track| track.artist_id == artist.id)
    });

    Ok(new_library)
}
