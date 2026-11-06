'use strict';
// =====================================================================
//  The old man.
//
//  A conversation is a list of steps:
//    'text'                     he says a page
//    {s, face}                  a page with an expression (happy/think/sad/wink)
//    {act}                      a stage direction (no voice)
//    {f: m => 'text'}           a page built from what you've told him
//    {q, opts:[{t, r, set, fx}]} he asks; you answer; r = his reply steps
//    {input:'name', q, r}       you type something
//    {fx: () => ...}            something happens
//    {when: m => bool, then, else}
//  {name} and other {memory} keys are filled in.
// =====================================================================

const WHY = {down:'you were looking for the way down', unknown:"you didn't know why you'd come",
             running:'you were running from something', light:'you just followed the light in my window'};
const PROUD = {made:'something you made', helped:'someone you helped', here:'simply still being here',
               none:"nothing at all — and we both know that wasn't true"};
const BELIEVER = {teacher:'a teacher believed in you first', family:'your family believed in you first',
                  friend:'a friend believed in you first', nobody:"nobody had — and I told you that answer was wrong now"};

const CHAPTERS = [
  // ------------------------------------------------------------------ 0: the kettle
  [
    {act:'An old man looks up from a crackling hearth. His eyes are bright and very kind.'},
    {s:"Oh! A visitor. Forgive me, I don't get many. Not ones who knock, anyway.", face:'happy'},
    "Come in out of the weather. Sit, sit. That chair is the good one. The other one bites.",
    {act:'He sets a dented kettle on the fire. It begins, very quietly, to sing.'},
    "There. Kettle's on. Now then.",
    {input:'name', q:"What do they call you, traveller?", r:[
      {f: m => m.name === 'friend'
        ? "Fair enough. Names are heavy things to hand a stranger. I'll call you 'friend' until you decide otherwise."
        : `${m.name}. That's a good name. It sits right in the mouth, like a warm stone.`, face:'happy'},
    ]},
    "I'm nobody important. Just an old man who keeps a fire going. But I've learned one thing, living out here at the edge of everything.",
    {s:"People who wander in through that door usually aren't lost. They're looking. Not always for the thing they think they're looking for.", face:'think'},
    {q:"So. What brought you all the way out here?", opts:[
      {t:"I'm looking for the way down.", set:{why:'down'}, r:[
        "The way down. Past the mire, up through the cold pass, under the mountain where the rock runs red.",
        {s:"It's a long road. Most people who ask about it already know that. They ask anyway. That's something.", face:'happy'}]},
      {t:"I don't really know.", set:{why:'unknown'}, r:[
        {s:"Ha! Good. That's the most honest answer anyone's given me in years.", face:'happy'},
        "'I don't know' is a door, not a wall. You'll see."]},
      {t:"I'm running from something.", set:{why:'running'}, r:[
        {s:"Mm. Running is just walking with worry on your back.", face:'sad'},
        "I won't ask from what. Not yet. But you're safe here for a while. The fire doesn't care what you're running from."]},
      {t:"I just followed the light.", set:{why:'light'}, r:[
        "You saw the window. I keep the lamp in it for exactly that reason.",
        {s:"Some nights I wonder if anyone will ever follow it. And here you are.", face:'happy'}]},
    ]},
    {q:"Tell me, when you came up through those cellars, with all those creatures snapping at your heels... were you afraid?", opts:[
      {t:"Terrified.", set:{fear:'terrified'}, r:[
        "Good. Fear means you understood what was at stake. Only fools aren't afraid.",
        {s:"The brave ones are just the frightened ones who kept walking.", face:'happy'}]},
      {t:"No. Not really.", set:{fear:'no'}, r:[
        {s:"No? Then perhaps you're braver than you give yourself credit for.", face:'think'},
        "Or perhaps you've been afraid so long it just feels like weather. Either way, you came through."]},
      {t:"I'm always a little afraid.", set:{fear:'always'}, r:[
        {s:"Me too. Seventy-odd years, and I still check under the bed.", face:'wink'},
        "Being a little afraid all the time is exhausting, isn't it? You're allowed to put it down here, by the fire. Just for a bit."]},
    ]},
    {act:'He tears a heel off a loaf and hands it to you. It is still faintly warm.'},
    {s:"Bread. It's yesterday's, but yesterday was a good day, so it should be fine.", face:'happy'},
    "Go on, then. The world won't explore itself. But come back and see me now and then.",
    {f: m => `I'd like to hear what you find out there, ${m.name}. And what you find in yourself, too.`, face:'happy'},
    {fx: () => chapterReward(0)},
  ],

  // ------------------------------------------------------------------ 1: what you carry
  [
    {f: m => `${m.name}! You came back. I hoped you would. I made too much soup on purpose.`, face:'happy'},
    {when: m => m.visited[Z.MIRE], then:["You smell like the mire. Don't apologise. Everybody does, after."]},
    {when: m => m.kills >= 5, then:[{s:"And you've been in a scrap or two, I see. Sit. Let's look at you.", face:'think'}]},
    {act:'He ladles soup into two chipped bowls and sits down across from you.'},
    {q:"Tell me something. What's the thing you're proudest of? Not the big impressive thing. The real one.", opts:[
      {t:"Something I made.", set:{proud:'made'}, r:[
        "Ah, a maker. Then you already know the secret: everything worthwhile starts out looking wrong.",
        {s:"The first draft of anything is just courage wearing a messy coat.", face:'happy'}]},
      {t:"Someone I helped.", set:{proud:'helped'}, r:[
        {s:"That's the one that counts.", face:'happy'},
        "Long after the trophies rust, somebody out there is still a little bit better because of you. Hold on to that."]},
      {t:"That I'm still here.", set:{proud:'here'}, r:[
        {s:"...Yes. Yes, that's the proudest thing of all, isn't it.", face:'sad'},
        "Getting up on the days the floor felt like the ceiling. Not everyone counts that as an achievement. It is.",
        {s:"I'd give you a medal if I had one. I have a spoon. Here. Take the spoon.", face:'wink'},
        {act:'He presses a small wooden spoon into your hand. It is very well loved.'},
        {fx: () => { state.mem.spoon = true; log('You received: a wooden spoon. (It does nothing. It is perfect.)', [.95,.85,.6]); }}]},
      {t:"I can't think of anything.", set:{proud:'none'}, r:[
        "That's alright. Sometimes the pride is buried under a lot of other things.",
        {s:"We'll dig for it together. I've got a whole shed full of shovels.", face:'wink'}]},
    ]},
    {q:"And what are you carrying with you that's heavy? You don't have to tell me what it is. Just how heavy.", opts:[
      {t:"Light. I'm alright.", set:{heavy:'light'}, r:[
        {s:"Then I'm glad. Truly. Light days are worth noticing.", face:'happy'},
        "Write them down, if you can. They're good evidence for later, for the days that aren't."]},
      {t:"Heavy. Some days too heavy.", set:{heavy:'heavy'}, r:[
        {s:"Thank you for telling me. I mean that.", face:'sad'},
        "Heavy things get a little lighter when someone else knows they exist.",
        "I can't carry it for you. But I can walk beside you while you do. That's allowed, you know. Being walked beside."]},
      {t:"I don't want to talk about it.", set:{heavy:'secret'}, r:[
        "Then we won't. A fire doesn't need conversation to be warm. We'll just sit a moment.",
        {act:'The fire pops. The kettle hums. Neither of you says anything for a while, and that is fine.'},
        {s:"...There. That's enough. Thank you for sitting with me.", face:'happy'}]},
    ]},
    {f: m => `You know what I notice about you, ${m.name}? You keep going.`},
    "You came through the dark with nothing but a few sparks in your hands. That's not nothing. That's not nothing at all.",
    {act:'He squints at you over the rim of his bowl.'},
    {s:"Hold still. Let me look at you. ...Yes. You're stronger than when you first walked in. I can see it in your shoulders.", face:'happy'},
    {fx: () => chapterReward(1)},
  ],

  // ------------------------------------------------------------------ 2: small lights
  [
    {s:"Back again! The kettle's learned your footsteps. It started whistling before you knocked.", face:'happy'},
    {when: m => m.visited[Z.MIRE], then:[
      "So. You've been through the mire. Did you see the little lights out there? The fireflies?",
      {s:"People think they're guiding you somewhere. They're not. They're just being lights. That's enough, for a firefly.", face:'think'}],
     else:[
      "Have you been to the mire yet? South of the cellars, where the fog lives. There are fireflies out there.",
      {s:"Little things, just being lights. Remember them when you see them. They matter more than they know.", face:'think'}]},
    {q:"Who was the first person who believed in you?", opts:[
      {t:"A teacher.", set:{believer:'teacher'}, r:[
        "Teachers. They plant trees they'll never sit under.",
        {s:"I hope you got to tell them. If you didn't, it's not too late to tell someone like them.", face:'happy'}]},
      {t:"My family.", set:{believer:'family'}, r:[
        "Then you were given something precious early.",
        {s:"Even if it got complicated later, and it always gets complicated, that first belief is still in you. Like a seed in a coat pocket.", face:'happy'}]},
      {t:"A friend.", set:{believer:'friend'}, r:[
        "The ones we choose. And who choose us back.",
        {s:"A friend who believes in you is proof you're worth believing in. They had no obligation, after all.", face:'happy'}]},
      {t:"Nobody, really.", set:{believer:'nobody'}, r:[
        {s:"...Then I'm sorry. That's a cold way to grow up.", face:'sad'},
        "But listen to me. Are you listening?",
        {s:"I believe in you. There. Now that answer's wrong. You can't use it anymore.", face:'happy'}]},
    ]},
    {f: m => `Do you believe in yourself, ${m.name}? Honest answer. I'll know. I always know. It's very inconvenient.`, face:'think'},
    {q:"Well?", opts:[
      {t:"Yes.", set:{selfBelief:'yes'}, r:[
        {s:"Then hold on tight to it. The world will try to borrow it and forget to give it back.", face:'happy'}]},
      {t:"Sometimes.", set:{selfBelief:'sometimes'}, r:[
        "Sometimes is the truest answer there is.",
        {s:"Belief isn't a stone you own. It's a fire you tend. Some days it roars. Some days it's one ember. You just keep feeding it.", face:'think'}]},
      {t:"Not anymore.", set:{selfBelief:'lost', lost:true}, r:[
        {s:"'Not anymore.' That means you did, once.", face:'sad'},
        "Which means it isn't gone. It's misplaced. Like my spectacles. Which are, I'm told, usually on my head.",
        {s:"We'll find it. That's what this is, you and me. A search party.", face:'happy'}]},
    ]},
    "Close your eyes a moment. No, really. Humour an old man.",
    {act:'You close your eyes. The fire is warm on one side of your face.'},
    "Now think of one small thing you did today that took courage. Even a tiny one. Got it?",
    {s:"Keep it. That's a firefly. Collect enough of them and you can see in the dark.", face:'happy'},
    {fx: () => chapterReward(2)},
  ],

  // ------------------------------------------------------------------ 3: falling
  [
    {f: m => `${m.name}. Come, sit. You look like you've been arguing with a mountain.`},
    {when: m => m.visited[Z.PASS], then:[
      {s:"The pass is cruel this time of year. I lost two toes up there in my youth.", face:'think'},
      {s:"Well, 'lost.' I know exactly where they are. They're up there.", face:'wink'}],
     else:["There's a pass east of the mire, up where the snow never quite leaves. You'll see it soon. Bring a scarf. Bring two."]},
    {act:'He stirs his tea for longer than tea needs stirring.'},
    {q:"Tell me about a time you failed. A real one. The kind that still stings.", opts:[
      {t:"I let someone down.", set:{fail:'someone'}, r:[
        {s:"Ah. That's the one that keeps us up at night.", face:'sad'},
        "Here's what an old man knows: if it still hurts, it's because you cared. People who don't care sleep just fine.",
        {s:"Your sting is a sign of your good heart, not your bad one.", face:'happy'}]},
      {t:"I gave up on a dream.", set:{fail:'dream'}, r:[
        {s:"Did you give it up? Or did you set it down to carry something else for a while?", face:'think'},
        "There's a difference. Dreams are patient. They wait in the cupboard, like good jam."]},
      {t:"I fail all the time.", set:{fail:'always'}, r:[
        {s:"So do I! I burnt the toast this morning. I burnt it yesterday, too.", face:'happy'},
        "I'm a tremendous failure at toast. And yet: still here. Still trying toast.",
        "Failing all the time means you're trying all the time. Most people stopped trying years ago."]},
    ]},
    {q:"If you could say one thing to the you from back then, the one who fell, what would it be?", opts:[
      {t:"It wasn't your fault.", r:[
        "Say it again. Slower.",
        {act:'You say it again, slower.'},
        {s:"Do you hear how true that sounds, out loud?", face:'happy'}]},
      {t:"You'll get through this.", r:[
        {s:"And you did. Look at that. You're the proof.", face:'happy'},
        "You're standing in my kitchen, dripping on my rug. Proof."]},
      {t:"I'm sorry.", r:[
        {s:"Apologising to yourself. That's one of the bravest things a person can do.", face:'sad'},
        "Most of us are far kinder to strangers than to the one in the mirror. Be a stranger to yourself, if it helps."]},
      {t:"I don't know.", r:[
        "Then let me lend you one: 'You were doing your best with what you had.'",
        {s:"It fits almost everybody. It certainly fit me.", face:'happy'}]},
    ]},
    {f: m => `You know what falling is, ${m.name}? It's the part right before getting back up. Every single time.`},
    {s:"Nobody in the whole history of the world has ever gotten back up without falling first. Think about that.", face:'think'},
    {fx: () => chapterReward(3)},
  ],

  // ------------------------------------------------------------------ 4: if you weren't afraid
  [
    {s:"There you are! I was just telling the cat about you.", face:'happy'},
    {s:"We don't have a cat. I was telling the space where a cat would be.", face:'wink'},
    {q:"What would you do with your life, if you knew you couldn't fail?", opts:[
      {t:"Make something beautiful.", set:{dream:'make'}, r:[
        "Then make it. Badly at first. Then less badly.",
        {s:"The world needs your beautiful thing. It doesn't have it yet. Only you can make that particular one.", face:'happy'}]},
      {t:"Help people.", set:{dream:'help'}, r:[
        {s:"You've already started. You came all this way and listened to an old man ramble. That's helping.", face:'happy'},
        "You'd be surprised how much of the world is held together by people who simply listened."]},
      {t:"Go somewhere far away.", set:{dream:'far'}, r:[
        "Then go! The road is long, but roads are like that.",
        {s:"They're also full of people like me with kettles. You'll never be as alone out there as you fear.", face:'happy'}]},
      {t:"Rest. Really rest.", set:{dream:'rest'}, r:[
        {s:"Oh, that's the wisest answer of all.", face:'happy'},
        "Rest isn't the opposite of courage. Sometimes it is courage. You're allowed to rest without earning it first."]},
    ]},
    {q:"And what's stopping you? Honestly.", opts:[
      {t:"I'm not good enough.", r:[
        {s:"Who told you that? No, really. Whose voice is that?", face:'think'},
        {s:"Because it isn't yours. I've heard your voice. Your voice is kinder than that.", face:'happy'}]},
      {t:"I'm scared.", r:[
        "Of course you are. Do it scared.",
        {s:"Most of the best things ever done were done by someone whose hands were shaking.", face:'happy'}]},
      {t:"Nothing, maybe.", r:[
        {s:"...Then perhaps it's time. Isn't that a strange feeling?", face:'think'},
        "Like standing at the top of a hill, about to run down it."]},
    ]},
    {act:'He leans back. The chair creaks like it is laughing at a private joke.'},
    {s:"Here's my wager: the you who walks out that door today is braver than the one who walked in. I'd bet my last toe on it.", face:'happy'},
    {s:"Well. My last eight toes.", face:'wink'},
    {fx: () => chapterReward(4)},
  ],

  // ------------------------------------------------------------------ 5: believe
  [
    {f: m => `${m.name}. Sit with me one more time. I have one more question, and then I'll stop pestering you. Probably.`},
    {act:'He takes a small, battered notebook from his coat. Every page is full.'},
    "I've been keeping notes. Not on what you've done. On who you are.",
    {f: m => `When you first came in, you told me ${WHY[m.why] || 'very little'}.`},
    {f: m => `You told me you were proudest of ${PROUD[m.proud] || 'something you kept to yourself'}.`},
    {f: m => `You told me ${BELIEVER[m.believer] || 'about who believed in you'}.`},
    {f: m => m.echo ? `And you told me, out there in the weather, ${m.echo}.` : "And out there in the weather, you kept listening, even when I wasn't around."},
    {q:"Do you want to hear what I wrote at the bottom?", opts:[
      {t:"Yes.", r:[]}, {t:"...Okay.", r:[]}, {t:"I'm a bit scared to.", r:[{s:"That's alright. It's a good list. I promise.", face:'happy'}]}]},
    {s:"You're brave. You walked into the dark more than once.", face:'happy'},
    {s:"You're kind. You came back to visit an old man who talks too much.", face:'happy'},
    {s:"You're honest. You told me hard things.", face:'happy'},
    {s:"And you're still here.", face:'sad'},
    {f: m => `So I'll ask you again, the way I asked before. Do you believe in yourself, ${m.name}?`, face:'think'},
    {q:"Do you?", opts:[
      {t:"Yes. I think I do.", r:[{s:"There it is. I knew it was in there. I just had to keep the kettle on long enough.", face:'happy'}]},
      {t:"I'm starting to.", r:[{s:"Starting is the whole thing. Every fire starts as a spark that decided not to go out.", face:'happy'}]},
      {t:"I believe that you believe in me.", r:[
        {s:"Ha! That'll do for now. Borrow mine. Keep it as long as you need.", face:'happy'},
        "Belief is the only thing I know of that grows when you give it away."]},
    ]},
    {act:'He closes the notebook and, very gently, puts it in your hands.'},
    "Now go. Down through the red rock and out the other side.",
    {s:"And when you get wherever you're going, find somebody sitting alone by a fire... and ask them a question.", face:'think'},
    {s:"That's how it gets passed along, you see. It always has been. Somebody asked me, once.", face:'happy'},
    {fx: () => chapterReward(5)},
  ],
];

// questions that drift back to you while you're out exploring
const ECHOES = [
  {when: () => weatherIs('rain'), q:"Do you like the sound of rain?", opts:[
    {t:"I love it.", echo:'that you love the sound of rain', r:["Then stand in it a moment. It's playing for you."]},
    {t:"It makes me sad.", echo:'that rain makes you a little sad', r:["\"Sad is alright,\" he'd say. \"Rain is just the sky being honest.\""]},
    {t:"I hadn't noticed.", echo:"that you hadn't noticed the rain until he asked", r:["You notice it now: every leaf ticking like a tiny clock."]}]},
  {when: () => weatherIs('snow'), q:"When did you last catch snow on your tongue?", opts:[
    {t:"Just now, actually.", echo:'that you caught snow on your tongue', r:["Good. Never get too old for that. He never did."], heal:2},
    {t:"Years ago.", echo:"that it had been years since you caught snowflakes", r:["You tip your head back. It's cold and tastes of nothing and it is wonderful."], heal:2}]},
  {when: () => weatherIs('wind'), q:"Which way is the wind telling you to go?", opts:[
    {t:"Forward.", echo:'that the wind was telling you to go forward', r:["Then lean into it. It's only pushing because it believes you can stand."]},
    {t:"Home.", echo:'that the wind was blowing you home', r:["\"Home isn't behind you,\" he'd say. \"It's wherever someone's kept the kettle on.\""]}]},
  {q:"What's one thing you can see right now that's beautiful?", opts:[
    {t:"The way the light moves.", echo:'that the light was beautiful', r:["You make a note of it. He'd like that."]},
    {t:"Nothing, right now.", echo:"that you couldn't see anything beautiful, and then you looked again", r:["...Then look again. Slowly. There's always one thing.", "You find a small one. It counts."]}]},
  {q:"When did you last laugh until it hurt?", opts:[
    {t:"Not long ago.", echo:'that you laughed until it hurt, not long ago', r:["Hold on to whoever was there. People who make us laugh like that are rare treasure."]},
    {t:"I can't remember.", echo:"that you couldn't remember the last time you laughed", r:["\"Then you're overdue,\" he'd say. \"Laughter is like rain. It comes back.\""]}]},
  {q:"Who would you call right now, if you could call anyone?", opts:[
    {t:"Someone I miss.", echo:'that there is someone you miss', r:["Missing someone is love with nowhere to go. Maybe one day you'll give it somewhere."]},
    {t:"Someone I owe an apology.", echo:'that there is an apology you mean to make', r:["\"It's rarely too late,\" he'd say. \"Doors are usually heavier from the inside.\""]},
    {t:"Nobody.", echo:'that there was nobody you wanted to call', r:["\"Well, you can always call on me,\" he'd say. \"I'm terrible at answering, but I'm always home.\""]}]},
  {q:"If your courage were a dog, what would you name it?", opts:[
    {t:"Biscuit.", echo:'that your courage is a dog called Biscuit', r:["Biscuit. A good, loyal name. Biscuit would follow you anywhere."]},
    {t:"Thunder.", echo:'that your courage is a dog called Thunder', r:["Thunder. Loud, a bit scary, secretly afraid of the hoover. Perfect."]},
    {t:"It's a cat, actually.", echo:'that your courage is, in fact, a cat', r:["Of course it is. It shows up when it wants to, and pretends it was always there."]}]},
  {q:"What did you want to be, when you were small?", opts:[
    {t:"Something brave.", echo:'that you wanted to be something brave when you were small', r:["Look at you now. Walking into the dark with sparks in your hands. Little you would be thrilled."]},
    {t:"Something gentle.", echo:'that you wanted to be something gentle when you were small', r:["Gentle is a kind of strength that doesn't need to shout. You still have it. It's in how you walk."]},
    {t:"I don't remember.", echo:"that you'd forgotten what you wanted to be", r:["That's alright. Small you still remembers. Small you is very patient."]}]},
  {q:"Is it alright to be tired?", opts:[
    {t:"Yes.", echo:"that it's alright to be tired", r:["It is. You rest a moment and catch your breath."], heal:3},
    {t:"Not for me.", echo:'that you thought being tired was for other people', r:["\"Especially for you,\" he'd say, and you'd almost hear him tut.", "You rest a moment anyway."], heal:3}]},
  {q:"What's the kindest thing anyone ever said to you?", opts:[
    {t:"That they were proud of me.", echo:"that someone once told you they were proud of you", r:["Say it to yourself sometime. It's still true. It always was."]},
    {t:"That I'm enough.", echo:"that someone once told you you're enough", r:["You are. Not 'will be.' Are."]},
    {t:"I'm still waiting.", echo:"that you're still waiting for someone to say something kind", r:["Then here it is, from him, from very far away: you're doing better than you think."]}]},
  {q:"What are you looking forward to?", opts:[
    {t:"Seeing what's at the bottom.", echo:"that you're looking forward to what's at the bottom", r:["Curiosity is just hope wearing walking boots."]},
    {t:"A warm bed.", echo:'that you are looking forward to a warm bed', r:["A noble goal. Possibly the noblest."]},
    {t:"I don't know yet.", echo:"that you didn't know what you were looking forward to yet", r:["\"Yet,\" he'd say, delighted. \"Did you hear yourself? You said 'yet'.\""]}]},
  {q:"If your heart could talk right now, what would it say?", opts:[
    {t:"Keep going.", echo:'that your heart says keep going', r:["Then listen to it. It's been on your side the whole time."]},
    {t:"Slow down.", echo:'that your heart asked you to slow down', r:["You slow down. Just a little. Your breath comes easier."], heal:2},
    {t:"Thank you.", echo:'that your heart wanted to say thank you', r:["...You weren't expecting that. Neither was your heart. It's a nice surprise."]}]},
  {q:"What would you tell a friend who felt the way you feel?", opts:[
    {t:"That it gets better.", echo:'that it gets better', r:["Then you know it. Maybe try believing it about yourself, too. Just a little."]},
    {t:"That I'm here for them.", echo:"that you'd be there for a friend who felt like you", r:["Be that friend to yourself today. You deserve the same company."]}]},
  {q:"Did you eat today? Properly?", opts:[
    {t:"Yes.", echo:'that you had eaten properly', r:["Good. He'd be pleased. He'd also offer you more."]},
    {t:"Not really.", echo:"that you hadn't eaten properly, so you did", r:["You find his bread in your pack, wrapped in a cloth. When did he put that there?"], heal:5}]},
  {q:"What's something you've forgiven yourself for?", opts:[
    {t:"Something small.", echo:"that you've forgiven yourself something small", r:["Small forgiveness is practice for the big ones. You're getting good at it."]},
    {t:"Nothing yet.", echo:"that you haven't forgiven yourself yet", r:["\"Yet,\" he'd say again. \"I'm hearing a lot of 'yet' from you. I like it.\""]}]},
];

// things he says when there's no new chapter to tell
const IDLE = [
  "Back already? The soup's not ready. It's never ready. That's the trick with soup.",
  "Go on, the mire won't wade itself. Come back when you've got stories.",
  "Did you know frost and fire are cousins? They don't get on at family dinners.",
  "If you're standing in water and the sky starts crackling, get out of the water. That's not wisdom, that's just physics.",
  "You're doing well. I don't say that lightly. I hardly say anything lightly. I'm very heavy-handed.",
  "My wife used to say: 'Courage is just love with its boots on.' She was usually right. It was very annoying.",
  "Those beasts in the Ember Deeps hate the cold. You've got frost in your fingers. Use it.",
  "When everything's too big, do the next small thing. Then the next. That's how I built this house. One stone. A nap. Another stone.",
  "You don't have to be fearless. You just have to be a little braver than your fear. A little is plenty.",
  "Wolves in the pass travel fast. Don't run. Let them come to you, and give them a good fright.",
  "That old frog in the mire owes me money. If you see him, don't mention it. He's sensitive.",
  "The trolls in the mire mend themselves unless you burn them. Not that I'm encouraging arson. I'm encouraging arson.",
  "The river of fire in the Deeps doesn't care how brave you are. But frost will make it a floor.",
  "I talk to the kettle when you're gone. It's a good listener. Not as good as you.",
  "Sit a moment. There. Doesn't that feel better?",
  "If you ever feel small out there, remember: so is a seed.",
  "Everybody's a beginner at something, every single day. Today I'm a beginner at being seventy-eight.",
  "The lamp stays in the window whether you come back or not. But it's nicer when you do.",
];
const IDLE_WEATHER = {
  rain: "Listen to that rain. Best music there is. And free, too.",
  snow: "Snow makes the world quiet, so you can hear yourself think. What's it saying, in there?",
  wind: "Wind's up. Hold on to your hat. Or your hair. Or your dreams. I'm not fussy.",
  storm:"Thunder! Stay indoors a minute. Even heroes are allowed to wait out a storm.",
};

// =====================================================================
//  Dialogue runner + UI
// =====================================================================
const PORTRAIT = [
  "     .---.     ",
  "   .'     '.   ",
  "  /  B   C  \\  ",
  "  |  L   R  |  ",
  "  |    >    |  ",
  "  \\ ~~MMM~~ /  ",
  "   (~~~~~~~)   ",
  "    (~~~~~)    ",
  "     `~~~'     ",
];
let dlg = null;

const Dialog = {
  active: () => !!dlg,
  fill(text){ const m = state.mem; return String(text).replace(/\{(\w+)\}/g, (_, k) => m[k] ?? ''); },

  open(steps, kind = 'man', onClose = null){
    dlg = {kind, queue:steps.slice(), cur:null, shown:0, wait:0, blink:0, face:'neutral', onClose, sel:0, buf:''};
    state.travel = null; state.targeting = null;
    Dialog.next();
  },
  close(){
    const cb = dlg && dlg.onClose; dlg = null;
    if (cb) cb();
  },
  next(){
    const m = state.mem;
    while (dlg && dlg.queue.length) {
      let st = dlg.queue.shift();
      if (st.fx) { st.fx(); continue; }
      if (st.when) { const branch = st.when(m) ? st.then : st.else; if (branch) dlg.queue.unshift(...branch); continue; }
      if (typeof st === 'string') st = {s:st};
      if (st.f) st = {s:st.f(m), face:st.face};
      let type = st.act ? 'act' : st.q && st.input ? 'input' : st.q ? 'ask' : 'say';
      const text = Dialog.fill(st.act || st.q || st.s);
      const width = dlg.kind === 'man' ? 39 : 52, maxLines = dlg.kind === 'man' ? 6 : 4;
      let lines = wrap(text, width);
      if (lines.length > maxLines && type !== 'ask' && type !== 'input') {   // too long: split into two pages
        dlg.queue.unshift({...st, s:lines.slice(maxLines).join(' '), act:st.act ? lines.slice(maxLines).join(' ') : undefined});
        lines = lines.slice(0, maxLines);
      }
      dlg.cur = {type, st, lines, total:lines.join('').length};
      dlg.shown = 0; dlg.sel = 0; dlg.wait = 0;
      if (st.face) dlg.face = st.face; else if (type !== 'act') dlg.face = 'neutral';
      if (type === 'input') dlg.buf = '';
      return;
    }
    Dialog.close();
  },
  done: () => dlg && dlg.shown >= dlg.cur.total,
  choose(i){
    const c = dlg.cur, o = c.st.opts[i]; if (!o) return;
    Snd.page();
    if (o.set) Object.assign(state.mem, o.set);
    if (o.echo) state.mem.echo = o.echo;
    if (o.heal) healPlayer(o.heal, true);
    if (o.fx) o.fx();
    dlg.queue.unshift(...(o.r || []));
    Dialog.next();
  },
  submitInput(){
    const name = dlg.buf.trim();
    state.mem.name = name ? name[0].toUpperCase() + name.slice(1) : 'friend';
    Snd.page();
    dlg.queue.unshift(...(dlg.cur.st.r || []));
    Dialog.next();
  },
  advance(){
    if (!dlg) return;
    if (!Dialog.done()) { dlg.shown = dlg.cur.total; return; }
    if (dlg.cur.type === 'ask' || dlg.cur.type === 'input') return;
    Snd.page(); Dialog.next();
  },

  update(dt){
    if (!dlg) return;
    dlg.blink -= dt; if (dlg.blink < -.12) dlg.blink = 2 + rnd() * 3;
    if (Dialog.done()) return;
    if (dlg.wait > 0) { dlg.wait -= dt; return; }
    const cps = dlg.cur.type === 'act' ? 70 : 48;
    const before = Math.floor(dlg.shown);
    dlg.shown = Math.min(dlg.cur.total, dlg.shown + dt * cps);
    const flat = dlg.cur.lines.join('');
    for (let k = before; k < Math.floor(dlg.shown); k++) {
      const ch = flat[k];
      if ('.?!'.includes(ch) && flat[k + 1] !== '.' ) { dlg.wait = .22; dlg.shown = k + 1; break; }
      if (ch === ',') dlg.wait = .08;
      if (dlg.cur.type !== 'act' && k % 2 === 0 && ch !== ' ') Snd.talk(ch.charCodeAt(0), dlg.kind);
    }
  },

  key(ev){
    const k = ev.key;
    ev.preventDefault();
    if (!dlg) return;
    const c = dlg.cur;
    if (c.type === 'input' && Dialog.done()) {
      if (k === 'Enter') Dialog.submitInput();
      else if (k === 'Backspace') dlg.buf = dlg.buf.slice(0, -1);
      else if (k.length === 1 && /[\p{L}\p{N} '\-]/u.test(k) && dlg.buf.length < 14) { dlg.buf += k; Snd.talk(k.charCodeAt(0), 'man'); }
      return;
    }
    if (c.type === 'ask' && Dialog.done()) {
      const n = c.st.opts.length;
      if (/^[1-9]$/.test(k) && +k <= n) return Dialog.choose(+k - 1);
      if (k === 'ArrowUp' || k === 'k' || k === 'w') { dlg.sel = (dlg.sel + n - 1) % n; Snd.blip(); }
      if (k === 'ArrowDown' || k === 'j' || k === 's') { dlg.sel = (dlg.sel + 1) % n; Snd.blip(); }
      if (k === 'Enter' || k === ' ') Dialog.choose(dlg.sel);
      return;
    }
    if (k === ' ' || k === 'Enter' || k === 'Escape' || k === '.') Dialog.advance();
  },
  // screen-grid hit testing for mouse
  hover(sx, sy){
    if (!dlg || dlg.cur.type !== 'ask' || !Dialog.done()) return;
    const r = Dialog.optRows();
    const i = r.findIndex(o => sy === o.row && sx >= o.c0 && sx < o.c1);
    if (i >= 0 && i !== dlg.sel) { dlg.sel = i; }
  },
  click(sx, sy){
    if (!dlg) return;
    const c = dlg.cur;
    if (c.type === 'ask' && Dialog.done()) {
      const i = Dialog.optRows().findIndex(o => sy === o.row && sx >= o.c0 && sx < o.c1);
      if (i >= 0) Dialog.choose(i);
      return;
    }
    if (c.type === 'input' && Dialog.done()) { Dialog.submitInput(); return; }
    Dialog.advance();
  },
  layout(){
    return dlg.kind === 'man' ? {top:14, bot:VH - 1, tx:19, ty:16, w:39, oy:23} : {top:19, bot:VH - 1, tx:4, ty:21, w:52, oy:25};
  },
  optRows(){
    const L = Dialog.layout(), c = dlg.cur;
    return c.st.opts.map((o, i) => ({row:L.oy + i, c0:L.tx, c1:L.tx + 4 + o.t.length}));
  },

  draw(t){
    if (!dlg) return;
    const L = Dialog.layout(), c = dlg.cur, man = dlg.kind === 'man';
    const frame = man ? [.75,.68,.95] : [.55,.75,.7];
    // dim the world behind, then the panel
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, SW, VH * TH);
    ctx.fillStyle = 'rgba(2,3,4,.93)'; ctx.fillRect(TW * .5, L.top * TH + TH * .5, SW - TW, (L.bot - L.top) * TH);
    const fc = frame.map(v => v * .7);
    scrText(1, L.top, '┌' + '─'.repeat(VW - 4) + '┐', fc);
    for (let r = L.top + 1; r < L.bot; r++) { scrText(1, r, '│', fc); scrText(VW - 2, r, '│', fc); }
    scrText(1, L.bot, '└' + '─'.repeat(VW - 4) + '┘', fc);
    const title = man ? ` ${state.mem.knowsName ? 'ELI' : 'THE OLD MAN'} ` : ' ~ a question drifts back to you ~ ';
    scrText(man ? 4 : Math.floor((VW - title.length) / 2), L.top, title, frame);

    if (man) Dialog.drawPortrait(t);

    // text with typewriter
    const col = c.type === 'act' ? [.55,.62,.6] : man ? [.92,.9,1] : [.75,.95,.85];
    let left = Math.floor(dlg.shown);
    c.lines.forEach((ln, i) => {
      const s = ln.slice(0, Math.max(0, left)); left -= ln.length;
      scrText(L.tx, L.ty + i, s, col);
    });
    if (!Dialog.done()) return;
    if (c.type === 'ask') {
      c.st.opts.forEach((o, i) => {
        const sel = dlg.sel === i, pulse = .8 + .2 * Math.sin(t * 6);
        scrText(L.tx, L.oy + i, `${sel ? '▸' : ' '}${i + 1}. ${o.t}`, sel ? [1 * pulse, .9 * pulse, .55 * pulse] : [.55,.6,.55]);
      });
    } else if (c.type === 'input') {
      const cur = Math.sin(t * 8) > 0 ? '_' : ' ';
      scrText(L.tx, L.oy, '> ' + dlg.buf + cur, [1,.9,.55]);
      scrText(L.tx, L.oy + 2, '(type, then Enter. Leave blank to stay a stranger.)', [.4,.45,.42]);
    } else {
      const blink = Math.sin(t * 5) > 0;
      scrText(VW - 13, L.bot - 1, blink ? '[space] ▾' : '[space]  ', [.45,.5,.48]);
    }
  },
  drawPortrait(t){
    const talking = dlg.cur.type !== 'act' && !Dialog.done();
    const face = dlg.face, blink = dlg.blink < 0;
    const eye = blink ? '-' : face === 'happy' ? '^' : face === 'think' ? '°' : face === 'sad' ? '.' : 'o';
    const L = blink ? '-' : face === 'wink' ? '-' : eye, R = blink ? '-' : face === 'wink' ? '^' : eye;
    const brows = face === 'sad' ? ['/', '\\'] : face === 'think' ? ['~', '-'] : ['-', '-'];
    const mouth = talking ? ['_o_', '-O-', '___', '_o_'][Math.floor(t * 9) % 4]
                : face === 'happy' || face === 'wink' ? '\\_/' : face === 'sad' ? '_~_' : '___';
    const fl = flick(t, 3.3);
    const ox = 2, oy = 16;
    PORTRAIT.forEach((row, r) => {
      const line = row.replace('B', brows[0]).replace('C', brows[1]).replace('L', L).replace('R', R).replace('MMM', mouth);
      for (let k = 0; k < line.length; k++) {
        const ch = line[k]; if (ch === ' ') continue;
        const beard = ch === '~' && r >= 5;
        const warm = 1 + .35 * fl * (1 - k / line.length);   // lit by the hearth from the left
        let c = beard ? [.93,.93,1] : (ch === L || ch === R) && r === 3 ? [1,1,1] : [.82,.76,.95];
        if (r === 5 && k >= 6 && k <= 8) c = [1,.75,.7];
        c = [c[0] * warm, c[1] * (warm * .92 + .08), c[2] * (2 - warm) * .9];
        const jx = beard ? Math.sin(t * 2.2 + k * .9 + r) * 1.4 : 0;
        const jy = Math.sin(t * 1.3) * 1.2 + (talking && r >= 5 ? Math.sin(t * 18) * .8 : 0);
        ctx.fillStyle = css(c[0], c[1], c[2]);
        ctx.fillText(ch, (ox + k) * TW + TW / 2 + jx, (oy + r) * TH + TH / 2 + jy);
      }
    });
    // steam curling up from his tea
    for (let k = 0; k < 3; k++) {
      const ph = (t * .35 + k / 3) % 1, a = Math.sin(ph * PI);
      ctx.globalAlpha = a * .6; ctx.fillStyle = css(.6, .6, .65);
      ctx.fillText(k % 2 ? '~' : '°', (ox + 14) * TW + Math.sin(t * 2 + k * 2) * 4, (oy + 8 - ph * 3.5) * TH);
    }
    ctx.globalAlpha = 1;
  },
};

// ----- talking to him
function talkToOldMan(){
  const m = state.mem;
  const ready = m.ch === 0 || (m.ch < CHAPTERS.length && state.turn - m.lastTalk >= 18 && (m.ch < 5 || m.visited[Z.PASS] || m.visited[Z.DEEPS]));
  if (ready) {
    const ch = m.ch;
    Dialog.open(CHAPTERS[ch], 'man', () => { m.lastTalk = state.turn; m.met = true; if (!m.nextEcho) m.nextEcho = state.turn + 20; });
    return;
  }
  // idle chatter (+ a little rest)
  const lines = [];
  if (player.hp < player.maxhp * .5) {
    lines.push({s:`You're hurt, ${m.name}. Sit. No arguments.`, face:'sad'},
               {act:'He cleans your scrapes with warm water and something that smells of honey and pine.'},
               {fx: () => healPlayer(player.maxhp)});
  } else {
    const w = weatherIs('storm') ? 'storm' : weatherIs('rain') ? 'rain' : weatherIs('snow') ? 'snow' : weatherIs('wind') ? 'wind' : null;
    if (w && !m.saidWeather?.[w] && rnd() < .6) { (m.saidWeather ||= {})[w] = 1; lines.push({s:IDLE_WEATHER[w], face:'happy'}); }
    else { lines.push({s:IDLE[m.idleI % IDLE.length], face:pick(['happy','neutral','wink','think'])}); m.idleI++; }
    if (m.ch < CHAPTERS.length) lines.push(m.ch >= 5 && !m.visited[Z.PASS]
      ? "Go and see the pass, east of the mire. Then come back. I've one more question for you."
      : "Go on, have an adventure. I'll think of a good question while you're gone.");
    else lines.push({s:"I'm proud of you. That's all. Go on.", face:'happy'});
    lines.push({fx: () => healPlayer(4, true)});
  }
  Dialog.open(lines, 'man');
}

function maybeEcho(){
  const m = state.mem;
  if (!m.met || dlg || state.turn < m.nextEcho || zone[idx(player.x, player.y)] === Z.HOUSE) return;
  if (visibleMonsters().length) return;
  const pool = ECHOES.filter((e, i) => !m.echoUsed[i] && (!e.when || e.when()));
  if (!pool.length) return;
  const e = pool.find(e => e.when) || pick(pool);
  m.echoUsed[ECHOES.indexOf(e)] = 1;
  m.nextEcho = state.turn + ri(30, 55);
  Snd.zone();
  Dialog.open([{act:"The old man's voice comes back to you, as clear as if he were walking beside you:"}, {q:e.q, opts:e.opts}], 'echo');
}

function chapterReward(n){
  const P = player, m = state.mem;
  m.ch = n + 1;
  if (n === 0) { healPlayer(P.maxhp); log("The old man's bread warms you right down to your toes. (HP restored)", [1,.85,.6]); }
  if (n === 1) { P.maxhp += 4; healPlayer(P.maxhp); log('Something in your chest settles. (+4 max HP)', [1,.85,.6]); }
  if (n === 2) { P.maxmp += 4; P.mp = P.maxmp; log('Your thoughts feel clearer, like a window wiped clean. (+4 max MP)', [.7,.85,1]); }
  if (n === 3) { state.costDown = 1; log('Magic comes easier now. (spells cost 1 less MP)', [.7,.85,1]); }
  if (n === 4) { state.armor = 1; healPlayer(P.maxhp); log('You stand a little taller. (take 1 less damage from blows)', [1,.85,.6]); }
  if (n === 5) {
    state.belief = true; P.maxhp += 6; healPlayer(P.maxhp); P.mp = P.maxmp;
    m.knowsName = true;
    log('You believe in yourself again. (+6 max HP, and a light of your own)', [1,.9,.5]);
    Snd.win();
  }
  rebuildLights();
}
// he tells you his name partway through
CHAPTERS[3].push({s:"Oh — and I never told you my name, did I? Terribly rude. It's Eli. Everybody called me Eli, once.", face:'happy'},
                 {fx: () => { state.mem.knowsName = true; }});
