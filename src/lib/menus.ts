/**
 * Context menus
 */

import { Menu, Submenu } from '@tauri-apps/api/menu';
import { join } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';
import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';
import {
    type ModalSettings,
    type getToastStore,
    type getModalStore
} from '@skeletonlabs/skeleton';
import { platform } from '@tauri-apps/plugin-os';
import type { FriendlyPlaylist, FriendlyTrack, Playlist } from './db';
import { playlists, queue } from './stores';
import db from './db';
import { getTimestamp } from './utils';
import { playTrack } from './player';
import { goto } from '$app/navigation';

async function _add(
    playlist: Playlist,
    tracks: FriendlyTrack[],
    toastStore: ReturnType<typeof getToastStore>
) {
    await db.playlists.update(playlist.id, {
        trackIds: [...playlist.trackIds, ...tracks.map((t) => t.id)]
    });

    toastStore.trigger({
        // message: `Added to ${playlist.name}`,
        message: get(_)('added_to', { values: { name: playlist.name } }),
        background: 'variant-filled-success'
    });
}

async function add(
    playlist: Playlist,
    tracks: FriendlyTrack[],
    modalStore: ReturnType<typeof getModalStore>,
    toastStore: ReturnType<typeof getToastStore>
) {
    // Check for duplicates
    if (!playlist.trackIds.includes(tracks[0].id)) {
        return _add(playlist, tracks, toastStore);
    }

    const duplicateModal: ModalSettings = {
        type: 'confirm',
        title: `⚠️ ${get(_)('song_already_in_playlist')}`,
        body: get(_)('song_already_in_playlist_confirmation', {
            values: {
                name: playlist.name
            }
        }),
        response: (r: boolean) => {
            if (r) {
                _add(playlist, tracks, toastStore);
            }
        }
    };

    modalStore.trigger(duplicateModal);
}

export async function openPlaylistMenu(
    e: MouseEvent | undefined,
    playlist: Playlist
) {
    e?.preventDefault();

    const menu = await Menu.new({
        items: [
            {
                text: 'Play',
                action: async () => {
                    const friendly = (await db.friendlyPlaylist(
                        playlist
                    )) as FriendlyPlaylist;

                    await playTrack(friendly.tracks[0], friendly.tracks);
                }
            },
            {
                text: 'Shuffle',
                action: () => {} // TODO
            },
            { item: 'Separator' },
            {
                text: 'Delete',
                action: () => {} // TODO
            }
        ]
    });

    menu.popup();
}

export async function openTrackMenu(
    e: MouseEvent | undefined,
    track: FriendlyTrack,
    modalStore: ReturnType<typeof getModalStore>,
    toastStore: ReturnType<typeof getToastStore>
) {
    e?.preventDefault();

    const menu = await Menu.new({
        items: [
            {
                text: get(_)('play_now'),
                action: () => playTrack(track, [track])
            },
            { item: 'Separator' },
            await Submenu.new({
                text: get(_)('add_to_playlist'),
                items: [
                    {
                        text: get(_)('create_playlist'),
                        action: () => {
                            const createPlaylistModal: ModalSettings = {
                                type: 'prompt',
                                title: get(_)('create_playlist'),
                                body: get(_)('enter_playlist_name'),
                                value: '',
                                valueAttr: {
                                    type: 'text',
                                    minlength: 1,
                                    maxlength: 16,
                                    required: true
                                },
                                response: async (r: string) => {
                                    if (!r) return;
                                    await db.playlists.add({
                                        id: crypto.randomUUID(),
                                        name: r,
                                        trackIds: [],
                                        createdAt: new Date(),
                                        updatedAt: new Date()
                                    });
                                    toastStore.trigger({
                                        message: get(_)('created_playlist'),
                                        background: 'variant-filled-success'
                                    });
                                }
                            };

                            modalStore.trigger(createPlaylistModal);
                        }
                    },
                    { item: 'Separator' },
                    ...get(playlists).map((playlist) => ({
                        text: playlist.name,
                        action: () => {
                            add(playlist, [track], modalStore, toastStore);
                        }
                    }))
                ]
            }),

            { item: 'Separator' },
            {
                text: get(_)('play_next'),
                action: () => {
                    queue.update((q) => {
                        q.tracks.splice(q.index + 1, 0, track);
                        return q;
                    });

                    toastStore.trigger({
                        message: get(_)('added_to_queue'),
                        background: 'variant-filled-success'
                    });
                }
            },
            {
                text: get(_)('play_later'),
                action: () => {
                    queue.update((q) => {
                        q.tracks.push(track);
                        return q;
                    });

                    toastStore.trigger({
                        message: get(_)('added_to_queue'),
                        background: 'variant-filled-success'
                    });
                }
            },
            { item: 'Separator' },
            {
                text: get(_)('go_to_foo', { values: { foo: get(_)('album') } }),
                action: () => {
                    goto(
                        `/library/album?id=${encodeURIComponent(track.albumId)}`
                    );
                }
            },
            {
                text: get(_)('go_to_foo', {
                    values: { foo: get(_)('artist') }
                }),
                action: () => {
                    goto(
                        `/library/artist?id=${encodeURIComponent(
                            track.artistId
                        )}`
                    );
                }
            },
            { item: 'Separator' },

            {
                text: get(_)('open_in_foo', {
                    values: {
                        foo:
                            (await platform()) === 'macos'
                                ? 'Finder'
                                : 'File Explorer'
                    }
                }),
                action: async () => {
                    await invoke('show_in_folder', {
                        path: await join(track.location)
                    });
                }
            },
            {
                text: get(_)('properties'),
                action: async () => {
                    const propertiesModal: ModalSettings = {
                        type: 'alert',
                        title: get(_)('properties'),
                        body: `
                    <div class="overflow-auto text-sm">
                        <p>${get(_)('title')}: ${track.title} (${track.id})<br>
                        ${get(_)('artist')}: ${track.artist.name} (${
                            track.artistId
                        })<br>
                        ${get(_)('album')}: ${track.album.name} (${
                            track.albumId
                        })<br>
                        ${get(_)('location')}: ${track.location}<br>
                        ${get(_)('album_art')}: ${track.album.albumArt}<br>
                        ${get(_)('animated_album_art')}: ${
                            track.album.animatedAlbumArt
                        }<br>
                        ${get(_)('last_played_at')}: ${track.lastPlayedAt}<br>
                        ${get(_)('created_at')}: ${track.createdAt}<br>
                        ${get(_)('duration')}: ${getTimestamp(
                            track.duration
                        )} (${track.duration})<br>
                        Track Number: ${track.trackNum}<br>
                        Total Tracks: ${track.totalTracks}<br>
                        Disc Number: ${track.discNum}<br>
                        Total Discs: ${track.totalDiscs}<br>
                        ${get(_)('genres')}: ${track.genres.join(', ')}
                        </p>
                    </div>
                        `
                    };

                    modalStore.trigger(propertiesModal);
                }
            }
        ]
    });

    menu.popup();
}
