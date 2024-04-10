# Plugins

Cleftly provides (WIP) support for user created plugins which can enhance the Cleftly experience. Cleftly plugins are written in JavaScript and can access several events and APIs.

## Plugin Class

```js
export default class MyPlugin {
 static id = 'com.example.myplugin'; // Must be unique
 static name = 'My Plugin'; // Display name
 static author = 'JohnDoe123'; // The creator(s) of the plugin, can be anything as long as it's accurate
 static description = 'My awesome plugin'; // A short description of the plugin
 static version = '1.0.0'; // The version of the plugin
 static license = 'MIT'; // The license of the plugin
 static api_version = 'v1'; // Must be v1
 static features = []; // Advanced Cleftly features the plugin utilizes. Possible: 'searchResults', 'externalTracks'

 api;

 constructor(api) {
  this.api = api;
  this.setupEventListeners();
 }

 setupEventListeners() {
  this.api.events.eventManager.onEvent('onTrackChange', this.handleTrackChange);
 }

 async handleTrackChange(audio) {
  console.log(
   `Playing track ${audio.track.title} by ${audio.track.artist.name}`
  );
 }
}
```
