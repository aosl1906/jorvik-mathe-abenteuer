Eigene Puzzle-Bilder für Jorvik Mathe-Abenteuer
=================================================

Lege deine eigenen Screenshots (z. B. aus Star Stable Online als .png, .jpg oder .webp)
einfach in diesen Ordner `assets/puzzles/` und trage die Dateinamen in `customPuzzles.js` ein:

Beispiel in `customPuzzles.js`:
window.CUSTOM_PUZZLE_FILES = [
  { file: 'mein_starhorse.png', title: 'Mein Sternenpferd in Moorland' },
  { file: 'springturnier.jpg', title: 'Springturnier im Sonnenuntergang' }
];

Solange diese Liste leer ist (Standard), erzeugt die App automatisch 5 hochauflösende
Jorvik-Fantasy-Artworks, sodass du sofort losspielen kannst!
