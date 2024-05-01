<script lang="ts">
    /** eslint-disable svelte/valid-compile */
    import { _ } from 'svelte-i18n';
    import { writeTextFile } from '@tauri-apps/api/fs';
    import { parse, type Lyric } from '$lib/lyrics/lrcutils';
    import {
        parseRichSyncLyrics,
        getCurrentLineIndex,
        getCurrentWordIndex,
        type RichSyncLyric
    } from '$lib/lyrics/richsync';
    import { audio, front, player } from '$lib/stores';
    import { eventManager } from '$lib/events';
    import { getOrCreateConfig } from '$lib/config';
    import { removeExtension } from '$lib/utils';

    let lyrics: string | RichSyncLyric[] | Lyric[] | null = null;
    let lyricContainer: HTMLDivElement;
    let lyricRefs: { [key: number]: HTMLSpanElement } = {};
    let prevLyrics = $audio?.lyrics;

    eventManager.onEvent('onLyricsLoaded', async (lyrics) => {
        if (!lyrics || !$audio) {
            return;
        }

        $audio.lyrics = lyrics;

        if (!(await getOrCreateConfig()).lyrics_save) {
            return;
        }

        if (!(($audio.track.type || 'local') === 'local')) {
            return;
        }

        try {
            if (lyrics?.format === 'lrc') {
                await writeTextFile(
                    `${removeExtension($audio.track.location)}.lrc`,
                    lyrics.lyrics
                );
            } else if (lyrics?.format === 'plain') {
                await writeTextFile(
                    `${removeExtension($audio.track.location)}.txt`,
                    lyrics.lyrics
                );
            }
        } catch (e) {
            console.error(e);
            console.error('Failed to save lyrics to disk');
        }
    });
    audio.subscribe(async (value) => {
        if (JSON.stringify(value?.lyrics) === JSON.stringify(prevLyrics)) {
            return;
        }

        prevLyrics = $audio?.lyrics;

        lyrics = (() => {
            switch ($audio?.lyrics?.format) {
                case 'richsync':
                    return parseRichSyncLyrics(
                        JSON.parse($audio.lyrics.lyrics)
                    );
                case 'lrc':
                    return parse($audio.lyrics.lyrics);
                default:
                    return `${$audio?.lyrics?.lyrics}`;
            }
        })();
    });

    $: lyricIndex = lyrics
        ? (() => {
              const currentTime = $audio?.currentTime || 0;

              if (!lyricContainer) {
                  return 0;
              }

              for (let i = lyrics.length - 1; i >= 0; i--) {
                  if (currentTime >= lyrics[i].timestamp) {
                      return i;
                  }
              }

              return 0;
          })()
        : 0;
</script>

{#if $audio && $front.modal === 'lyrics'}
    <div
        class="overflow-y-auto p-4 bg-neutral-300 dark:bg-neutral-900 min-h-full"
        bind:this={lyricContainer}
    >
        <div class="">
            <div class="flex flex-col py-8">
                {#if !lyrics}
                    <p class="text-xl">{$_('no_lyrics_found')}</p>
                {:else if $audio.lyrics?.format === 'plain'}
                    <p class="whitespace-pre-line">{lyrics}</p>
                {:else if $audio.lyrics?.format === 'richsync'}
                    {#each lyrics as line, i}
                        {#if line.line.trim() || getCurrentLineIndex(lyrics, $audio.currentTime) === i}
                            <p
                                class="whitespace-pre-line mb-4 {line.line.trim()
                                    ? 'text-xl'
                                    : 'text-6xl text-center animate-pulse'}"
                                bind:this={lyricRefs[i]}
                            >
                                {#if line.line.trim()}
                                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                                    {#each line.parts as part, pi}
                                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                                        <span
                                            class="hover:brightness-90 cursor-pointer text-gray-400 whitespace-pre-line {pi <=
                                                getCurrentWordIndex(
                                                    lyrics[
                                                        getCurrentLineIndex(
                                                            lyrics,
                                                            $audio.currentTime
                                                        )
                                                    ],
                                                    $audio.currentTime
                                                ) &&
                                            i ===
                                                getCurrentLineIndex(
                                                    lyrics,
                                                    $audio.currentTime
                                                )
                                                ? 'font-extrabold text-white'
                                                : ''}"
                                            on:click={() => {
                                                $player.webAudioElement.currentTime =
                                                    part.timestamp;
                                            }}
                                        >
                                            {part.text}
                                        </span>
                                    {/each}
                                {:else}
                                    •••
                                {/if}
                            </p>
                        {/if}
                    {/each}
                    <p class="whitespace-pre-line">{$audio.lyrics.credits}</p>
                {:else if $audio.lyrics?.format === 'lrc'}
                    {#each lyrics as lyric, i}
                        {#if lyric.content.trim() || i === lyricIndex}
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <!-- Can't be button or popup will close on click -->
                            <span
                                class="{lyric.content.trim()
                                    ? 'text-xl'
                                    : 'text-6xl text-center animate-pulse'} mb-4 hover:brightness-90 cursor-pointer text-gray-400 whitespace-pre-line ${i ===
                                lyricIndex
                                    ? 'font-extrabold text-white'
                                    : ''}"
                                bind:this={lyricRefs[i]}
                                on:click={() => {
                                    $player.webAudioElement.currentTime =
                                        lyric.timestamp;
                                    lyricContainer.scrollTo({
                                        top: Math.max(
                                            0,
                                            (lyricRefs[lyricIndex + 1]
                                                ?.offsetTop || 0) - 20
                                        ),
                                        behavior: 'smooth'
                                    });
                                }}
                                on:keydown={() => {
                                    $player.webAudioElement.currentTime =
                                        lyric.timestamp;
                                    lyricContainer.scrollTo({
                                        top: Math.max(
                                            0,
                                            (lyricRefs[lyricIndex + 1]
                                                ?.offsetTop || 0) - 20
                                        ),
                                        behavior: 'smooth'
                                    });
                                }}
                            >
                                {lyric.content.trim() || '•••'}
                            </span>
                        {/if}
                    {/each}
                    <p class="whitespace-pre-line">{$audio.lyrics.credits}</p>
                {/if}
            </div>
        </div>
    </div>
{/if}
