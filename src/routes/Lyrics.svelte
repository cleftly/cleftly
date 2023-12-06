<script lang="ts">
    import { popup, type PopupSettings } from '@skeletonlabs/skeleton';
    import { TextSelect } from 'lucide-svelte';
    import { _ } from 'svelte-i18n';
    import { parse } from '$lib/lrcutils';
    import { audio } from '$lib/stores';

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

    const lyricPopup: PopupSettings = {
        event: 'click',
        target: 'lyricPopup',
        placement: 'top-end'
    };

    $: $audio?.track,
        () => {
            if (currentSong !== $audio?.playedAt) {
                progScrolling = false;
                autoScroll = true;
            }

            currentSong = $audio?.playedAt;
        };
</script>

{#if $audio}
    <div
        data-popup="lyricPopup"
        class="w-72 h-[calc(100vh-4.75rem-3rem)] overflow-y-auto card p-4 variant-filled-primary"
        on:scroll={scroll}
        bind:this={lyricContainer}
    >
        <div class="">
            <div class="flex flex-col py-8">
                {#if lyrics && lyrics.length > 0 && $audio?.lyrics}
                    {#each lyrics as lyric, i}
                        {#if lyric.content.trim() || i === lyricIndex}
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <!-- Can't be button or popup will close on click -->
                            <span
                                class="text-2xl mb-4 hover:brightness-90 cursor-pointer text-gray-400 whitespace-pre-line ${i ===
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

    <button class="btn btn-sm variant-soft w-6 h-6 p-0" use:popup={lyricPopup}>
        <TextSelect />
    </button>
{/if}
