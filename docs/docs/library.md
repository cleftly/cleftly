# Managing Your Music Library

## Organizing your music library

### Metadata

The best way to make sure your music library is properly organized is to simply add proper metadata to all of your files. There are several programs to help you achieve this, such as [MusicBrainz Picard](https://picard.musicbrainz.org/). We plan to add built-in metadata scanning in the future.

### Folder structure

If you do not wish to or are unable to add the proper metadata to your files, then you can use the following folder structure to store your music library.

```bash title="Music directory"
- Artist
    - Album
        - Track
```

## Audio formats

### Recommended audio formats

For the best compatibility and encoding, we recommend using the following audio formats for your music library. These formats are supported on all platforms we officially support.

#### Lossless audio

- **[FLAC](https://xiph.org/flac/)**

#### Lossy audio

- **AAC**
- **MP3**

### Supported audio formats

#### Supported everywhere

- MP3
- AAC
- FLAC
- WAV

## Missing tracks

- File with the `.mp4` extension will not be recognized, use `.m4a` instead

## Album Art

Cleftly will use album art from the audio file metadata or from a `cover.{png,jpg,gif}` in the same directory as the audio file, in the following order:

- Album art from a `cover.{png,jpg,gif}` in the same directory as the audio file
- Album art from the audio file metadata

## Animated Album Art

You can provide an animated album art video with the name `anim.{mp4,webm,mov}` in the same directory as the audio file.

This animated art will be shown in the album view and on the player.

### Caching

Cleftly will cache the album art from audio file metadata to speed up the process. You may need to Reset DB in Settings if you change the album art from audio file metadata.
