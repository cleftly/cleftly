<script lang="ts">
    /** eslint-disable svelte/valid-compile */
    import { _ } from 'svelte-i18n';
    import { parse } from '$lib/lyrics/lrcutils';
    import {
        parseRichSyncLyrics,
        getCurrentLineIndex,
        getCurrentWordIndex
    } from '$lib/lyrics/richsync';
    import { audio, front } from '$lib/stores';

    let lyricContainer: HTMLDivElement;
    let lyricRefs: { [key: number]: HTMLSpanElement } = {};
    let autoScroll = true;
    let progScrolling = false;

    let currentSong: Date | undefined;

    $: lyrics = (() => {
        if (!$audio?.lyrics) {
            return null;
        }

        switch ($audio?.lyrics?.format) {
            case 'richsync':
                return parseRichSyncLyrics(JSON.parse($audio.lyrics.lyrics));
            case 'lrc':
                return parse($audio.lyrics.lyrics);
            default:
                return `${$audio.lyrics.lyrics}`;
        }
    })();

    $: lyricIndex = lyrics
        ? (() => {
              const currentTime = $audio?.currentTime || 0;

              if (!lyricContainer) {
                  return 0;
              }

              for (let i = lyrics.length - 1; i >= 0; i--) {
                  if (currentTime >= lyrics[i].timestamp) {
                      if (lyricIndex !== i && autoScroll) {
                          progScrolling = true;

                          lyricContainer.scrollTo({
                              top: Math.max(
                                  0,
                                  (lyricRefs[lyricIndex + 1]?.offsetTop || 0) -
                                      20
                              ),
                              behavior: 'smooth'
                          });

                          setTimeout(() => {
                              progScrolling = false;
                          }, 500);
                      }

                      return i;
                  }
              }

              return 0;
          })()
        : 0;

    function scroll() {
        if (!progScrolling) {
            autoScroll = false;
        }
    }

    $: $audio?.track,
        () => {
            if (currentSong !== $audio?.playedAt) {
                progScrolling = false;
                autoScroll = true;
            }

            currentSong = $audio?.playedAt;
        };
</script>

{#if $audio && $front.modal === 'lyrics'}
    <div
        class="overflow-y-auto p-4 bg-neutral-300 dark:bg-neutral-900 min-h-full"
        bind:this={lyricContainer}
        on:scroll={scroll}
    >
        <div class="">
            <div class="flex flex-col py-8">
                {#if !lyrics || lyrics.length === 0}
                    <p class="text-xl">{$_('no_lyrics_found')}</p>
                {:else if $audio.lyrics?.format === 'plain'}
                    <p class="whitespace-pre-line">{lyrics}</p>
                {:else if $audio.lyrics?.format === 'richsync'}
                    <!-- <p>
                        getCurrentLineIndex: {getCurrentLineIndex(
                            lyrics,
                            $audio.currentTime
                        )}
                        getCurrentWordIndex: {getCurrentWordIndex(
                            lyrics[
                                getCurrentLineIndex(lyrics, $audio.currentTime)
                            ],
                            $audio.currentTime
                        )}
                    </p> -->
                    {#each lyrics as line, i}
                        {#if line.line.trim() || getCurrentLineIndex(lyrics, $audio.currentTime) === i}
                            <p
                                class="whitespace-pre-line {line.line.trim()
                                    ? 'text-xl'
                                    : 'text-2xl'} {!line.line.trim()
                                    ? 'text-6xl text-center animate-pulse'
                                    : ''}"
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
                                                $audio.currentTime =
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
                {:else if $audio.lyrics?.format === 'lrc'}
                    {#each lyrics as lyric, i}
                        {#if lyric.content.trim() || i === lyricIndex}
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <!-- Can't be button or popup will close on click -->
                            <span
                                class="{lyric.content.trim()
                                    ? 'text-xl'
                                    : 'text-2xl text-6xl text-center animate-pulse'} mb-4 hover:brightness-90 cursor-pointer text-gray-400 whitespace-pre-line ${i ===
                                lyricIndex
                                    ? 'font-extrabold text-white'
                                    : ''}"
                                bind:this={lyricRefs[i]}
                                on:click={() => {
                                    $audio.currentTime = lyric.timestamp;
                                    lyricContainer.scrollTo({
                                        top: Math.max(
                                            0,
                                            (lyricRefs[lyricIndex + 1]
                                                ?.offsetTop || 0) - 20
                                        ),
                                        behavior: 'smooth'
                                    });

                                    setTimeout(() => {
                                        autoScroll = true;
                                        progScrolling = false;
                                    }, 500);
                                }}
                                on:keydown={() => {
                                    $audio.currentTime = lyric.timestamp;
                                    lyricContainer.scrollTo({
                                        top: Math.max(
                                            0,
                                            (lyricRefs[lyricIndex + 1]
                                                ?.offsetTop || 0) - 20
                                        ),
                                        behavior: 'smooth'
                                    });

                                    setTimeout(() => {
                                        autoScroll = true;
                                        progScrolling = false;
                                    }, 500);
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
