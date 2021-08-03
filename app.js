const fs = require('fs');
const fetchUrl = require('fetch').fetchUrl;
const mm = require('music-metadata');
const recursive = require('recursive-readdir');
const m3uWriter = require('m3u').extendedWriter();
const humanizeDuration = require('humanize-duration');

const apiHeaders = {
	'Content-Type': 'application/json',
};

const playlistsId = [3272614282, 1290316405, 932386265, 53362031, 848507881];

const folderToSearch = 'C:\\Users\\Theo\\Music\\deemix';
const localTracksMetadaLocation = 'localTracks_metadata.json';
const forceAnalyseLocalTracks = false;

(async () => {
	if (!fs.existsSync(localTracksMetadaLocation) || forceAnalyseLocalTracks) {
		recursive(folderToSearch, ['*.lrc', '*.jpg', '*.png'], async (err, files) => {
			const localTracksInfo = [];
			for (const f of files) {
				const id3tag = await mm.parseFile(f);
				localTracksInfo.push({
					title: id3tag.common.title,
					artist: id3tag.common.artists.join(', '),
					trackId: id3tag.native['ID3v2.3'].find((f) => f.id === 'TXXX:SOURCEID').value,
					barcode: id3tag.common.barcode,
					isrc: id3tag.common.isrc,
					path: f,
				});

				fs.writeFileSync(localTracksMetadaLocation, JSON.stringify(localTracksInfo));
			}
		});
	}

	const tracksMetadata = JSON.parse(fs.readFileSync(localTracksMetadaLocation));
	playlistsId.forEach((pId) => {
		fetchUrl(`https://api.deezer.com/playlist/${pId}`, apiHeaders, (error, meta, body) => {
			if (error) throw 'Error when getting api response';
			const apiRes = JSON.parse(body);
			const totalTracksInPlaylist = apiRes.nb_tracks;
			const playlistTracks = apiRes.tracks.data;
			let totalFindTracks = 0;
			m3uWriter.comment(`Title : ${apiRes.title}`);
			m3uWriter.comment(`Description : ${apiRes.description}`);
			m3uWriter.comment(`Total duration : ${humanizeDuration(apiRes.duration * 1000, { language: 'fr' })}`);
			m3uWriter.comment(`Total tracks : ${apiRes.nb_tracks}`);
			m3uWriter.comment(`Playlist link : ${apiRes.link}`);
			m3uWriter.comment(`Created by : ${apiRes.creator.name} (${apiRes.creator.id})`);
			playlistTracks.forEach((dzTrack) => {
				const trackId = dzTrack.id;
				const matchedTrack = tracksMetadata.find((lTrack) => lTrack.trackId == trackId);
				if (matchedTrack) {
					totalFindTracks++;
					m3uWriter.file(matchedTrack.path, dzTrack.duration, `${dzTrack.artist.name} - ${dzTrack.title}`);
				} else {
					fetchUrl(`https://api.deezer.com/track/${trackId}`, apiHeaders, (error, meta, body) => {
						const res = JSON.parse(body);
						if (res) {
							const matchedTrack = tracksMetadata.find((lTrack) => lTrack.isrc == res.isrc);
							if (matchedTrack) {
								totalFindTracks++;
								m3uWriter.file(matchedTrack.path, dzTrack.duration, `${dzTrack.artist.name} - ${dzTrack.title}`);
							}
						}
					});
				}
			});
			console.log(`Find ${totalFindTracks} of ${totalTracksInPlaylist}`);
			const m3uData = m3uWriter.toString();
			fs.writeFileSync(`${apiRes.title} (${humanizeDuration(apiRes.duration * 1000, { language: 'fr' })}).m3u`, m3uData);
		});
	});
})();
