const express = require('express');
const ytdl = require('ytdl-core');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const app = express();

app.use(express.static('public'));

app.get('/download', async (req, res, next) => {
    const url = req.query.url;
    const format = req.query.format;
    console.log(url,format)
    try {
      const videoInfo = await ytdl.getInfo(url);
      const title = videoInfo.videoDetails.title.replace(/[^\w\s]/gi, '');
      const fileName = `${title}.${format === 'mp3' ? 'mp3' : 'mp4'}`;
      res.header('Content-Disposition', `attachment; filename="${fileName}"`);
      if (format === 'mp3') {
        const audio = ytdl.downloadFromInfo(videoInfo, { quality: 'highestaudio' });
        ffmpeg(audio)
          .setFfmpegPath(ffmpegPath)
          .audioCodec('libmp3lame')
          .format('mp3')
          .pipe(res)
          .on('finish', () => {
            res.end(`<h1>${title}</h1>`);
          });
      } else {
          res.header('Content-Disposition', `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4"`);
          const videoInfo2 = await ytdl.getInfo(url);
          ytdl.downloadFromInfo(videoInfo2, { format: 'mp4', quality: 'highest', filter: 'videoandaudio' }).pipe(res)
      }
    } catch(e) {
        return res.status(400).send('Invalid YouTube URL. Full error: ' + e);
    }
});
app.get('/title', async (req, res) => {
    const url = req.query.url;
    try {
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title;
      const youtuber = info.videoDetails.author.name;
      return res.status(200).send(`${title}`);
    } catch(e) {
      return res.status(400).send('Invalid YouTube URL. Full error: ' + e);
    }
  });
  app.get('/', async (req, res) => {
        res.sendFile(path.join(__dirname, 'public/index.html'))
  });
  app.get('/favicon', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public/logo.webp'))
});
app.get('/font', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public/font.ttf'))
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong');
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

