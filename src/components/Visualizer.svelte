<!--This component visualizes audio for use in TrackList -->
<script context="module" lang="ts">
    import { writable } from 'svelte/store';

    export const visualizerState = writable<{
        audioSource: MediaElementAudioSourceNode | null;
        analyser: AnalyserNode | null;
    }>({
        audioSource: null,
        analyser: null
    });
</script>

<script lang="ts">
    import { onMount } from 'svelte';
    import { player } from '$lib/stores';

    export let width = 40; // equiv of w-10
    export let height = 40; // equiv of h-10

    let canvas: HTMLCanvasElement;

    onMount(() => {
        const ctx = canvas.getContext('2d');
        const audioCtx = new (window.AudioContext ||
            window.webkitAudioContext)();
        const audioElement = $player.webAudioElement;

        if (!ctx || !audioCtx || !audioElement) {
            console.error('Failed to create audio visualizer');
            return;
        }

        var audioSource: MediaElementAudioSourceNode;
        var analyser: AnalyserNode;

        if ($visualizerState.analyser && $visualizerState.audioSource) {
            audioSource = $visualizerState.audioSource;
            analyser = $visualizerState.analyser;
        } else {
            audioSource = audioCtx.createMediaElementSource(audioElement);
            analyser = audioCtx.createAnalyser();

            audioSource.connect(analyser);
            analyser.connect(audioCtx.destination);

            visualizerState.set({
                audioSource: audioSource,
                analyser: analyser
            });
        }

        analyser.fftSize = 64; // Use a fixed number of bars (8 bars)
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const barWidth = canvas.width / 8;

        function animate() {
            let x = 0;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            analyser.getByteFrequencyData(dataArray);
            const maxBarHeight = canvas.height * 0.6; // Adjust heights for smaller heights
            for (let i = 2; i < 13; i += 2) {
                const barHeight = (dataArray[i] / 255) * maxBarHeight; // Normalize the height
                ctx.fillStyle = 'white';
                ctx.fillRect(
                    x,
                    canvas.height - barHeight - canvas.height * 0.2,
                    barWidth,
                    barHeight
                );
                x += barWidth;
            }

            requestAnimationFrame(animate);
        }

        animate();
    });
</script>

<div>
    <canvas bind:this={canvas} {width} {height} />
</div>
