# Known Compatibility Issues

## Audio Playback (Web Audio API)

### macOS

- Due to Safari bugs, some audio formats may have occasional popping/cut off in playback. There is no specification of which audio formats are affected, but it seems to at least affect some FLAC files.

### Linux

- **Media Session API is currently disabled** in Webkit2Gtk, meaning viewing/management of playback from the desktop/MPRIS is not available. _See <https://bugs.webkit.org/show_bug.cgi?id=247527#c10> for more information._ _Binding to Rust to implement MPRIS support would be possible, if anyone would like to make a PR for that. ;\)_
- **Media streaming is not supported**. This means that the entire file has to be loaded into memory before it can be played. _This should not have noticeable performance impact_ unless playing very large tracks. _See <https://bugs.webkit.org/show_bug.cgi?id=146351#c5>._
