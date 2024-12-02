/**
 * Context menus
 */

// import { showMenu } from 'tauri-plugin-context-menu';
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

const MENU_SEPERATOR = {
    is_separator: true
};

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

    await showMenu({
        pos: { x: e?.clientX || 0, y: e?.clientY || 0 },
        items: [
            {
                label: 'Play',
                event: async () => {
                    const friendly = (await db.friendlyPlaylist(
                        playlist
                    )) as FriendlyPlaylist;

                    await playTrack(friendly.tracks[0], friendly.tracks);
                }
            },
            {
                label: 'Shuffle',
                event: () => {}
            },
            MENU_SEPERATOR,
            {
                label: 'Delete',
                event: () => {}
            }
        ]
    });
}
export async function openTrackMenu(
    e: MouseEvent | undefined,
    track: FriendlyTrack,
    modalStore: ReturnType<typeof getModalStore>,
    toastStore: ReturnType<typeof getToastStore>
) {
    e?.preventDefault();

    await showMenu({
        pos: { x: e?.clientX || 0, y: e?.clientY || 0 },
        items: [
            {
                label: 'Add to Playlist',
                subitems: [
                    {
                        label: get(_)('create_playlist'),
                        event: () => {
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
                    MENU_SEPERATOR,
                    ...get(playlists).map((playlist) => ({
                        label: playlist.name,
                        event: () => {
                            add(playlist, [track], modalStore, toastStore);
                        }
                    }))
                ]
            },
            MENU_SEPERATOR,
            {
                label: 'Play Next',
                disabled: false,
                event: () => {
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
                label: 'Play Later',
                disabled: false,
                event: () => {
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
            MENU_SEPERATOR,
            {
                label: `Go to Album`,
                event: () => {
                    goto(
                        `/library/album?id=${encodeURIComponent(track.albumId)}`
                    );
                }
            },
            {
                label: `Go to Artist`,
                event: () => {
                    goto(
                        `/library/artist?id=${encodeURIComponent(
                            track.artistId
                        )}`
                    );
                }
            },
            MENU_SEPERATOR,
            {
                label: `Open in ${
                    (await platform()) === 'darwin' ? 'Finder' : 'File Explorer'
                }`,
                disabled: false,
                event: async () => {
                    await invoke('show_in_folder', {
                        path: await join(track.location)
                    });
                }
            },
            {
                label: `Properties`,
                disabled: false,
                event: async () => {
                    const propertiesModal: ModalSettings = {
                        type: 'alert',
                        title: 'Properties',
                        body: `
                        <div class="overflow-y-auto text-sm">
                            <p>Title: ${track.title} (${track.id})<br>
                            Artist: ${track.artist.name} (${track.artistId})<br>
                            Album: ${track.album.name} (${track.albumId})<br>
                            Location: ${track.location}<br>
                            Album Art: ${track.album.albumArt}<br>
                            Animated Album Art: ${
                                track.album.animatedAlbumArt
                            }<br>
                            Played At: ${track.lastPlayedAt}<br>
                            Created At: ${track.createdAt}<br>
                            Duration: ${getTimestamp(track.duration)} (${
                            track.duration
                        })<br>
                            Track Number: ${track.trackNum}<br>
                            Total Tracks: ${track.totalTracks}<br>
                            Disc Number: ${track.discNum}<br>
                            Total Discs: ${track.totalDiscs}<br>
                            Genres: ${track.genres.join(', ')}
                            </p>
                        </div>
                            `
                    };

                    modalStore.trigger(propertiesModal);
                }
            }
        ]
    });
}
