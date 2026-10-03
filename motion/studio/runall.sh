export NODE_PATH=/opt/node22/lib/node_modules
cd "$(dirname "$0")"
(node render.js film h; node render.js logo h; node render.js logo v) > out/log1.txt 2>&1 &
(node render.js film v) > out/log2.txt 2>&1 &
(node render.js erp h; node render.js erp v) > out/log3.txt 2>&1 &
(node render.js tv h; node render.js tv v) > out/log4.txt 2>&1 &
wait; echo ALLDONE
