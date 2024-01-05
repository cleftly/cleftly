/*
    Library scanning and management
*/
use std::fs::read_dir;
use std::path::{Path, PathBuf};
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::{MetadataOptions, StandardTagKey, Tag};
use symphonia::core::probe::{Hint, ProbeResult};

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
    album: String,
    album_art: Option<AlbumArt>,
    duration: Option<i32>,
    genres: Vec<String>,
    track_num: Option<i32>,
    total_tracks: Option<i32>,
    disc_num: i32,
    total_discs: i32,
    year: Option<i32>,
}

#[derive(serde::Deserialize, serde::Serialize)]
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
    created_at: String,
    last_played_at: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct Album {
    id: String,
    name: String,
    genres: Vec<String>,
    artist_id: String,
    album_art: Option<String>,
    created_at: String,
    year: Option<i32>,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct Artist {
    id: String,
    name: String,
    genres: Vec<String>,
    created_at: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct Library {
    tracks: Vec<Track>,
    albums: Vec<Album>,
    artists: Vec<Artist>,
}

fn recurse(path: impl AsRef<Path>) -> Vec<PathBuf> {
    let Ok(entries) = read_dir(path) else { return vec![] };
    entries
        .flatten()
        .flat_map(|entry| {
            let Ok(meta) = entry.metadata() else { return vec![] };
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
        StandardTagKey::DiscNumber => "DiscNumber",
        StandardTagKey::DiscTotal => "DiscTotal",
        StandardTagKey::Genre => "Genre",
        StandardTagKey::TrackNumber => "TrackNumber",
        StandardTagKey::TrackTotal => "TrackTotal",
        StandardTagKey::ReleaseDate => "ReleaseDate",
        StandardTagKey::TrackTitle => "TrackTitle",
        _ => "Unknown",
    }
}

fn parse_metadata_tags(mut probed: ProbeResult, file: PathBuf) -> Result<Metadata, String> {
    // Convert all tags with std_key to hashmap

    if let Some(metadata_rev) = probed.format.metadata().current() {
        let mut tags_map: std::collections::HashMap<String, symphonia::core::meta::Value> =
            std::collections::HashMap::new();

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

        // parent().parent() or "Unknown Artist"
        let fallback_artist = file
            .parent()
            .and_then(|parent| parent.parent())
            .and_then(|parent| parent.file_stem())
            .and_then(|stem| stem.to_str())
            .unwrap_or("Unknown Artist")
            .to_string();

        Ok(Metadata {
            // TrackTitle or fallback_title
            title: tags_map
                .get("TrackTitle")
                .map(|v| v.to_string())
                .unwrap_or(fallback_title),
            artist: tags_map
                .get("Artist")
                .map(|v| v.to_string())
                .or_else(|| tags_map.get("AlbumArtist").map(|v| v.to_string()))
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
                .and_then(|v| v.parse::<i32>().ok()),
            genres: tags_map
                .get("Genre")
                .map(|v| vec![v.to_string()])
                .unwrap_or_default(),
            track_num: tags_map
                .get("TrackNumber")
                .map(|v| v.to_string())
                .and_then(|v| v.parse::<i32>().ok()),
            total_tracks: tags_map
                .get("TrackTotal")
                .map(|v| v.to_string())
                .and_then(|v| v.parse::<i32>().ok()),
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
            year: Some(2000), // TODO
        })
    } else {
        Err("Failed to parse metadata".to_string())
    }
}

#[tauri::command(async)] // Run me in a separate thread
pub fn update_library(library: Library, music_directories: Vec<String>) -> Result<(), String> {
    if music_directories.is_empty() {
        return Ok(());
    }

    let new_library = Library {
        tracks: vec![],
        albums: vec![],
        artists: vec![],
    };

    // Walk through music directories
    let all_files = music_directories
        .iter()
        .map(|dir| recurse(PathBuf::from(dir)))
        .flatten()
        .filter(|path| {
            !path.iter().any(|f| {
                path.file_name()
                    .unwrap()
                    .to_str()
                    .unwrap()
                    .starts_with("._")
            })
        });

    let files = all_files.filter(|path| {
        SUPPORTED_EXTENSIONS.iter().any(|ext| {
            path.extension()
                .map(|pext| pext.to_str().unwrap() == ext.to_string().as_str())
                .unwrap_or(false)
        })
    });

    // Files named cover.png/jpg/jpeg/gif
    // TODO
    let cover_files = files.clone().into_iter().filter(|path| {
        str::to_lowercase(
            path.with_extension("")
                .file_name()
                .unwrap()
                .to_str()
                .unwrap(),
        ) == "cover"
    });

    println!("{} files found", files.clone().count());

    for file in files {
        println!("Scanning {}", file.display());
        let src = std::fs::File::open(file.as_path()).unwrap();
        let mss = MediaSourceStream::new(Box::new(src), Default::default());
        let mut hint = Hint::new();
        hint.with_extension(file.extension().unwrap().to_str().unwrap());

        let meta_opts: MetadataOptions = Default::default();
        let fmt_opts: FormatOptions = Default::default();

        // Probe the media source.
        let probed = symphonia::default::get_probe()
            .format(&hint, mss, &fmt_opts, &meta_opts)
            .expect("unsupported format");

        let metadata = parse_metadata_tags(probed, file);

        if let Ok(metadata) = metadata {}
    }
    Ok(())
}
