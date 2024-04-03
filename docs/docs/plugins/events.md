# Events

## Send an event

```js
this.api.events.eventManager.fireEvent('onTrackChange', audio);
```

## Handle an event

```js
this.api.events.eventManager.onEvent('onTrackChange', this.handleTrackChange);
```

## Receivable Events

### Tracks

- `onTrackPlay` - Fired when the track is played
- `onTrackChange` - Fired when the track changes (Pause/unpause, seeking, played)

### Library

- `onLibraryUpdate` - Fired after library is updated (scanned)

### Search

- `onSearch`- Fired when a search is performed

## Sendable Events

### Search Results

- `addSearchResult` - Add a custom search results tab to the search results list (Takes payload of `FriendlyTrack`)

## Example Plugin

```js
export default class EventsTestPlugin {
 static id = 'com.cleftly.docs.events';
 static name = 'Events Test Plugin';
 static author = 'Cleftly Docs';
 static description = '';
 static version = '1.0.0';
 static api_version = 'v1'; // Must be v1

 api;

 constructor(api) {
  this.api = api;

  this.api.events.eventManager.onEvent('onTrackChange', this.handleTrackChange);
 }

 async handleTrackChange(audio) {
  console.log(
   `Playing track ${audio.track.title} by ${audio.track.artist.name}`
  );
 }
}
```
