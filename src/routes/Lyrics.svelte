<script lang="ts">
    import { popup, type PopupSettings } from '@skeletonlabs/skeleton';
    import { TextSelect } from 'lucide-svelte';
    import { parse } from '$lib/lrcutils';
    import { audio } from '$lib/stores';
    import { _ } from 'svelte-i18n';

    let lyricContainer: HTMLDivElement;
    let lyricRefs: { [key: number]: HTMLSpanElement } = {};
    let lastScroll: number = 0; // Date in ms

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
                      if (
                          lyricIndex !== i &&
                          lastScroll < new Date().getTime() - 5000
                      ) {
                          //   lyricRefs[lyricIndex + 1]?.scrollIntoView({
                          //       behavior: 'smooth'
                          //   });
                          lyricContainer.scrollTo({
                              top: Math.max(
                                  0,
                                  lyricRefs[lyricIndex + 1]?.offsetTop || 0 - 10
                              ),
                              behavior: 'smooth'
                          });
                      }

                      return i;
                  }
              }

              return 0;
          })()
        : 0;

    function scroll() {
        lastScroll = new Date().getTime();
    }

    const lyricPopup: PopupSettings = {
        event: 'click',
        target: 'lyricPopup',
        placement: 'top-end'
    };
</script>

{#if $audio}
    <div
        data-popup="lyricPopup"
        class="w-72 h-[calc(100vh-4.75rem-3rem)] overflow-y-auto card p-4 variant-filled-primary"
    >
        <div class="" bind:this={lyricContainer} on:scroll={scroll}>
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
                                    lyricRefs[i].scrollIntoView({
                                        behavior: 'smooth'
                                    });
                                }}
                                on:keydown={() => {
                                    $audio.currentTime = lyric.timestamp;
                                    lyricRefs[i].scrollIntoView({
                                        behavior: 'smooth'
                                    });
                                }}
                            >
                                {lyric.content.trim() || '•••'}
                            </span>
                        {/if}
                    {/each}
                    <p class="whitespace-pre-line">{$audio.lyrics.credits}</p>
                {:else}
                    <p class="text-xs">{$_('no_lyrics_found')}</p>
                {/if}
            </div>
        </div>
    </div>

    <button class="btn btn-sm variant-soft w-6 h-6 p-0" use:popup={lyricPopup}>
        <TextSelect />
    </button>
{/if}
