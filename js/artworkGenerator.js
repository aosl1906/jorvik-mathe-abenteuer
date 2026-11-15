/**
 * Generiert hochauflösende Jorvik-Fantasy-Artworks (SVG Data-URIs)
 * und lädt bei Bedarf eigene Bilder aus assets/puzzles/.
 */
window.ArtworkGenerator = (function () {
  'use strict';

  function svgToDataUrl(svg) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
  }

  const GENERATED_ARTWORKS = [
    {
      id: 'jorvik_starhorse',
      title: 'Das Sternenpferd im Wald von Jorvik',
      subtitle: 'Hollow Woods • Magische Lichtung',
      src: svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
          <defs>
            <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#111d35"/>
              <stop offset="55%" stop-color="#23484c"/>
              <stop offset="100%" stop-color="#4e7958"/>
            </linearGradient>
            <radialGradient id="moonGlow" cx="72%" cy="22%" r="35%">
              <stop offset="0%" stop-color="#fff4c8" stop-opacity="0.95"/>
              <stop offset="40%" stop-color="#ffd57a" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="#ffd57a" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="magicAura" cx="50%" cy="62%" r="32%">
              <stop offset="0%" stop-color="#7ef9ff" stop-opacity="0.55"/>
              <stop offset="60%" stop-color="#9e7bff" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="#9e7bff" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="900" height="600" fill="url(#sky1)"/>
          <rect width="900" height="600" fill="url(#moonGlow)"/>
          <circle cx="650" cy="130" r="46" fill="#fff7d6"/>
          <circle cx="664" cy="120" r="40" fill="#182a40" opacity="0.22"/>

          <!-- Sterne -->
          <g fill="#fff8d9" opacity="0.85">
            <circle cx="120" cy="70" r="2"/><circle cx="210" cy="110" r="1.5"/>
            <circle cx="330" cy="55" r="2.5"/><circle cx="480" cy="95" r="1.8"/>
            <circle cx="540" cy="45" r="2.2"/><circle cx="790" cy="80" r="2"/>
            <circle cx="830" cy="160" r="1.6"/><circle cx="95" cy="175" r="1.8"/>
          </g>

          <!-- Ferne Berge & Wald -->
          <path d="M0 390 L140 310 L290 365 L470 290 L660 355 L900 300 L900 600 L0 600 Z" fill="#1c3834"/>
          <path d="M0 430 Q220 390 450 425 T900 410 L900 600 L0 600 Z" fill="#132924"/>

          <!-- Bäume links und rechts -->
          <g fill="#0e201c">
            <polygon points="40,460 95,180 150,460"/>
            <polygon points="110,480 175,220 240,480"/>
            <polygon points="690,470 760,190 830,470"/>
            <polygon points="780,490 845,230 910,490"/>
          </g>

          <!-- Lichtung & Magische Aura -->
          <ellipse cx="450" cy="485" rx="340" ry="65" fill="#1e3d32"/>
          <rect width="900" height="600" fill="url(#magicAura)"/>

          <!-- Magisches Sternenpferd (Silhouette + leuchtende Mähne) -->
          <g transform="translate(310, 225)">
            <!-- Schweif -->
            <path d="M90 145 Q35 155 25 210 Q55 190 78 215 Q92 175 105 160 Z" fill="#7ef9ff" opacity="0.85"/>
            <!-- Körper -->
            <path d="M95 140 Q145 115 210 128 Q235 80 255 52 Q272 35 288 42 Q284 58 298 66 Q292 78 272 78 Q258 108 242 152 Q245 195 258 238 L240 242 Q225 200 218 168 Q170 178 135 168 L118 240 L100 238 L112 162 Q92 155 95 140 Z" fill="#f7efe0"/>
            <!-- Hinterbein 2 & Vorderbein 2 -->
            <path d="M135 165 L148 238 L164 238 L152 166 Z" fill="#dcd2c2"/>
            <path d="M225 155 L268 215 L280 206 L242 148 Z" fill="#dcd2c2"/>
            <!-- Mähne -->
            <path d="M250 56 Q220 68 210 105 Q228 95 235 118 Q245 90 258 75 Z" fill="#7ef9ff" opacity="0.9"/>
            <!-- Stern auf der Stirn -->
            <circle cx="274" cy="54" r="3.5" fill="#ffd966"/>
          </g>

          <!-- Schwebende Kristalle -->
          <g fill="#8af7ff" opacity="0.85">
            <polygon points="270,330 282,305 294,330 282,355"/>
            <polygon points="620,310 630,288 640,310 630,332"/>
            <polygon points="455,215 463,198 471,215 463,232" fill="#ffd966"/>
          </g>
        </svg>
      `)
    },
    {
      id: 'sunset_showjumping',
      title: 'Springparcours bei Sonnenuntergang',
      subtitle: 'Jorvik-Ställe • Goldene Stunde',
      src: svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
          <defs>
            <linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#3c2254"/>
              <stop offset="45%" stop-color="#b84a62"/>
              <stop offset="80%" stop-color="#f59e42"/>
              <stop offset="100%" stop-color="#ffe082"/>
            </linearGradient>
          </defs>
          <rect width="900" height="600" fill="url(#sunset)"/>
          <circle cx="450" cy="340" r="95" fill="#fff2b2" opacity="0.85"/>
          <!-- Hügel & Koppel -->
          <path d="M0 390 Q240 345 480 385 T900 370 L900 600 L0 600 Z" fill="#4f372d"/>
          <path d="M0 440 Q300 415 600 445 T900 430 L900 600 L0 600 Z" fill="#2d4a2b"/>
          <!-- Holzzaun -->
          <g stroke="#d9b282" stroke-width="6">
            <line x1="0" y1="455" x2="900" y2="455"/>
            <line x1="0" y1="485" x2="900" y2="485"/>
            <line x1="80" y1="435" x2="80" y2="515"/><line x1="220" y1="435" x2="220" y2="515"/>
            <line x1="680" y1="435" x2="680" y2="515"/><line x1="820" y1="435" x2="820" y2="515"/>
          </g>
          <!-- Hindernis in der Mitte -->
          <g transform="translate(380, 405)">
            <rect x="0" y="20" width="12" height="90" fill="#fff7e6"/>
            <rect x="135" y="20" width="12" height="90" fill="#fff7e6"/>
            <rect x="6" y="42" width="135" height="10" rx="4" fill="#d94e4e"/>
            <rect x="6" y="66" width="135" height="10" rx="4" fill="#f7f1e1"/>
            <rect x="6" y="90" width="135" height="10" rx="4" fill="#e6a130"/>
          </g>
          <!-- Springendes Pferd + Reiterin -->
          <g transform="translate(335, 225) rotate(-14 120 120)">
            <path d="M40 125 Q95 100 155 112 Q180 70 202 52 Q218 42 230 50 Q224 68 206 72 Q192 98 175 130 Q195 155 215 170 L202 180 Q175 162 155 138 Q110 148 72 138 L45 182 L30 172 L55 130 Z" fill="#2b1915"/>
            <!-- Reiterin -->
            <path d="M105 112 L118 65 L138 68 L132 114 Z" fill="#1e3c4c"/>
            <circle cx="130" cy="50" r="13" fill="#2b1915"/>
            <path d="M118 46 Q132 30 145 48 Z" fill="#e6b84c"/>
          </g>
        </svg>
      `)
    },
    {
      id: 'crystal_portal',
      title: 'Das Kristall-Portal von Pandoria',
      subtitle: 'Geheimer Steinkreis • Runenmagie',
      src: svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
          <defs>
            <linearGradient id="bg3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#191030"/>
              <stop offset="60%" stop-color="#2f1c54"/>
              <stop offset="100%" stop-color="#152b38"/>
            </linearGradient>
            <radialGradient id="portalGlow" cx="50%" cy="48%" r="36%">
              <stop offset="0%" stop-color="#ff9ef5" stop-opacity="0.95"/>
              <stop offset="45%" stop-color="#9e5cff" stop-opacity="0.55"/>
              <stop offset="100%" stop-color="#48c6ef" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="900" height="600" fill="url(#bg3)"/>
          <rect width="900" height="600" fill="url(#portalGlow)"/>
          <!-- Boden -->
          <path d="M0 440 Q450 400 900 440 L900 600 L0 600 Z" fill="#141e2e"/>
          <!-- Runen-Steinkreis -->
          <g fill="#3a3356" stroke="#7d6aa8" stroke-width="2">
            <path d="M230 460 L250 240 L295 215 L315 460 Z"/>
            <path d="M585 460 L605 215 L650 240 L670 460 Z"/>
            <path d="M280 230 Q450 130 620 230 L600 265 Q450 180 300 265 Z"/>
          </g>
          <!-- Leuchtendes Portal -->
          <ellipse cx="450" cy="340" rx="115" ry="155" fill="#e980fc" opacity="0.35"/>
          <ellipse cx="450" cy="340" rx="85" ry="125" fill="#80ffea" opacity="0.45"/>
          <ellipse cx="450" cy="340" rx="52" ry="88" fill="#ffffff" opacity="0.65"/>
          <!-- Große Kristalle -->
          <g>
            <polygon points="150,510 180,380 215,510" fill="#5ce1e6" opacity="0.85"/>
            <polygon points="695,515 735,365 775,515" fill="#d96bff" opacity="0.85"/>
            <polygon points="110,530 135,445 160,530" fill="#a29bfe" opacity="0.8"/>
          </g>
        </svg>
      `)
    },
    {
      id: 'moorland_stable',
      title: 'Moorland-Reitstall am Morgen',
      subtitle: 'Heimatstall • Warme Sonnenstrahlen',
      src: svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
          <defs>
            <linearGradient id="morn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#5ca4c4"/>
              <stop offset="60%" stop-color="#a8d5ba"/>
              <stop offset="100%" stop-color="#f7e3a1"/>
            </linearGradient>
          </defs>
          <rect width="900" height="600" fill="url(#morn)"/>
          <circle cx="170" cy="140" r="55" fill="#fff7cc" opacity="0.9"/>
          <!-- Wiesen -->
          <path d="M0 370 Q300 330 600 370 T900 350 L900 600 L0 600 Z" fill="#639a48"/>
          <path d="M0 440 Q450 410 900 450 L900 600 L0 600 Z" fill="#467834"/>
          <!-- Stallgebäude -->
          <g transform="translate(260, 210)">
            <rect x="40" y="90" width="320" height="170" fill="#b84a39" rx="4"/>
            <polygon points="15,95 200,10 385,95" fill="#4f3227"/>
            <rect x="160" y="145" width="80" height="115" fill="#5e3a28"/>
            <rect x="75" y="135" width="50" height="50" fill="#ffe799" stroke="#fff" stroke-width="4"/>
            <rect x="275" y="135" width="50" height="50" fill="#ffe799" stroke="#fff" stroke-width="4"/>
            <!-- Goldener Wetterhahn / Stern -->
            <circle cx="200" cy="52" r="14" fill="#ffd447"/>
          </g>
          <!-- Zwei Pferde auf der Weide -->
          <g fill="#5c3621" transform="translate(110, 415)">
            <ellipse cx="55" cy="35" rx="40" ry="22"/>
            <rect x="25" y="45" width="10" height="45"/><rect x="75" y="45" width="10" height="45"/>
            <path d="M85 28 L108 5 L120 12 L102 38 Z"/>
          </g>
          <g fill="#f5eadc" transform="translate(650, 425)">
            <ellipse cx="55" cy="35" rx="38" ry="20"/>
            <rect x="25" y="45" width="10" height="42"/><rect x="75" y="45" width="10" height="42"/>
            <path d="M22 28 L0 8 L12 2 L32 30 Z"/>
          </g>
        </svg>
      `)
    },
    {
      id: 'whispering_waterfall',
      title: 'Der Flüsternde Wasserfall',
      subtitle: 'Valedale • Glitzernde Quellen',
      src: svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
          <defs>
            <linearGradient id="val" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#19424d"/>
              <stop offset="55%" stop-color="#2e726b"/>
              <stop offset="100%" stop-color="#60b090"/>
            </linearGradient>
            <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#d2f8ff"/>
              <stop offset="100%" stop-color="#4cc9f0"/>
            </linearGradient>
          </defs>
          <rect width="900" height="600" fill="url(#val)"/>
          <!-- Felsen -->
          <path d="M0 160 L260 190 L330 430 L0 460 Z" fill="#2d3b42"/>
          <path d="M560 180 L900 150 L900 470 L530 430 Z" fill="#253238"/>
          <!-- Wasserfall -->
          <rect x="330" y="120" width="210" height="340" fill="url(#water)" opacity="0.88"/>
          <g stroke="#ffffff" stroke-width="4" opacity="0.65">
            <line x1="365" y1="140" x2="365" y2="430"/>
            <line x1="425" y1="130" x2="425" y2="440"/>
            <line x1="490" y1="150" x2="490" y2="420"/>
          </g>
          <!-- See -->
          <ellipse cx="450" cy="515" rx="460" ry="105" fill="#2a8fa8"/>
          <ellipse cx="435" cy="465" rx="145" ry="26" fill="#d9fbff" opacity="0.55"/>
          <!-- Glühwürmchen -->
          <g fill="#ffe875">
            <circle cx="210" cy="310" r="4"/><circle cx="250" cy="260" r="3"/>
            <circle cx="670" cy="290" r="4.5"/><circle cx="720" cy="340" r="3.5"/>
            <circle cx="445" cy="240" r="3.5"/>
          </g>
        </svg>
      `)
    }
  ];

  function getArtworks() {
    const custom = Array.isArray(window.CUSTOM_PUZZLE_FILES)
      ? window.CUSTOM_PUZZLE_FILES.map((item, idx) => ({
          id: 'custom_' + idx + '_' + item.file,
          title: item.title || ('Mein Jorvik-Bild ' + (idx + 1)),
          subtitle: 'Eigenes Bild aus assets/puzzles/',
          src: 'assets/puzzles/' + item.file
        }))
      : [];

    // Eigene Bilder aus assets/puzzles/ zuerst, danach generierte Artworks
    return [...custom, ...GENERATED_ARTWORKS];
  }

  return {
    getArtworks
  };
})();
