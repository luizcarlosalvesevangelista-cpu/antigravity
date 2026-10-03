cd "$(dirname "$0")"; mkdir -p final
declare -A POS=( [film]=99 [erp]=8 [tv]=9 [logo]=5.5 )
declare -A NAME=( [film]=filme [erp]=erp [tv]=tv [logo]=logo )
for pc in film erp tv logo; do for f in h v; do
  n=${NAME[$pc]}
  ffmpeg -loglevel error -y -i out/$pc-$f.video.mp4 -i out/$pc.wav -map 0:v -map 1:a -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart final/$n-$f.mp4
  ffmpeg -loglevel error -y -ss ${POS[$pc]} -i final/$n-$f.mp4 -frames:v 1 -vf "scale='if(gt(iw,ih),1280,720)':-2" -q:v 4 final/$n-$f.jpg
done; done; ls -la final
