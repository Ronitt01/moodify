/**
 * Starter universe — real, recognizable tracks spanning the emotional map.
 * This is the bootstrap library the engine reasons over before a user connects
 * Spotify (after which their real Liked Songs + playlists join the universe).
 *
 * These are real public song facts (title / artist / genre / year). The
 * emotional vectors are COMPUTED by the local model from this metadata — never
 * hand-faked — so results are genuine vector math, not canned responses.
 *
 * Format: [title, artist, genres(csv, aligned to lexicon), year]
 */
export type SeedRow = [string, string, string, number];

export const SEED_CATALOG: SeedRow[] = [
  // ── calm · late night · lo-fi · ambient ──
  ["Weightless", "Marconi Union", "ambient", 2011],
  ["An Ending (Ascent)", "Brian Eno", "ambient", 1983],
  ["Saturn", "Sleeping at Last", "indie, classical", 2014],
  ["Holocene", "Bon Iver", "indie, folk", 2011],
  ["Intro", "The xx", "dream pop, indie", 2009],
  ["Avril 14th", "Aphex Twin", "ambient, classical", 2001],
  ["Sunset Lover", "Petit Biscuit", "lo-fi, house", 2015],
  ["Comptine d'un autre été", "Yann Tiersen", "classical", 2001],
  ["Night Owl", "Galimatias", "lo-fi, r&b", 2014],
  ["Coffee", "Sylvan Esso", "indie, dream pop", 2014],

  // ── heartbreak · sad · melancholy ──
  ["Skinny Love", "Bon Iver", "folk, indie", 2008],
  ["The Night We Met", "Lord Huron", "indie, folk", 2015],
  ["Liability", "Lorde", "pop, indie", 2017],
  ["Marvin's Room", "Drake", "r&b, hip hop", 2011],
  ["Jocelyn Flores", "XXXTENTACION", "sad, hip hop", 2017],
  ["i love you", "Billie Eilish", "sad, pop", 2019],
  ["Motion Sickness", "Phoebe Bridgers", "indie, sad girl", 2017],
  ["Someone Like You", "Adele", "pop, soul", 2011],
  ["Fix You", "Coldplay", "rock, indie", 2005],
  ["All I Want", "Kodaline", "indie rock", 2013],
  ["Hurt", "Johnny Cash", "country, folk", 2002],
  ["Nothing Compares 2 U", "Sinéad O'Connor", "pop", 1990],
  ["drivers license", "Olivia Rodrigo", "pop, sad", 2021],
  ["when the party's over", "Billie Eilish", "sad, pop", 2018],
  ["A Case of You", "Joni Mitchell", "folk, singer-songwriter", 1971],

  // ── hype · workout · rap · trap · phonk ──
  ["SICKO MODE", "Travis Scott", "hip hop, trap", 2018],
  ["HUMBLE.", "Kendrick Lamar", "hip hop, rap", 2017],
  ["DNA.", "Kendrick Lamar", "hip hop, rap", 2017],
  ["Till I Collapse", "Eminem", "hip hop, rap", 2002],
  ["Lose Yourself", "Eminem", "hip hop, rap", 2002],
  ["POWER", "Kanye West", "hip hop, rap", 2010],
  ["Stronger", "Kanye West", "hip hop, edm", 2007],
  ["goosebumps", "Travis Scott", "trap, hip hop", 2016],
  ["Mo Bamba", "Sheck Wes", "trap, hip hop", 2017],
  ["Murder In My Mind", "Kordhell", "phonk", 2021],
  ["METAMORPHOSIS", "INTERWORLD", "phonk", 2021],
  ["Black Skinhead", "Kanye West", "hip hop, rock", 2013],
  ["Knife Talk", "Drake", "trap, hip hop", 2021],
  ["No Role Modelz", "J. Cole", "hip hop, rap", 2014],

  // ── rock · metal · punk ──
  ["Master of Puppets", "Metallica", "metal", 1986],
  ["Enter Sandman", "Metallica", "metal", 1991],
  ["Chop Suey!", "System of a Down", "metal", 2001],
  ["Mr. Brightside", "The Killers", "rock, indie rock", 2003],
  ["Seven Nation Army", "The White Stripes", "rock", 2003],
  ["Do I Wanna Know?", "Arctic Monkeys", "rock, indie rock", 2013],
  ["R U Mine?", "Arctic Monkeys", "rock", 2012],
  ["Smells Like Teen Spirit", "Nirvana", "rock", 1991],
  ["The Pretender", "Foo Fighters", "rock", 2007],
  ["American Idiot", "Green Day", "pop punk, punk", 2004],
  ["Basket Case", "Green Day", "pop punk", 1994],

  // ── focus · instrumental · post-rock · classical · epic ──
  ["Time", "Hans Zimmer", "soundtrack, orchestral", 2010],
  ["Cornfield Chase", "Hans Zimmer", "soundtrack, orchestral", 2014],
  ["Experience", "Ludovico Einaudi", "classical", 2013],
  ["Nuvole Bianche", "Ludovico Einaudi", "classical", 2004],
  ["Your Hand in Mine", "Explosions in the Sky", "post-rock", 2003],
  ["Strobe", "deadmau5", "house, edm", 2009],
  ["Divenire", "Ludovico Einaudi", "classical", 2006],
  ["Night", "Ludovico Einaudi", "classical", 2015],

  // ── nostalgia · 80s · synthwave · throwback ──
  ["Take On Me", "a-ha", "synth-pop, 80s", 1985],
  ["Africa", "Toto", "rock, 80s", 1982],
  ["Everybody Wants to Rule the World", "Tears for Fears", "synth-pop, 80s", 1985],
  ["Dreams", "Fleetwood Mac", "rock", 1977],
  ["The Chain", "Fleetwood Mac", "rock", 1977],
  ["Blinding Lights", "The Weeknd", "synthwave, synth-pop", 2019],
  ["Midnight City", "M83", "synth-pop, dream pop", 2011],
  ["Nightcall", "Kavinsky", "synthwave", 2010],
  ["Sweet Dreams (Are Made of This)", "Eurythmics", "synth-pop, 80s", 1983],
  ["Don't Stop Believin'", "Journey", "rock, 80s", 1981],
  ["Karma Police", "Radiohead", "rock, indie", 1997],

  // ── romance · r&b · soul ──
  ["Best Part", "Daniel Caesar", "r&b, soul", 2017],
  ["Pink + White", "Frank Ocean", "r&b", 2016],
  ["Self Control", "Frank Ocean", "r&b", 2016],
  ["Adorn", "Miguel", "r&b", 2012],
  ["Often", "The Weeknd", "r&b", 2014],
  ["Snooze", "SZA", "r&b", 2022],
  ["Good Days", "SZA", "r&b", 2020],
  ["At Last", "Etta James", "soul, jazz", 1960],
  ["Let's Get It On", "Marvin Gaye", "soul", 1973],
  ["Cranes in the Sky", "Solange", "r&b, soul", 2016],
  ["Earned It", "The Weeknd", "r&b", 2015],

  // ── happy · funk · disco · pop · dance ──
  ["September", "Earth, Wind & Fire", "funk, disco", 1978],
  ["Get Lucky", "Daft Punk", "disco, funk", 2013],
  ["Uptown Funk", "Mark Ronson", "funk, pop", 2014],
  ["Levitating", "Dua Lipa", "pop, disco", 2020],
  ["Dancing Queen", "ABBA", "disco, pop", 1976],
  ["CAN'T STOP THE FEELING!", "Justin Timberlake", "pop", 2016],
  ["Good as Hell", "Lizzo", "pop, soul", 2016],
  ["Sunflower", "Post Malone", "pop, hip hop", 2018],
  ["As It Was", "Harry Styles", "pop", 2022],
  ["Watermelon Sugar", "Harry Styles", "pop", 2019],
  ["One More Time", "Daft Punk", "house, edm", 2000],
  ["Around the World", "Daft Punk", "house", 1997],

  // ── hope · triumph · gospel · anthemic ──
  ["Ultralight Beam", "Kanye West", "gospel, hip hop", 2016],
  ["Glory", "Common", "gospel, hip hop", 2014],
  ["Rise Up", "Andra Day", "soul, gospel", 2015],
  ["Viva la Vida", "Coldplay", "rock, pop", 2008],
  ["A Sky Full of Stars", "Coldplay", "pop, edm", 2014],
  ["Don't Stop Me Now", "Queen", "rock, 80s", 1978],
  ["We Are the Champions", "Queen", "rock", 1977],
  ["Titanium", "David Guetta", "edm, pop", 2011],
  ["Wake Me Up", "Avicii", "edm, folk", 2013],
  ["The Nights", "Avicii", "edm, pop", 2014],
  ["Stronger (What Doesn't Kill You)", "Kelly Clarkson", "pop", 2011],

  // ── dream pop · indie · mellow ──
  ["Space Song", "Beach House", "dream pop, shoegaze", 2015],
  ["Sweet Disposition", "The Temper Trap", "indie rock", 2009],
  ["Electric Feel", "MGMT", "indie", 2007],
  ["The Less I Know the Better", "Tame Impala", "indie", 2015],
  ["Borderline", "Tame Impala", "indie, synth-pop", 2019],
  ["Redbone", "Childish Gambino", "funk, soul", 2016],
  ["Cherry Wine", "Hozier", "folk, indie", 2014],
  ["Take Me to Church", "Hozier", "indie, soul", 2013],
  ["Riptide", "Vance Joy", "indie, folk", 2013],
  ["Electric Love", "BØRNS", "indie, dream pop", 2014],
  ["Sweater Weather", "The Neighbourhood", "indie, dream pop", 2012],
  ["Heat Waves", "Glass Animals", "indie, dream pop", 2020],
];
