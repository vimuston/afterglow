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
  VENT: [
    "A steam vent, hissing like an angry radiator in a cheap motel, spitting scalding fog at the ceiling. The earth's pressure valve. Nobody here knows what happens if it's ever shut off. Nobody wants to.",
    "A crack in the world exhaling boiling breath. Every few seconds it sighs, very loudly, like a man who has just been asked to explain himself and cannot.",
  ],
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
};
