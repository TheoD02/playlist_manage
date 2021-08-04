const fs = require('fs');
const fetchUrl = require("fetch").fetchUrl;
const mm = require('music-metadata');
const recursive = require("recursive-readdir");

const apiHeaders = {
    'Content-Type': 'application/json',
};


const playlistsId = [
    1071669561,
];

const folderToSearch = 'C:\\Users\\user\\Music\\deemix Music';
const localTracksMetadaLocation = 'localTracks_metadata.json';
const forceAnalyseLocalTracks = false;

(async () => {
    if (!fs.existsSync(localTracksMetadaLocation) || forceAnalyseLocalTracks) {
        recursive(folderToSearch, async (err, files) => {
            const localTracksInfo = [];
            for (const f of files) {
                const id3tag = await mm.parseFile(f);
                console.log(id3tag);
                localTracksInfo.push({
                    title: id3tag.title,
                    artist: '',
                    trackId: 0,
                    path: {
                        relative: '',
                        absolute: ''
                    }
                });

                fs.writeFileSync(localTracksMetadaLocation, JSON.stringify(localTracksInfo));
            };
        })
    }

    /* const tracksMetadata = JSON.parse(fs.readFileSync(forceAnalyseLocalTracks));
    playlistsId.forEach(async (pId) => {
        fetchUrl(`https://api.deezer.com/playlist/${pId}`, apiHeaders, (error, meta, body) => {
            if (error) throw 'Error when getting api response';
            const apiRes = JSON.parse(body);

            apiRes.tracks.forEach(dTrack => {
                const trackId = dTrack.id;
                tracksMetadata.filter(lTrack => lTrack.trackId === trackId);
            })
        })
    }); */
})();

