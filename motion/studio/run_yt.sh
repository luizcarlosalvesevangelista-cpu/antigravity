#!/bin/bash
# Renderiza as 11 histórias do YouTube (Playwright + ffmpeg + audio.py). Antes: node build.js
cd "$(dirname "$0")"; mkdir -p out
node render_yt.js 0 1 2 > out/yt-log1.txt 2>&1 &
node render_yt.js 3 4 5 > out/yt-log2.txt 2>&1 &
node render_yt.js 6 7 8 > out/yt-log3.txt 2>&1 &
node render_yt.js 9 10 > out/yt-log4.txt 2>&1 &
wait
D=../../site/portal/kits/upe-branding/youtube
IDS=(yt-01-filme-upe yt-02-upe-erp yt-03-upe-tv yt-04-branding-x-logo yt-05-tutorial-erp-1 yt-06-rebranding-5-sinais yt-07-tutorial-erp-black-friday yt-08-upe-tv-na-pratica yt-09-manual-de-marca yt-10-tutorial-erp-pdv yt-11-retrospectiva)
for n in $(seq 0 10); do python3 audio.py out/yt$n.cues.json out/yt$n.wav && ffmpeg -loglevel error -y -i out/yt$n.video.mp4 -i out/yt$n.wav -map 0:v -map 1:a -c:v copy -af loudnorm=I=-14:TP=-1.5 -ar 48000 -c:a aac -b:a 160k -shortest -movflags +faststart $D/historia-${IDS[$n]}.mp4; done
echo ALLDONE
