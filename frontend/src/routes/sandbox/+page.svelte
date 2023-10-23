<script>
    import { INITIAL_AUDIO, audio } from '$lib/stores';
    import * as mm from 'music-metadata-browser';

    function loadFile() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'audio/*';
        fileInput.multiple = false;

        fileInput.onchange = async () => {
            const file = fileInput.files?.[0];

            if (!file) {
                return;
            }

            const metadata = await mm.parseBlob(file);

            console.log('PARSED', metadata);
            audio.set({
                ...INITIAL_AUDIO,
                metadata: {
                    title: metadata.common.title || file.name,
                    artist: metadata.common.artist || '',
                    album: metadata.common.album || '',
                    albumArt:
                        metadata.common.picture &&
                        metadata.common.picture.length > 0
                            ? URL.createObjectURL(
                                  new Blob([metadata.common.picture[0].data], {
                                      type: metadata.common.picture[0].format
                                  })
                              )
                            : ''
                },
                src: URL.createObjectURL(file)
            });
        };

        fileInput.click();
    }
</script>

<h1>Sandbox</h1>
<button class="btn variant-filled-primary" on:click={loadFile}>
    Load from File (Web API)
</button>
<button class="btn variant-filled-primary">
    Load from File (Native Binding)
</button>
<button class="btn variant-filled-primary">
    Load from Folder (Native Binding)
</button>
