/*
    Library scanning and management
*/
use log::debug;
use regex::Regex;
use std::collections::HashMap;
use std::fs::read_dir;
use std::path::{Path, PathBuf};
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::{MetadataOptions, StandardTagKey};
use symphonia::core::probe::{Hint, ProbeResult};
use time::OffsetDateTime;

const SUPPORTED_EXTENSIONS: &[&str] = &[
    "wav", "wave", "mp3", "m4a", "aac", "ogg", "flac", "webm", "caf",
];

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
    duration: i32,
    genres: Vec<String>,
    track_num: i32,
    total_tracks: i32,
    disc_num: i32,
    total_discs: i32,
    year: Option<i32>,
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
    genres: Vec<String>,
    duration: i32,
    track_num: i32,
    total_tracks: i32,
    disc_num: i32,
    total_discs: i32,
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
    #[serde(with = "time::serde::rfc3339")]
    created_at: OffsetDateTime,
    year: Option<i32>,
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
    format!("{:x}", md5::compute(reg.replace_all(name, "").as_bytes()))
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
            vec![]
        })
        .collect()
}

fn enum_to_string(value: StandardTagKey) -> &'static str {
    match value {
        StandardTagKey::Album => "Album",
        StandardTagKey::Artist => "Artist",
        StandardTagKey::AlbumArtist => "AlbumArtist",
        StandardTagKey::DiscNumber => "DiscNumber",
        StandardTagKey::DiscTotal => "DiscTotal",
        StandardTagKey::Genre => "Genre",
        StandardTagKey::TrackNumber => "TrackNumber",
        StandardTagKey::TrackTotal => "TrackTotal",
        StandardTagKey::ReleaseDate => "ReleaseDate",
        StandardTagKey::Date => "Date",
        StandardTagKey::TrackTitle => "TrackTitle",
        _ => "Unknown",
    }
}

fn parse_metadata_tags(mut probed: ProbeResult, file: PathBuf) -> Result<Metadata, String> {
    // Convert all tags with std_key to hashmap
    if let Some(metadata_rev) = probed.format.metadata().current() {
        let mut tags_map: HashMap<String, symphonia::core::meta::Value> = HashMap::new();

        for tag in metadata_rev.tags().into_iter() {
            if let Some(std_key) = tag.std_key {
                let key = enum_to_string(std_key).to_string();

                if key != "Unknown" {
                    tags_map.insert(key, tag.value.to_owned());
                }
            }
        }

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

        Ok(Metadata {
            title: tags_map
                .get("TrackTitle")
                .map(|v| v.to_string())
                .unwrap_or(fallback_title),
            artist: tags_map
                .get("Artist")
                .map(|v| v.to_string())
                .or_else(|| tags_map.get("AlbumArtist").map(|v| v.to_string()))
                .unwrap_or(fallback_artist.clone()),
            album_artist: tags_map
                .get("AlbumArtist")
                .map(|v| v.to_string())
                .or_else(|| tags_map.get("Artist").map(|v| v.to_string()))
                .unwrap_or(fallback_artist),
            album: tags_map
                .get("Album")
                .map(|v| v.to_string())
                .unwrap_or(fallback_album),
            album_art: metadata_rev.visuals().first().and_then(|v| {
                Some(AlbumArt {
                    mime_type: v.media_type.to_string(),
                    data: v.data.to_owned(),
                })
            }),
            duration: tags_map
                .get("Duration")
                .map(|v| v.to_string())
                .and_then(|v| v.parse::<i32>().ok())
                .unwrap_or(0),
            genres: tags_map
                .get("Genre")
                .map(|v| vec![v.to_string()])
                .unwrap_or_default(),
            track_num: tags_map
                .get("TrackNumber")
                .map(|v| v.to_string())
                .and_then(|v| v.parse::<i32>().ok())
                .unwrap_or(1),
            total_tracks: tags_map
                .get("TrackTotal")
                .map(|v| v.to_string())
                .and_then(|v| v.parse::<i32>().ok())
                .unwrap_or(1),
            disc_num: tags_map
                .get("DiscNumber")
                .map(|v| v.to_string())
                .and_then(|v| v.parse::<i32>().ok())
                .unwrap_or(1),
            total_discs: tags_map
                .get("DiscTotal")
                .map(|v| v.to_string())
                .and_then(|v| v.parse::<i32>().ok())
                .unwrap_or(1),
            year: tags_map
                .get("ReleaseDate")
                .or_else(|| tags_map.get("Date"))
                .map(|v| {
                    v.to_string()
                        .split('-')
                        .next()
                        .unwrap_or("")
                        .parse::<i32>()
                        .unwrap_or(0)
                }),
        })
    } else {
        Err("Failed to parse metadata".to_string())
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
            && !(SUPPORTED_EXTENSIONS.iter().any(|ext| {
                path.extension()
                    .map(|pext| pext.to_str().unwrap() == ext.to_string().as_str())
                    .unwrap_or(false)
            }))
    });

    debug!(
        "{} files found, {} new",
        files.clone().count(),
        new_files.clone().count()
    );

    for file in new_files {
        debug!("Scanning {}", file.display());
        let src = std::fs::File::open(file.as_path()).unwrap();
        let mss = MediaSourceStream::new(Box::new(src), Default::default());
        let mut hint = Hint::new();
        hint.with_extension(file.extension().unwrap().to_str().unwrap());

        let meta_opts: MetadataOptions = Default::default();
        let fmt_opts: FormatOptions = Default::default();

        // Probe the media source.
        let Ok(probed) = symphonia::default::get_probe().format(&hint, mss, &fmt_opts, &meta_opts)
        else {
            continue;
        };

        let metadata = parse_metadata_tags(probed, file.clone());

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
                    created_at: OffsetDateTime::now_utc(), // TODO
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
                    created_at: OffsetDateTime::now_utc(), // TODO
                });
            }

            // Create album if it doesn't exist in the library
            if !new_library.albums.iter().any(|album| album.id == album_id) {
                // If cover_files len > 0, use the first file
                let mut album_art_path: Option<String> = None;

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

                debug!("Album art path: {:?}", album_art_path);

                new_library.albums.push(Album {
                    id: album_id.clone(),
                    name: metadata.album,
                    artist_id: album_artist_id.clone(),
                    genres: metadata.genres.clone(),
                    album_art: album_art_path,
                    year: metadata.year,
                    created_at: OffsetDateTime::now_utc(), // TODO
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
                    duration: metadata.duration,
                    genres: metadata.genres,
                    location: file.to_str().unwrap().to_string(),
                    total_tracks: metadata.total_tracks,
                    r#type: Some("local".to_string()),
                    created_at: OffsetDateTime::now_utc(), // TODO
                    last_played_at: OffsetDateTime::now_utc(),
                });
            }
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
