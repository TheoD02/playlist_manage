const fetchUrl = require('fetch').fetchUrl;
const fs = require('fs');



(async () => {
    const tasks = [];
    const apiHeaders = {
        'Content-Type': 'application/json',
    };
    const playlistsId = [1071669561, 1684051791, 3830830902, 1676772471, 5751158462, 2677972784, 1701025601, 3272614282, 1351827495, 855887461, 4676814864, 5175061384, 1182010551];
    const excludedPlaylistName = ['Spleen', 'Sex, rap & rnb', 'Soirée Afro', 'Coups de coeur', 'Les Hits Afro', 'Essentiels RNB', 'Chicha Lounge'];
    let artistsId = [];
    for await (const pId of playlistsId) {
        tasks.push(new Promise((res, rej) => {
            fetchUrl(`https://api.deezer.com/playlist/${pId}`, apiHeaders, (error, meta, body) => {
                if (error) throw 'Error when getting api response';
                const apiRes = JSON.parse(body);
                const tracks = apiRes.tracks.data;

                for (const track of tracks) {
                    if (!artistsId.find(aId => aId === track.artist.id)) {
                        artistsId.push(track.artist.id);
                    }
                }
                res();
            });
        }))
    }
    await Promise.all(tasks);
    artistsId.sort((a, b) => a - b)
    console.log(artistsId.length);
    fs.writeFileSync('artistsIdList.txt', artistsId.join('\r\n'));
})()
