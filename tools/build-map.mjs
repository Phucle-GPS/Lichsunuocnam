import fs from 'fs';
import * as topo from 'topojson-client';
import { geoMercator, geoPath, geoBounds } from 'd3-geo';
const w = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-10m.json'));
const fc = topo.feature(w, w.objects.countries);
const W=1920,H=1080;
// extent: lon 92..128, lat 4..30
const proj = geoMercator().fitExtent([[0,0],[W,H]], {type:'Feature',geometry:{type:'Polygon',coordinates:[[[94,5],[94,29],[126,29],[126,5],[94,5]]]}});
proj.clipExtent([[-60,-60],[W+60,H+60]]);
const path = geoPath(proj).digits(1);
const out=[];
for (const f of fc.features){
  const b = geoBounds(f);
  if (/Spratly|Scarborough|Paracel|Maldives|Palau|Nepal|Bhutan|Japan/.test(f.properties.name)) continue;
  if (b[1][0] < 85 || b[0][0] > 135 || b[1][1] < -2 || b[0][1] > 40) continue;
  // keep only parts within broad window: clip via projection extent
  const d = path(f); if(!d) continue;
  out.push({n:f.properties.name, d});
}
const p = {scale: proj.scale(), tx: proj.translate()[0], ty: proj.translate()[1]};
fs.writeFileSync('map-data.js', '/* Dữ liệu bản đồ: Natural Earth (public domain) qua world-atlas, chiếu Mercator 1920x1080 */\nwindow.MAP_DATA='+JSON.stringify({W,H,proj:p,countries:out})+';\n');
console.log(out.map(o=>o.n+':'+o.d.length).join(' '), p);
