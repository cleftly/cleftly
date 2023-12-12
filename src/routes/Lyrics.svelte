<script lang="ts">
    import { _ } from 'svelte-i18n';
    import { parse } from '$lib/lrcutils';
    import { audio, front } from '$lib/stores';
    let lyricContainer: HTMLDivElement;
    let lyricRefs: { [key: number]: HTMLSpanElement } = {};
    let autoScroll = true;
    let progScrolling = false;

    let currentSong: Date | undefined;

    $: lyrics = $audio?.lyrics?.lyrics
        ? $audio.lyrics.format === 'lrc'
            ? parse($audio?.lyrics?.lyrics)
            : [{ timestamp: 0, content: $audio?.lyrics?.lyrics }]
        : null;

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
                {#if lyrics && lyrics.length > 0 && $audio?.lyrics}
                    {#each lyrics as lyric, i}
                        {#if lyric.content.trim() || i === lyricIndex}
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <!-- Can't be button or popup will close on click -->
                            <span
                                class="{lyric.content.trim()
                                    ? 'text-xl'
                                    : 'text-2xl'} mb-4 hover:brightness-90 cursor-pointer text-gray-400 whitespace-pre-line ${i ===
                                lyricIndex
                                    ? 'font-extrabold text-white'
                                    : ''} {!lyric.content.trim()
                                    ? 'text-6xl text-center animate-pulse'
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
                {:else}
                    <p class="text-xl">{$_('no_lyrics_found')}</p>
                {/if}
            </div>
        </div>
    </div>
{/if}
