'use strict';
// =====================================================================
//  LORE — right-click descriptions, as filed by a correspondent who has
//  not slept since the cellars and does not intend to start now.
//  Each entry: array of variants; repeated right-clicks cycle through.
// =====================================================================
const GONZO = {
tiles: {
  WALL: [
    "A wall. Old stone, sweating in the torchlight like a witness who knows exactly what happened down here and has decided, wisely, to say nothing. I leaned on it for a while. It leaned back. We understood each other.",
    "Solid rock, mortared by men long dead and probably for the best. You could beat your head against it for a week and learn nothing, which is more or less how the whole of my education went.",
    "The walls here are not decorative. They are a statement. The statement is: NO. I respect that. Very few things in this world are so honest about their intentions.",
  ],
  FLOOR: [
    "Flagstones, worn smooth by centuries of feet going nowhere in particular. Every one of them is cold, and some are colder than others, and I have started to suspect the cold ones are following me.",
    "Floor. Grey, patient, utterly without opinion. There is a stain shaped like the state of Nevada and I do not want to know what made it. I have ruled nothing out.",
    "You could sleep here, if you had no standards and a deep, abiding faith in the rats. I have neither, but I lay down for a minute anyway, just to see what it felt like to give up. It felt cold.",
  ],
  ASH: [
    "Ash. Somebody's bad idea, rendered down to its purest form. It's still warm, which means the bad idea was recent, which means it was probably mine.",
    "Grey powder that used to be something with a shape and a future. Now it drifts on the slightest breath. There is a lesson in here somewhere and I am choosing, deliberately, not to learn it.",
  ],
  WATER: [
    "Shallow water, black and glittering, full of its own reflections and absolutely brimming with conductivity. Stand in it during a lightning storm and you will learn what the inside of a lightbulb feels like.",
    "A puddle with ambitions. It is ankle-deep and cold enough to make your teeth file a formal complaint. Something brushed my boot. I have decided it was a leaf. I will go on deciding that.",
  ],
  DEEP: [
    "Deep water. Black, bottomless, smug about it. I am no swimmer, and the water knows it. Some doors you open with a key; this one you open with frost, and a little bit of courage.",
    "The water here goes down further than a reasonable man would care to imagine, so naturally I imagined it all the way down. There's a cathedral at the bottom. The choir is eels.",
  ],
  ICE: [
    "Ice. Frozen water pretending it was always a floor. It creaks with every step like a bad lie being told under oath. I walked across it anyway. Faith is mostly just not looking down.",
    "A sheet of ice, slick as a lawyer's handshake. Someone froze this on purpose. I want to shake their hand. Carefully. With gloves.",
  ],
  ICEWALL: [
    "A wall, frozen solid, glittering with a pale blue hatred of warmth. Fire will melt it. Lightning will shatter it like a dropped ashtray. Persistence, as always, is optional but encouraged.",
    "Somebody froze the masonry. Magic is a hell of a thing; you start out wanting to cool your drink and you end up redesigning the architecture.",
  ],
  GRASS: [
    "Cellar grass: pale, weird, grown entirely on torchlight and spite. It sways when nobody's breathing. I counted. Nobody was.",
    "Grass, down here, in the dark. Life will get in anywhere if you leave the door open long enough. So will rats. So will doubt. Keep the door shut, I say. Then I opened it.",
  ],
  BUSH: [
    "A dense bush, dry as a church sermon and twice as flammable. It rustled at me. I rustled back. Neither of us backed down. It's a standoff now, and I've got matches.",
    "A thicket of dead twigs just begging for a reason. One spark and this thing goes up like a Las Vegas marquee. I'm not saying do it. I'm saying I've seen you look at it.",
  ],
  DOOR: [
    "A wooden door. Behind every door is either a better life or a worse room, and the only way to find out is to put your shoulder into it and hope. Hope is underrated. So are hinges.",
    "An old oak door, iron-banded, with a keyhole that looks back at you. Doors are just walls that changed their minds. I find that encouraging.",
  ],
  OPEN: [
    "An open door. Somebody came through here in a hurry. Possibly me. The past is a foreign country and I don't have the paperwork for it.",
    "The door hangs open like a jaw in mid-sentence. Whatever it was going to say, it thought better of it. Wise door.",
  ],
  CRATE: [
    "A wooden crate, stencilled with words in no language I've ever been sober for. It contains either supplies or a terrible secret. It is made of wood. Fire would settle the question.",
    "A big dumb box of planks and nails. I rattled it. Something rattled back. Then I heard breathing, and I realised it was mine, and I sat down for a minute.",
  ],
  CHEST: [
    "A chest! Iron-bound and heavy with possibility. Treasure, probably. Or a mimic. Or worse: a stack of unpaid invoices. Open it anyway. Fortune favours the slightly unhinged.",
    "A treasure chest, which is the most suspicious object in any dungeon. Nobody leaves gold lying around for strangers. Then again, nobody expected me to make it this far either.",
  ],
  CHESTOPEN: [
    "An empty chest, gaping like a man who just heard the bill. Whatever was in it is now in my pocket and, frankly, already spoken for.",
    "Nothing inside but dust and the faint smell of somebody else's good luck. I checked it four times. The fourth time I was checking on myself.",
  ],
  TORCH: [
    "A torch, guttering on the wall, throwing shadows that move just a little bit more than the light does. Fire is the oldest friend we have. Treat it with respect. It does not return the favour.",
    "Pitch-soaked rags on a stick, burning with the wild orange enthusiasm of a man three drinks past his limit. It lights the room and the room is not improved. Still: light is light.",
  ],
  TORCHOUT: [
    "A frozen torch. Some fool cast frost on the only source of light in the room, and that fool may well have been me. A little fire will bring it back. Everything comes back, mostly.",
    "The flame froze mid-flicker, a little blue tooth of ice where the fire used to be. It's beautiful, the way all bad decisions are beautiful right afterwards.",
  ],
  STAIRS: [
    "The way down. A staircase descending into a dark so complete it has texture. This is either the end of the story or the start of a much worse one. I am, God help me, curious.",
    "Stairs going down, down, down. I have been warned about places like this my whole life, mostly by people who never went anywhere. Go on. What's the worst that could happen. (Don't answer that.)",
  ],
  MEADOW: [
    "Short grass, green and absurdly healthy, the kind of meadow that makes city people weep and buy land they can't afford. The breeze smells of clover. I don't trust it, but I like it.",
    "A meadow. Sunlight, birds, insects going about their tiny legitimate business. After the cellars it feels like walking out of a bar at noon. Everything is too bright and very loud and beautiful.",
  ],
  FLOWER: [
    "Wildflowers, nodding in the wind like a crowd agreeing with a speech it can't quite hear. The bees are working the room like campaign staff. Everybody here is wildly overcommitted.",
    "Little flowers in impossible colours. I picked one. It looked at me with such disappointment that I put it back. It did not grow back. We both have to live with that.",
  ],
  TREE: [
    "An old tree, thick in the trunk, holding its branches up like a preacher at the high point of a sermon. It has been standing here since before anyone thought to be afraid of anything.",
    "A tree. Roots in the dark, crown in the weather, and somehow at peace with both. I asked it how. It said nothing. Trees are like that. Wise, or deaf. Hard to say.",
    "Bark like old leather, knotted and scarred, the face of a thing that has weathered a thousand storms by the simple trick of bending. I don't bend. That's been my whole problem.",
  ],
  DIRT: [
    "A dirt road, rutted by carts and boots and the long patience of people going somewhere. Every road goes somewhere. That's the frightening part, and the good part, and they're the same part.",
    "Packed earth, a path worn by a thousand mornings. Somebody walks this road every day to fetch water and talk to the birds. I envy them so much it makes my teeth ache.",
  ],
  STONE: [
    "Fieldstone walls, laid by hand, each stone chosen and turned until it fit. You can feel the patience in them. It's frightening, how much a man can love a house.",
    "Grey stones stacked dry, warm on the side the fire touches. These walls have heard a lot of confessions. They kept every one.",
  ],
  WINDOW: [
    "A small window, warm gold from the inside, like a lighthouse built by someone who wasn't trying to save ships, only to tell them: here, someone is home, and the kettle is on.",
    "Old bubbled glass, glowing. From outside it's a promise. From inside it's a view of the long road you came in on. Both are true. Neither is the whole story.",
  ],
  PLANK: [
    "Wooden floorboards, swept, oiled, creaking in exactly the places that let you know someone lives here. Every creak is a little voice saying: welcome, and also, mind your boots.",
    "Old pine planks, warm under the feet. After the stone of the cellars, this feels like being forgiven for something.",
  ],
  RUG: [
    "A woven rug, a thousand colours of wool, gone soft from years of feet and the occasional nap. There's a scorch mark from the hearth. There's always a scorch mark. That's how you know it's loved.",
    "A rug. A good one. The kind of rug that ties the whole damn soul together. I stood on it for a full minute and felt more like a person than I have in years.",
  ],
  HEARTH: [
    "The hearth, glowing, popping, the kettle on the hook singing the same three notes it has sung every evening for forty years. It is the warmest thing I've seen since the beginning of all this.",
    "Fire, tamed and kept and fed with care. Somebody has been keeping this flame alive specifically so that strangers like me would have somewhere to come in from the cold. Ridiculous. Wonderful.",
  ],
  TABLE: [
    "A wooden table, two bowls, two spoons. He always sets two, the old man. Nobody has to tell you who the second one is for. You already know. It's for whoever needs it.",
    "A sturdy table, scarred with knife marks and tea rings, the honest diary of a life spent feeding people. I've seen altars with less holiness in them.",
  ],
  CHAIR: [
    "A chair with a crocheted cushion and a dent in it exactly the shape of patience. Sit down. Nobody here is going to rush you. That alone is worth the walk.",
    "A simple wooden chair, mended twice, wobbly in one leg. Like all the best people I know.",
  ],
  BED: [
    "A narrow bed under a patchwork quilt. Every patch is a different colour, every colour a different year. Somebody has slept here through a lot of storms and woken up every morning anyway.",
    "A bed. Clean sheets. A pillow. I nearly wept. The cellars do things to a person's sense of proportion.",
  ],
  SHELF: [
    "Books on birds, boats, bread, and a cracked spine called 'Being Brave, Vol. II'. Volume One is missing. Of course it is. Nobody ever gets to read Volume One. You just start in the middle, like the rest of us.",
    "A bookshelf, bowed under the weight of everything one old man felt was worth knowing. There's a cookbook full of notes in the margins: 'more butter', 'more butter', 'call your mother'.",
  ],
  MUD: [
    "Mud. Not ordinary mud: swamp mud, thick and sucking and full of a deep primeval opinion about your boots. It wants them. It has wanted everyone's boots since the dawn of time.",
    "Black, stinking mud that farts gently as you walk. I'm told it's good for the skin. I'm told a lot of things, by a lot of people, mostly in places like this.",
  ],
  BOG: [
    "Bog water, brown and still and steaming slightly, every square inch of it wired up for a lightning bolt. One spell and the whole thing becomes a frying pan for leeches. Tempting. Very tempting.",
    "A sullen, stinking pool. The bubbles coming up are swamp gas, and swamp gas burns, and fire spreads, and you can see where this is going. I could. I went there anyway. Twice.",
  ],
  REEDS: [
    "Tall reeds, whispering to each other in the wind like nervous accountants at an audit. They know something. They won't say what. Everything in this swamp is in on it.",
    "Reeds, dense and rattling, the perfect place for something with teeth to wait. I parted them carefully. A frog looked at me with such contempt that I apologised out loud.",
  ],
  DEADTREE: [
    "A dead tree, bone-white and patient, its branches clawing at a sky that never did anything for it. It's been dying out here for years and it's absolutely refusing to fall over. Hero.",
    "Bleached timber, hollow in the middle, full of owls and grudges. Fire would take it like a dry martini. I don't recommend it. I don't not recommend it.",
  ],
  SNOW: [
    "Snow, knee-deep and squeaking underfoot, the whole mountain wrapped in white like a crime scene somebody was very careful about. Cold gets into you up here. It gets into your opinions.",
    "Fresh snow, glittering, so clean you feel guilty for walking on it. I made a snow angel. The angel looked worried. It had a point.",
  ],
  ROCK: [
    "Mountain rock, black and grey and wind-scoured, the knuckles of the earth showing through. It doesn't care about you. That's not personal. The mountain doesn't care about anybody. It's very freeing.",
    "A boulder the size of a bad decision, perched just so. Up here even the rocks look like they've been through something and come out harder.",
  ],
  PINE: [
    "A pine tree, dark green and resolute, wearing snow on its shoulders like a general wears medals. It smells of resin and Christmas and the long silence of high places.",
    "A mountain pine, bent sideways by a century of wind and somehow still pointing at the sky. If a tree can be stubborn, this one is, and I salute it.",
  ],
  BASALT: [
    "Basalt, black and glassy-veined, rock that remembers being liquid and has not entirely forgiven anyone for letting it cool. It's warm. Too warm. Like a dog that's been lying on something.",
    "Volcanic stone, rough as a hangover, still ticking quietly as it cools. Ten thousand years from now it'll still be ticking. Some things never really get over themselves.",
  ],
  CAVE: [
    "Cave floor, gritty and warm and faintly vibrating, as if somewhere far below a vast engine is idling. The air tastes of matches and pennies. I licked a wall. Don't lick the walls.",
    "Warm stone underfoot. The heat comes up through your soles and into your knees and makes you feel briefly invincible. That feeling, I have learned, is a liar.",
  ],
  LAVA: [
    "LAVA. Actual molten rock, glowing like the eye of God on a bad day, burbling, spitting, making a low hungry sound that you feel in your fillings. Frost will turn it into a floor. Nothing else will help you.",
    "A river of fire, the planet's own blood, oozing past at the speed of a funeral. I threw a coin in for luck. It didn't even make a splash. It just stopped existing. I'm thinking about that a lot.",
    "Lava is the earth saying exactly what it thinks, with no filter. Respect it. Freeze it. Walk across it whistling. That is the closest thing to a religion I've got.",
  ],
  OBSIDIAN: [
    "Obsidian, black glass born from frozen lava. Somebody hit liquid fire with ice and made a bridge. That's either the bravest thing I've ever seen or the dumbest. In my experience it's usually both.",
    "A glassy black floor still crackling with heat from underneath. You can see your reflection in it. You look terrible. You look magnificent. You look like someone who got here.",
  ],
  SECRET: [
    "Now hold on. This stretch of wall is WRONG. Different stone, a dusky violet the rest of the place never heard of, and the mortar is newer, or older, or from somewhere else entirely. A draught is coming through the cracks. Walls don't breathe. This one does. Give it a shove.",
    "This is not like the other walls. I want to be very clear about that, because I've been staring at walls for hours and I know them now, I know their moods, and this one is LYING. Odd colour, hollow sound when you knock, faint warm air leaking out. Something is behind it. Push.",
    "A wall that is trying very hard to look like a wall and failing on every count: the wrong colour, the wrong temperature, a seam running round it like a door that forgot what it was. I have a nose for secrets. This one stinks of them.",
  ],
  RUBBLE: [
    "Rubble, where the odd wall used to be. Broken violet stone and old dust and a smell like incense and closed-up centuries. You did this. You pushed and the world gave way. Remember that feeling.",
    "A heap of shattered secret masonry. Somebody bricked this place up a very long time ago, for reasons, and now the reasons are in pieces on the floor.",
  ],
  ALTAR: [
    "An altar, glowing faintly, to a god nobody remembers. Candle stubs. Offerings rotted to nothing. Words carved in a language I'm sure I've dreamt in. Somebody loved this god once, deeply, and then everybody stopped. And the god kept the light on anyway.",
  ],
  ALTARSPENT: [
    "The altar's quiet now. Its light is gone, spent on you, which may have been the last thing it had. That's a strange kind of gift to carry around. Carry it well.",
  ],
  VENT: [
    "A steam vent, hissing like an angry radiator in a cheap motel, spitting scalding fog at the ceiling. The earth's pressure valve. Nobody here knows what happens if it's ever shut off. Nobody wants to.",
    "A crack in the world exhaling boiling breath. Every few seconds it sighs, very loudly, like a man who has just been asked to explain himself and cannot.",
  ],
},

// the forgotten gods behind the odd walls
deities: {
  vessa: {name:'Vessa', title:'Keeper of Small Lamps', col:[1,.82,.45],
    gonzo:[
      "An altar to VESSA, KEEPER OF SMALL LAMPS, goddess of the candle in the window, the porch light left on, the torch carried home. Her shrine is ringed with a hundred tiny clay lamps, all cold, all patient. One is still lit. I don't know who lit it. I don't want to know. I want to kneel.",
      "Vessa's altar. The carvings show a woman holding a lamp to the face of a frightened traveller, and the traveller is smiling, and the stone is worn smooth right there, on the smile, where thousands of thumbs have touched it for luck.",
    ],
    prayer:'A warm light opens behind your eyes, like a lamp lit in an upstairs window. Vessa remembers you.', boon:'Max MP +5.',
    gift:'mp'},
  gloam: {name:'Gloam', title:'Mother of Damp Places', col:[.55,1,.7],
    gonzo:[
      "An altar to GLOAM, MOTHER OF DAMP PLACES, patron of moss and puddles and the slow green things that grow where nobody looks. Her idol is a fat stone frog with a crown of mushrooms and the expression of a woman who has seen it all and forgiven most of it. Moisture beads on her like sweat. She is listening.",
      "Gloam's shrine smells of rain on old rope. The offering bowl is full of pebbles, each one painted with a tiny careful frog. Children left these, centuries ago. The paint hasn't faded. Not one bit. Think about that.",
    ],
    prayer:'Something cool and green and patient settles into your bones. Gloam holds you a moment, like a stone holds water.', boon:'Max HP +3, max MP +3.',
    gift:'both'},
  quillow: {name:'Saint Quillow', title:'of the Unfinished Sentence', col:[.75,.85,1],
    gonzo:[
      "An altar to SAINT QUILLOW OF THE UNFINISHED SENTENCE, patron of people who were interrupted, who meant to say it, who never got the chance. The altar is covered in half-carved words. Every inscription stops in the middle. It is the most honest church I have ever been in.",
      "Quillow's shrine, high in the cold. Prayers are scratched into the rock, all of them unfinished: 'I always wanted to tell you', 'If I'd only', 'I'm sorry I never'. The saint finishes them, they say. In her own time. Slowly. Kindly.",
    ],
    prayer:'A soft voice finishes a sentence you started years ago and never ended. It was the right ending. You stand straighter.', boon:'Armour +1.',
    gift:'armor'},
  hrask: {name:'Hrask', title:'Lord of the Lukewarm', col:[1,.55,.35],
    gonzo:[
      "An altar to HRASK, LORD OF THE LUKEWARM, a god of moderation in a land of lava, worshipped by exactly one sect of very calm fire-monks who all died of old age, which in the Ember Deeps is a miracle. His idol is a sitting man with a cup of tea at exactly drinking temperature. I'm moved. I'm genuinely moved.",
      "Hrask's shrine: a cool, quiet pocket in the burning dark, the only place in the Deeps you can breathe without your lungs filing a complaint. The god of not-too-much. Of enough. I have never once in my life practiced his teachings, and I respect him enormously.",
    ],
    prayer:'Everything slows to a comfortable simmer. Your magic stops running so hot and starts running steady.', boon:'Spells cost 1 less.',
    gift:'cost'},
},

mons: {
  rat: [
    "A rat. Grey, greasy, sure of itself, with the eyes of a small-time hood who knows a guy who knows a guy. It's been in these cellars longer than I have. It's not going to leave. Neither am I. Somebody's going to have to give.",
    "Rodent. Twitching whiskers, yellow teeth, the bearing of a creature that has survived every plague, flood, and well-intentioned exterminator in history. You have to admire it. Then you have to hit it.",
    "This rat is looking at me like I owe it money. Maybe I do. I've lost track of a lot of things since I came down here.",
  ],
  goblin: [
    "A goblin, small and green and bristling with some dull pointy object, hopping from foot to foot with the frantic energy of a man who has just been told the bar is closing. It wants your gold. It wants your boots. It wants, mostly, to be taken seriously.",
    "Gibbering green menace, three feet of bad posture and worse intentions. It's got a knife, and the knife's got rust, and the rust's got opinions about tetanus.",
    "The goblin grins with too many teeth and none of them in the right place. It's not evil exactly. It's just been down here too long. We all have.",
  ],
  slime: [
    "A slime. A purple gelatinous blob, quivering, sliding forward with a wet obscene sound like a sermon played backwards. It wants to engulf you. It's not personal. Engulfing is all it has.",
    "Pulsing ooze the colour of a bruise. I think I can see a boot inside it, and a coin, and possibly some regrets. It's slow. That's the one thing it's got going for you.",
  ],
  orc: [
    "An orc. Big, red, tusked, wearing armour scavenged from at least three different wars, carrying an axe that has clearly seen things. It breathes like a train. It cleaves. It is, in its own way, very honest about all of this.",
    "Six and a half feet of muscle, scar tissue and pure unexamined rage. I've met cops like this. You don't argue. You don't reason. You set it on fire and walk the other way.",
  ],
  frog: [
    "A bog frog the size of a beer keg, throat pulsing, eyes like two wet marbles full of bad news. Its tongue can reach you from two tiles away. Its hops have no warning. It knows things about the swamp you will never learn.",
    "This frog is looking at me with total, reptilian, prehistoric calm, the face of a creature that has never once doubted itself. I'd like that. I'd like that very much.",
  ],
  leech: [
    "A giant leech. Glistening red, ribbed, slithering through the bog like a terrible idea looking for a host. It latches. It drinks. It gets stronger on your blood. Hit it with lightning while it's in the water and watch it learn humility.",
    "A fat blood-sucker the length of a man's arm. I've met lawyers like this. Worse: I've hired them.",
  ],
  wisp: [
    "A will-o'-wisp: a ball of cold green light bobbing over the bog, beckoning, giggling in a voice like wind chimes in a madhouse. Lightning goes right through it. It is made of the stuff. It thinks that's hilarious.",
    "Swamp light, dancing, darting, never where you look. Men have followed lights like this into the bog for a thousand years and never come back. I'm following it with my eyes only. My feet are being very responsible today.",
  ],
  troll: [
    "A bog troll. Huge, moss-backed, stinking of rot and wet dog, swaying like a drunk on a ship's deck. Its wounds close as you watch them. It will heal forever, unless you burn it. Fire is the only argument it understands.",
    "Eight hundred pounds of swamp and bad temper. It slams. It regenerates. It has the patience of geology. Set it on fire, then keep it on fire, then run.",
  ],
  wolf: [
    "A grey wolf, lean and fast and hungry, panting little clouds into the cold. It moves twice for every step you take. It howls. Other wolves answer. This is what being hunted feels like, and I have to say, it's clarifying.",
    "A mountain wolf with yellow eyes and the posture of a creature that has done the maths on you and is satisfied with the answer. Do not run. You are slower. Cast something.",
  ],
  yeti: [
    "A yeti. An honest-to-God yeti, nine feet tall and white as a wedding cake, puffing frost from its nostrils. Frost does nothing to it. Fire does plenty. It claps its paws together like a man applauding his own terrible joke.",
    "Shaggy white abomination of the high pass. I have seen it now, so I am either the first man to prove it real or the last man to doubt it. Either way I am not getting a book deal from this.",
  ],
  wraith: [
    "An ice wraith, a flickering blue shape like a curtain made of cold, swooping, sighing, wailing about some grievance from three centuries ago. Frost only makes it happy. Fire makes it scream. Fire is your friend here.",
    "A ghost of ice and spite, drifting a few inches off the snow, leaving frost on everything it's ever loved. I've been to parties with people like this.",
  ],
  imp: [
    "A fire imp, a little orange devil with a spear and a grin, cackling, hopping across the lava like it's warm bathwater. Fire is its home address. Frost is its worst nightmare. Use the nightmare.",
    "A cackling ember of malice the size of a cat. It throws itself at you with the total confidence of something that has never once been punished. Somebody needs to teach it. Ice works.",
  ],
  golem: [
    "A magma golem. A walking furnace, eight feet of cracked black rock with molten fire pouring through the seams. It moves slow. It hits like a freight train full of anvils. Freeze it and watch the fear come into its eyes, if it has eyes.",
    "Living lava wearing a stone coat. When it punches the ground, the ground files for divorce. Do not let it near you. Do not let it near anything you love.",
  ],
  bat: [
    "An ember bat, flitting through the cave in mad jagged zigzags, wings glowing at the edges like burning paper. Fast, erratic, totally unbothered by your plans. Swing at it and it's already somewhere else.",
    "Bats. Of course there are bats. There are always bats. This one is on fire, slightly, which is new, but its attitude is the classic bat attitude: chaos, then more chaos.",
  ],
  salamander: [
    "A salamander, long and orange and glistening, slithering through the lava like a bad thought through a good mind. Its tail whips. Fire won't touch it. Neither will reason. Frost, lightning, prayer: in that order.",
    "Fire lizard, the length of a canoe, skin like molten glass. It looks at you with the faint, bored amusement of a creature that was born in a volcano and has frankly seen better.",
  ],
},

items: {
  potion: [
    "A healing potion: red, warm to the touch, glowing faintly like a cherry in a cheap cocktail. I have no idea what's in it. I'm going to drink it anyway. That's not courage, exactly. It's tradition.",
    "A small glass bottle of something red and sweet-smelling. The label says DRINK ME in a handwriting I don't recognise, which I'm choosing to find charming rather than sinister.",
  ],
  scroll: [
    "A scroll of insight, inked in a crabbed hand, words that crawl around on the page if you look at them too long. Reading it will widen your mind. Mine has been widened before. You get used to the draught.",
    "Ancient paper, very dry, very flammable, very important. Do not cast fire near it. I am telling you this as a man who has, recently, cast fire near it.",
  ],
  gold: [
    "Gold! Yellow, heavy, shining with that old savage light that has started every war in history. Pick it up. Feel the weight. Feel your morals get just a little bit more flexible.",
    "A little pile of coins with somebody else's king on them. Money is a story we all agree to believe in. I believe. Brother, do I believe.",
  ],
},

player: [
  "That's you. The @. A small, glowing, slightly frayed little symbol with a tail and a habit of walking into rooms it should not walk into. You look exhausted. You look like you've seen things. You look like you're going to keep going anyway.",
  "You. Bloodshot, brave, half-mad, carrying three spells and a pocket full of bad decisions. Some people would call this a crisis. I call it a vacation.",
  "There you are. Everything in this world is either trying to kill you, feed you, or ask you a question. You've survived every one of them so far. That counts for something. It might count for everything.",
],
playerHurt: [
  "You're bleeding. Not badly. Well, a bit badly. The red bar is getting short and the cold is getting in and somewhere a small voice is saying 'maybe sit down'. Listen to it. Or don't. But know it's there.",
  "Battered, bruised, leaking. You look like the morning after a party in Bat Country. Find a potion. Find the old man. Find a quiet corner and breathe.",
],
playerBelief: [
  "You. Glowing now, actually glowing, a soft gold light around you like you finally remembered something important. It wasn't magic. He just helped you notice it. It was always yours.",
  "There you are, lit up from the inside. You walk differently now. The monsters can tell. Hell, I can tell, and I'm barely holding it together.",
],
man: [
  "An old man in a knitted cardigan, rocking slowly in his chair by the fire, beard like a cloud that decided to settle down. His eyes are kind in a way that catches you off guard, like walking into warm water. He's been expecting you.",
  "The old man. Hands like tree roots, voice like a well-tuned cello, the calm of someone who has lost everything once and found out it didn't matter as much as he'd feared. Go talk to him. He'll ask you things.",
  "He's humming something. Old song. He looks over and smiles like he's known you your whole life, which is absurd, which is also, somehow, true.",
],
manNamed: [
  "Eli. The old man has a name now and you know it, which means you know him, which means something has shifted. He's still rocking in that chair. He still sets two bowls. He still believes in you, more than you do, for now.",
  "Eli, keeper of the kettle and the fire and a dog-eared notebook full of everything you ever told him. He's the kind of man you meet once and carry around for the rest of your life.",
],

// little kicker lines tacked on for current conditions
// when something is burning or frozen, its own description gives way to these. {it} is its name.
burningMon: [
  "The {it} is ON FIRE. Not a little. Completely. It runs in tight panicked circles, trailing smoke and opinions, howling a long high note I last heard from a Chevrolet losing a transmission on the Vegas strip. I would help, but I started it.",
  "Pure liquid chaos: the {it} has become a torch with legs. Fat sparks pop off it like campaign promises. The smell is hair and regret. Somewhere a fire marshal is weeping into his clipboard.",
  "Look at the {it} go. Burning bright, burning fast, burning with the frantic dignity of a man who has just realised the hotel is on fire and he is the hotel. This is the most alive it has ever been.",
  "The {it} is going up like a dry Kentucky barn. Every few seconds it pauses, as if to reconsider its whole career, and then it remembers it's on fire and screams again.",
  "Flames all over the {it}, licking up its back, turning its eyes into two little lamps of total animal panic. Bat Country. We are deep in Bat Country now and it's burning.",
],
frozenMon: [
  "The {it} has been frozen solid, a perfect blue statue of its own worst intentions. Its eyes still move. They follow you. Inside that ice is a creature composing a long, furious letter to its congressman.",
  "Ice. The whole {it}, sealed up in a glassy coffin, mid-snarl, like a trophy some mad Alaskan taxidermist left out on the porch. Frost crackles off it. It cannot move, and it is taking this very personally.",
  "A frozen {it}, rimed white, creaking quietly like an old ship. You could tap on it. You could write your name in the frost on its face. I recommend you don't. It's thawing. It's remembering.",
  "The {it} stands locked in a block of cold blue nothing, breath stopped in a little cloud before its teeth. A museum piece. Exhibit A in the case against walking toward a man holding frost.",
  "Frozen stiff, the {it}. Absolutely still for the first time in its wretched life. There's something peaceful about it, the way there's something peaceful about a parked car with its engine about to explode.",
],
burningPlayer: [
  "YOU ARE ON FIRE. This is not a metaphor. Smoke is coming off your sleeves and your hair is making a sound like bacon. Find water. Find rain. Stop reading this and MOVE.",
  "Flames up both arms, the smell of yourself cooking, and somewhere behind your eyes a calm little voice saying 'well, this is new.' The voice is not helping. Water. Now.",
  "You've become the light source. Congratulations. Every monster in the valley can see you coming and the skin on the back of your neck is filing for divorce. Put yourself out.",
],
frozenPlayer: [
  "You are frozen solid. Your thoughts move like syrup in January. Somewhere very far away, your fingers are filing a complaint.",
  "Ice to the elbows, ice in the eyelashes. You are a sculpture titled 'Poor Decisions, Winter'. Wait. Breathe. It'll pass.",
],
burningTile: [
  "The {it} is burning, cheerfully, viciously, crackling away like it has waited its whole life for this. Heat rolls off it in waves you can see. Do not stand there. I mean it.",
  "Fire has the {it} now. Orange teeth, black smoke, little embers drifting off like drunk fireflies looking for something else to ruin. Give it a few turns and it will be ash and a story.",
  "A burning {it}: the most honest thing in the valley. It doesn't pretend. It just burns, and spits sparks at everything nearby, and dares the wind to make it worse. The wind usually does.",
  "Flames all through the {it}, roaring like a crowd that just saw somebody fall off a stage. The air above it wobbles. Your eyebrows feel threatened from here.",
],
states: {
  burning:  "AND IT IS ON FIRE. Flames everywhere, screaming, the smell of singed fur. The whole scene has gone full Bat Country.",
  frozen:   "Currently frozen solid, a statue of its own bad intentions, quietly furious inside a block of ice.",
  hurt:     "It's wounded and it knows you did it. The look in its eyes has changed. This is personal now.",
  big:      "And this is a BIG one. Enormous. Unreasonable. Something has been feeding it.",
  scrawny:  "A scrawny specimen, all ribs and nerves. It's having a worse week than you are.",
  inWater:  "It's standing in water. Lightning would make an absolute example of it.",
  tileFire: "It's burning, right now, merrily, as if nothing could be more natural.",
  snowed:   "Snow has piled up on it, soft and silent, like the world is trying to tuck it in.",
  remembered: "Or that's how I remember it, anyway. Memory is a liar with a beautiful voice.",
  storm:    "Rain is hammering down in great grey sheets and somewhere close by the sky is cracking open like a walnut.",
  blizzard: "Snow is coming sideways, howling, a white wall of pure contempt. I can't feel my face. I'm told that's normal.",
},

hud: {
  hp: [
    "Your HEALTH: a red bar of pure biological optimism. Every hit takes a chunk. Potions put it back. The old man puts it back. Time, and tea, and a kind word put it back. When it's empty, the story stops. Keep it red, friend.",
    "Hit points: the meat budget. You can spend it on courage or on stupidity, and the receipts look exactly the same.",
  ],
  mp: [
    "Your MANA: the blue stuff, the electric juice behind the eyes that lets you throw lightning like an angry god. It refills slowly as you walk. Spend it wisely. Or spend it like a madman. Either way, it comes back.",
    "Magic points. Somewhere in the back of your skull there's a battery, and it's humming, and it wants out.",
  ],
  gold: [
    "Gold. Shiny, useless down here, and you're carrying it anyway, because some lizard part of the brain just can't leave it on the floor. Honestly? Same.",
    "Your fortune, such as it is. Not enough to retire on. Enough to feel a small, shameful flush of pride.",
  ],
  '1': [
    "LIGHTNING: a jagged white bolt straight from the sky's own bad mood. Fried anything standing in water: the whole pool lights up and everybody in it does a little dance. Shatters ice walls. Glorious. Expensive.",
    "Lightning. The power to make the weather personal. Aim it at the bog and you'll understand why God enjoys this so much.",
  ],
  '2': [
    "FIRE: a ball of roaring orange that burns on and on after it hits, damage over time, the gift that keeps giving. Sets crates, chests, bushes and trees alight. Wind spreads it. Rain drowns it. Swamp gas, ahem, upgrades it.",
    "Fire. Mankind's first invention and still its best argument. Use it on trolls. Use it on yetis. Do not use it on the scrolls. Learn from me.",
  ],
  '3': [
    "FROST: a blast of blue cold that freezes monsters solid, turns water into floor, walls into ice and, crucially, lava into a road. Snuffs torches, which is a mood, but not a good one.",
    "Frost. The cold shoulder, weaponised. Freeze the lava. Cross the river of fire. Feel, briefly, like you've cheated death at cards.",
  ],
  sound: [
    "The sound switch. Music, effects only, or the cold indifferent silence of the void. The music is lofi chip-tune with tape wobble, made by a very small, very earnest synthesizer that believes in you.",
  ],
  zone: [
    "Where you are and what the sky's doing about it. Weather moves on its own clock. Rain becomes snow on the pass. The cellars and the deeps have no sky at all, which is its own kind of weather.",
  ],
},
  restart: [
    "You want to burn it all down and start over. Every step, every scar, every hard-won torch, gone like a bar tab in a fire. The world will forget you instantly. The old man will set two bowls anyway. Are you sure? Be sure. Sureness is the only drug they can't take from you.",
    "This is the big red button, friend. Push it and the whole cursed valley folds up like a cheap motel bed and you wake up in the cellar with nothing but your teeth and a vague sense of déjà vu. I have pushed this button. I am not proud. Are you sure?",
    "Reality is negotiable, but the terms are bad. You hand over everything you've got and in return you get a fresh, clean, idiotic beginning. The goblins will not remember you. That's the worst part. Do it?",
    "Somewhere a kettle is on, and you want to pour it out and fill it again from scratch. That's madness. That's also the only honest thing a person can do at 4 a.m. Restart the whole sorry business?",
    "WARNING: the management is not responsible for lost gold, lost blessings, or the small part of your soul that grew attached to that one torch. Once you go back, there is no going forward. Confirm the purge?",
    "I've seen men do this. Good men. Their eyes went flat and they whispered 'one more run' and they were never seen again, except constantly, in the cellar, at the start. Is that who you want to be? Fine. It's who we all are. Sure?",
    "You are about to murder this timeline. Not maim it. Murder it. Cold, clinical, a single keystroke. The deities you prayed to will look at each other and shrug. The leech will keep wiggling, but for someone else. Go on?",
    "There is a voice in the back of your skull saying 'I could do it better.' That voice is a liar and a scoundrel, and it is also, statistically, occasionally right. Listen to the voice?",
    "Start over? From the top? The damp stone, the first goblin, the slow dawning horror of the mire? Fine. The road is long but it is the same road, and you know where the bad parts are now. That's called wisdom. Or a habit. Sure?",
    "Every run ends. Most of them end in screaming. This one would end in a quiet, deliberate click, which is somehow worse. The valley holds its breath. The weather pauses mid-gust. Well? Are you sure?",
  ],
};

// =====================================================================
//  The long way down: five floors, five things standing in the way,
//  and an old man who keeps turning up at the top of the stairs.
// =====================================================================
GONZO.deities.quillow.boon = 'AC +1.';
GONZO.hud.lightning = GONZO.hud['1']; GONZO.hud.fire = GONZO.hud['2']; GONZO.hud.frost = GONZO.hud['3'];
delete GONZO.hud['1']; delete GONZO.hud['2']; delete GONZO.hud['3'];
Object.assign(GONZO.hud, {
  ac: [
    "ARMOUR CLASS. The number every claw, tooth and rusty cleaver down here has to beat before it gets to you. You don't dodge. You never dodge. You stand there in whatever the old man stitched for you and you let the dice argue it out.",
    "Your armour class: ten for being a warm body, plus whatever leather and iron and love you've got strapped on. Every point is one more monster swinging at air and looking embarrassed about it.",
  ],
  potion: [
    "Healing potions, rattling in your pack like loose teeth. Press 4 and drink one: the wounds close, the venom gives up, and for a few glorious seconds you feel like you could fistfight a mountain.",
  ],
  mana: [
    "Mana potions. Blue, fizzy, tastes faintly of batteries and regret. Press 5. Your skull lights back up like a Las Vegas marquee at dusk.",
  ],
  pack: [
    "Your pack. Everything you own, everything you wear, every small promise you made to an old man by a fire. Press I and look at it. Take stock. It's important to know what you're carrying.",
  ],
  unknown: [
    "A spell you don't have yet. Somewhere down here, something big and mean is sitting on the book that teaches it. That is how it always goes: the good things are guarded by the worst things. Go and be worse.",
  ],
});
GONZO.man = [
  "An old man in a knitted cardigan, squatting by a little campfire at the foot of the stairs as if it were the most natural thing in the world, beard like a cloud that decided to settle down. He has a kettle. Of course he has a kettle.",
  "The old man. Hands like tree roots, voice like a well-tuned cello, the calm of someone who has lost everything once and found out it didn't matter as much as he'd feared. He sells swords now, apparently. Go talk to him.",
  "He's humming something, poking his fire with a stick. He looks up and smiles like he's known you your whole life, which is absurd, and also, somehow, true. How does he keep getting down here before you?",
];
GONZO.manNamed = [
  "Eli. Keeper of the kettle and the fire and a dog-eared notebook full of everything you ever told him. He's at the top of every floor before you, every time. I've stopped asking how. Some questions are rude.",
  "Eli, by his little fire, with his little shop: blades on a blanket, potions in a row. He undercharges. He knows he undercharges. He's the kind of man you meet once and carry around for the rest of your life.",
];
Object.assign(GONZO.tiles, {
  TORCHOUT: [
    "A cold torch, black at the tip, set in an iron bracket by some miner who died a long time ago and left the lights off. A little fire would bring it back. Everything comes back, mostly.",
    "An unlit torch. It is a promise somebody stopped keeping. You've got fire in your fingers now. Keep it for them.",
  ],
  CAMPFIRE: [
    "The old man's campfire: a ring of stones, a heap of something that might be coal and might be furniture, a dented kettle singing on top. It is the only thing on this whole floor that wants nothing from you.",
    "A small, stubborn fire at the foot of the stairs, the kind that's been lit in the same place a hundred times. It warms your face and your hands and some third thing behind your ribs that hasn't been warm for a while.",
  ],
  UPSTAIRS: [
    "The stairs back up. Daylight is up there, and beds, and people who have never once been bitten by a hydra. They don't know what they're missing. Neither do you, for now. Down is the only direction that matters.",
  ],
  WEB: [
    "A spider web, thick as fishing line and twice as sticky, strung across the way like a bad idea someone had in the dark. Walk into it and it holds you like a jealous lover. Fire takes it in a single bright breath.",
    "Webbing. Grey, glistening, humming faintly in the draught. Something built this with eight legs and a great deal of patience. I have neither, so I'm going to burn it.",
  ],
  EGGSAC: [
    "An egg sac, the size of a sheep, pulsing. PULSING. Something inside is turning over in its sleep. I'm told there are hundreds of them in each one. Burn it. Burn it and do not look back and do not, under any circumstances, poke it.",
    "A leathery sac stuck to the rock with spider glue, warm and twitching. This is a nursery. This is the worst nursery in the world. The old man wants it on fire and so, God help me, do I.",
  ],
  BRAMBLE: [
    "Dry brambles, dead as last year's gossip and twice as thorny, packed so tight you can't see past them. But something glints behind. Something always glints behind. One spark and this whole tangle is history.",
    "A wall of thorns, brittle with cold, rattling in the wind like a bag of bones. It is hiding something. Brambles always are. That's the only reason anybody lets them grow.",
  ],
  GATE: [
    "An iron gate, bars as thick as your wrist, rusted into place by a century of fog. No lock. No handle. Whoever built this didn't want it opened by hands. They wanted it opened by cleverness, which is much worse.",
    "A portcullis, cold and patient and utterly indifferent to your shoulder. I threw myself at it twice for the principle of the thing. The principle is now bruised. Look around for what opens it.",
  ],
  CHASM: [
    "A crevasse, a long black crack in the world, so deep the wind comes back out of it with a different voice. You can't cross it. Nothing with feet can. But a ball of fire doesn't need feet.",
    "The ground just stops. Below: blue ice, then grey, then nothing, a nothing that goes on for a very long time. I dropped a coin in. I am still listening for it.",
  ],
  PILLAR: [
    "A great stone pillar, wide as a barn door, holding up a ceiling you'd rather not think about. When something huge starts breathing in, get behind one of these and stay there and think about your life choices.",
    "A pillar. Columns like this are the only honest architecture: they hold things up and they hide you from dragons and they ask nothing in return. Hug it. I did.",
  ],
  TWALL: [
    "Tomb wall: dressed stone, cut so fine you couldn't slip a knife between the blocks, carved with long lists of a king's victories. Every name on it is somebody he killed. He wanted them remembered as things he'd done.",
    "Old, old stone, dry as a eulogy. The carvings go on and on: the king winning, the king judging, the king refusing to die. Nobody carved the people who built it. Nobody ever does.",
  ],
  TFLOOR: [
    "Tomb floor, worn smooth by the shuffling of things that should have stopped shuffling a thousand years ago. It's dusty. It's very quiet. It's the kind of quiet that's listening.",
    "Flagstones laid for a funeral that never ended. Every step echoes a little too long, as if the room is deciding whether to let you have it.",
  ],
  BONES: [
    "Bones. A great many of them, in no particular order. Some of them are adventurers. Some of them are the things that ate the adventurers. Down here nobody keeps score.",
    "A scatter of old bones, yellow as tobacco, gnawed by something with ideas. I counted three skulls and then I stopped counting, because counting makes it real.",
  ],
  SARCO: [
    "A stone sarcophagus, lid carved with a face that has been very, very patient for a very, very long time. There is a faint scratching inside. Let it stay sealed. Some doors are walls for a reason.",
    "A coffin of solid granite, heavy enough to hold anything in. I put my ear to it. I took my ear away from it. I am not putting my ear to anything ever again.",
  ],
  GRAVE: [
    "A small grave, in a corner of a tomb built for kings. Plain stone. One name: MARTA. No titles, no victories. Somebody has kept the moss off it, once a year, for a long, long time. My throat has gone tight and I don't want to talk about it.",
  ],
  GRAVEDONE: [
    "Marta's grave, with a pressed flower on it now, pale and flat and perfect. It's the only soft thing in the whole tomb. The king had marble and gold and ten thousand names carved into the walls. She has a flower. She wins.",
  ],
  RUNE: [
    "A rune cut into the wall, dull and grey, its grooves still faintly warm. Water laps right against it. It is thirsty, the way a dry battery is thirsty. It wants a great deal of lightning, all at once, all around it.",
    "A carved sigil, dead as a doornail, sitting with its feet in a pool of water like a tired old man at the seaside. One spark won't wake it. It wants the whole pool lit up.",
  ],
  RUNELIT: [
    "The rune is BLAZING now, white-blue, crackling, humming like a power line in a storm. It drank the lightning out of the water and it liked it. Somewhere a gate has opened. Somewhere a dead king has noticed.",
  ],
  BARRICADE: [
    "A barricade of old coffins, stacked and nailed and wedged across the way. Somebody wanted to keep something in, or out. The wood is dry as a lecture. One spark, and the problem solves itself.",
    "Coffins, stacked like firewood. Which, if you think about it, and I have, is exactly what they are now.",
  ],
});
Object.assign(GONZO.mons, {
  spider: [
    "A mountain spider, big as a dog, grey as the rock it hides in, eight legs going in eight directions at once. It bites, and the bite carries venom that sings in your blood for a while after. Hates fire. Everything with eight legs hates fire, and they are right to.",
    "Spider. Fat, quick, furred with frost, eyes like a cluster of wet black grapes. It looked at me and I felt every one of those eyes individually. Burn it. Burn its web. Burn the memory of it if you can.",
  ],
  skeleton: [
    "A skeleton, rattling in a rusted cuirass, sword raised in a salute to a king who stopped deserving it a thousand years ago. It's tougher than it looks. Lightning loves it: all that dry bone sings like a harp.",
    "Bones, held together by spite and very old magic. It walks like a man who has forgotten why he got up. Hit it hard. Or hit it with lightning, which is the same thing, only louder.",
  ],
  zombie: [
    "A zombie. Grey-green, slow, carrying the smell of a cellar that flooded in the reign of a forgotten king. It does not hurry. It doesn't need to. Fire makes it hurry, briefly, in a direction of its own choosing.",
    "A shambling dead man, mouth working on words nobody has spoken in centuries. He hits like a falling door. Burn him. He won't mind. He hasn't minded anything for a very long time.",
  ],
  spectre: [
    "A spectre: a thin pale smear of somebody who couldn't let go, drifting a foot above the floor. Your blade goes right through it like a hand through fog. Lightning, though. Lightning it remembers. Lightning it fears.",
    "A ghost, cold and see-through and very, very sad, which doesn't stop it trying to freeze the heart in your chest. Steel is useless. The sky's own fire is not.",
  ],
  knight: [
    "A bone knight, seven feet of old armour with nothing alive inside it, sworn to a king who never released anyone from anything. Fire slides off it. Lightning slides off it. Your blade rings off it. But FREEZE it, and it goes brittle as a winter twig.",
    "A dead knight in full plate, visor down, sword up, utterly certain of its purpose. That certainty is the most frightening thing about it. Frost first. Then hit it like you've got something to prove.",
  ],
  minion: [
    "A risen skeleton, put together in a hurry by a king with places to be. A rib is missing. A foot is on backwards. It doesn't care. Break it again. It's used to it.",
  ],
  matriarch: [
    "GUTMOTHER GRUKKA. Nine feet of red muscle and scar and filed teeth, wearing a necklace of keys from every village she's ever emptied. She ate the miller of Hollin. She ate the miller's sons. She kept the miller's daughter as a footstool for eleven years. Killing her is not a crime. It is a public service, overdue by decades.",
    "The Matriarch of the Pit, the orc who taught a whole tribe that cruelty is a kind of strength. The bones in her room are children's. I checked twice. I wish I hadn't. She is slow to anger and then she is all anger, and you are the only thing between her and the next village. Do it.",
  ],
  brood: [
    "THE BROODMOTHER. A spider the size of a cart, white-grey, bristling, her abdomen swollen and ticking with ten thousand next generations. Venom like liquid fire, webs like ship's rope. She is old, and enormous, and burns like a dry haystack. Remember that last part.",
    "Queen of the Pass. Eight eyes, each the size of a fist, each watching you with the patience of something that has eaten every miner who ever came up here with a lantern. She spits web. She bites poison. She hates fire more than she has ever loved anything.",
  ],
  hydra: [
    "THE MIRE HYDRA. A great green swamp-thing with too many necks, every one of them ending in a mouth full of needles and bad intentions. Cut off a head and the stump boils and splits and grows TWO. Unless, the old man says, the stump is burning when you cut it. Fire first. Then steel. Fast.",
    "Many-Necked. It's a riddle with teeth: you can't hack your way through it, because hacking makes more of it. Set it alight and THEN cut, while it's still burning, and the fire seals every stump. That's the trick. That's the whole trick. Don't forget the trick.",
  ],
  dragon: [
    "CINDER, THE OLD FLAME. A red dragon curled on a bed of cooling slag, scales like a forge's worth of horseshoes, breath that smells like a struck match the size of a church. When it takes a deep breath, everything it can see turns to fire. So don't let it see you. Pillars. Get behind the pillars.",
    "A dragon. An actual dragon, God help us, with an eye like a lava lake and a temper to match. It hates the cold the way old men hate draughts. After it breathes, it pants, it sags, it's slow. That is when you hit it. That is the only time you hit it.",
  ],
  lich: [
    "KING AUREX THE UNDYING. Once he ruled everything you can see from the top of the mountain. Then he wanted more: he wanted ALWAYS. He sealed himself in here with a stone that beats like a heart and he has been dead, and refusing to be, ever since. He casts slowly. He tells you, with his hands and his eyes, exactly what he's about to do. Listen.",
    "A dead king, thin as a coat on a hook, crowned in tarnished gold, eyes two pinpricks of violet light. Black light gathers on his finger: break his line of sight. Frost sigils spread under your feet: move. He has had a thousand years to be clever. You've had five floors. Be clever faster.",
  ],
});
Object.assign(GONZO.items, {
  mana: [
    "A mana potion, deep blue, fizzing like a shaken soda. One swallow and the battery behind your eyes lights back up. It tastes the way a thunderstorm smells.",
  ],
  specs: [
    "A pair of small round spectacles, wire-framed, one lens cracked, the other polished to perfection. A goblin wore these. Now they need to go home to the old man's nose, where they belong.",
  ],
  lily: [
    "A moonlily, floating on black water, glowing faintly white like somebody left a lamp on. It smells of summer evenings in a garden you've never been to. The old man wants three, for a dead woman's tea.",
  ],
  hammer: [
    "An old hammer, worn smooth where a hand held it for fifty years. It's been on this island of hot rock for thirty of them and it hasn't so much as warped. Some tools are just stubborn. So are some men.",
  ],
  tome: [
    "A spellbook, bound in the hide of something that didn't want to be bound, humming with a power that makes your fillings ache. The boss was sitting on it. Bosses always are. Step on it. Read it. Become a little more dangerous.",
  ],
  stone: [
    "THE IMMORTALITY STONE. Smaller than you thought. Warm. Beating, very slowly, like a heart with all the time in the world. Kings have killed for it. A king died for it, and then refused to stay dead. It is the most valuable thing in the world and it fits in your hand and it is, somehow, a little bit lonely.",
  ],
});
Object.assign(GONZO.states, {
  specs: "Perched on its nose: a pair of small round spectacles, much too fine for a goblin. That's the old man's. That's the old man's and it's wearing them.",
  charging: "It is DRAWING BREATH. Its chest glows like a furnace door. Whatever it can see in a moment is going to burn. Get behind something solid. Now.",
  spent: "It's exhausted: sagging, panting, smoke curling from its jaws. This is the moment. This is the only moment. Hit it with everything.",
});
GONZO.tomes = {
  fire: [
    "FIRE. The book bursts open in your hands and the words climb up your arms like sparks on dry paper. Now you can throw a ball of roaring orange that keeps burning after it lands. It lights torches. It clears brambles. It sets things that hate fire on fire. Grukka kept it under her pillow. I don't want to know why.",
  ],
  lightning: [
    "LIGHTNING. The pages crackle and every hair on your body stands up to see what's going on. Now you can throw a bolt of the sky's own bad temper. It hits everything in a line, and if it touches water, the WHOLE POOL lights up and everything in it learns a lesson. Including you, if you're standing in it.",
  ],
  frost: [
    "FROST. The book frosts over in your hands and the cold goes straight into your bones and stays there, comfortable, like a cat. Now you can freeze. Monsters freeze solid and shatter when struck. Water becomes a bridge. Lava becomes a road. Even a dragon slows down for a moment.",
  ],
};
GONZO.tomeFacts = {
  fire:'Press 1, then aim. Burns over time, lights torches, clears brambles and webs.',
  lightning:'Press 2, then aim. Arcs from each monster it hits to the ones beside it. Electrifies whole pools of water. Shatters ice walls.',
  frost:'Press 3, then aim. Freezes monsters, water and lava. Frozen things are easy to hit, and take double from blades.',
};
GONZO.endings = {
  keep: "And so you kept it: forever, warm in your pocket, beating slowly. You will see a great many fires. You will sit by most of them. You will ask the people there a question, and you will listen to the answer, all the way to the end, because you have the time. Somewhere, a kettle is on. There always will be.",
  give: "You offered forever to an old man, and he laughed, and gave it back, and the two of you climbed a very great many stairs together, slowly, because of his knees. You don't remember what you did with the stone in the end. You remember the climb. You remember every word.",
  leave: "You left forever on the floor of a dead king's tomb, still beating, all on its own. Then you climbed back up into the daylight with an old man who talks too much, and it was the best decision you ever made, and you knew it at the time, which almost never happens.",
};

// ---- the fourth spell, from the dragon's hoard
GONZO.tomes.holy = [
  "HOLY. The book is warm, warmer than the dragon that sat on it, and when it opens there is a sound like a great many people a very long way off, all singing the same note. Now you can call down light: a pillar of it, falling from somewhere impossibly high. The living feel it like sun on the back of the neck. The dead BURN.",
];
GONZO.tomeFacts.holy = 'Press 4, then aim. A pillar of light: undead in it burn, and keep burning for a few turns. The living are unharmed.';
GONZO.hud.holy = [
  "HOLY: light from above, the real thing, the kind painters spend whole lives failing to get right. It does nothing to the living but warm them. To the dead it is a verdict. The tomb is full of the dead. Do the arithmetic.",
  "The fourth spell. Skeletons, zombies, spectres, knights in armour that laughs at fire: none of them have an answer for this. Neither, I suspect, does the king.",
];
