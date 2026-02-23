// Episode story data for Puppy Academy
// Each episode is a series of scenes with dialogue, exploration, and battles

const EPISODES = {
    1: {
        id: 1,
        title: 'A Lost Pup',
        subtitle: 'Every great adventure begins with a rainy night...',
        requiredRank: 0,

        scenes: [
            // === SCENE 1: Rainy Night - Finding the Puppy ===
            {
                bg: '#1a1a2e',
                bgEmojis: [
                    { emoji: '🌧️', x: 0.2, y: 0.15, alpha: 0.4 },
                    { emoji: '🌧️', x: 0.5, y: 0.1, alpha: 0.3 },
                    { emoji: '🌧️', x: 0.8, y: 0.18, alpha: 0.4 },
                    { emoji: '🌙', x: 0.85, y: 0.08, alpha: 0.6 },
                    { emoji: '🏠', x: 0.15, y: 0.5, alpha: 0.2 },
                    { emoji: '🏠', x: 0.45, y: 0.45, alpha: 0.2 },
                    { emoji: '🌳', x: 0.7, y: 0.55, alpha: 0.15 },
                ],
                characters: [],
                steps: [
                    { type: 'narration', text: 'A cold, rainy night in the small town of Barksville... The kind of night that seeps into your bones.' },
                    { type: 'narration', text: 'Thunder rumbles across the dark sky... Most dogs in town are safe and warm behind closed doors. But not everyone.' },
                    { type: 'shake', duration: 0.4, intensity: 4 },
                    { type: 'narration', text: 'Wait... what was that? A faint whimpering, barely audible over the pounding rain... Something stirs in the darkness.' },
                    { type: 'enter', id: 'player', emoji: '{dogEmoji}', name: '{dogName}', x: 0.7, y: 0.65, scale: 1.2 },
                    { type: 'dialogue', speaker: '{dogName}', emoji: '{dogEmoji}', text: '*sniff sniff* ... That scent... another dog? Out here, in a storm like this...?' },
                    { type: 'enter', id: 'puppy', emoji: '🐶', name: '???', x: 0.3, y: 0.7, scale: 0.7 },
                    { type: 'shake', duration: 0.3, intensity: 3 },
                    { type: 'narration', text: 'Beneath a sodden cardboard box, you find a tiny puppy... shivering, alone, eyes wide with fear.' },
                    { type: 'dialogue', speaker: '???', emoji: '🐶', text: '*whimper* ... p-please... I\'m s-so cold... Is someone there...?' },
                    { type: 'choice', speaker: '{dogName}', emoji: '{dogEmoji}', text: 'The poor little pup is soaked and trembling. Those eyes... you can\'t just walk away.',
                        choices: [
                            { text: 'Come with me, little one. I\'ll keep you safe.' },
                            { text: 'Don\'t worry! I\'ll get you somewhere warm!' },
                        ]
                    },
                    { type: 'dialogue', speaker: '???', emoji: '🐶', text: '*tail wag* ... r-really? You\'d... you\'d help me? Even though you don\'t know me?' },
                    { type: 'dialogue', speaker: '{dogName}', emoji: '{dogEmoji}', text: 'Of course! No pup gets left behind... not on my watch. Come on, let\'s get to the Academy!' },
                    { type: 'narration', text: '{dogName} gently picks up the tiny puppy and carries them through the hammering rain... toward the warm glow of Puppy Academy.' },
                ]
            },

            // === SCENE 2: Arriving at the Academy ===
            {
                bg: '#2c1810',
                bgEmojis: [
                    { emoji: '🏫', x: 0.5, y: 0.2, alpha: 0.4 },
                    { emoji: '💡', x: 0.3, y: 0.35, alpha: 0.3 },
                    { emoji: '💡', x: 0.7, y: 0.35, alpha: 0.3 },
                    { emoji: '🦴', x: 0.15, y: 0.8, alpha: 0.15 },
                    { emoji: '🦴', x: 0.85, y: 0.75, alpha: 0.15 },
                ],
                characters: [],
                steps: [
                    { type: 'narration', text: 'Inside Puppy Academy... the warm glow of the fireplace bathes the main hall in amber light. Safe, at last.' },
                    { type: 'enter', id: 'player', emoji: '{dogEmoji}', name: '{dogName}', x: 0.5, y: 0.7, scale: 1 },
                    { type: 'enter', id: 'puppy', emoji: '🐶', name: 'Lost Puppy', x: 0.5, y: 0.8, scale: 0.7 },
                    { type: 'enter', id: 'elder', emoji: '🦮', name: 'Old Rex', x: 0.5, y: 0.45, scale: 1.3 },
                    { type: 'dialogue', speaker: 'Old Rex', emoji: '🦮', text: 'Well, well... {dogName}! What do we have here? You\'ve brought a little one in from that dreadful storm?' },
                    { type: 'dialogue', speaker: '{dogName}', emoji: '{dogEmoji}', text: 'Found this puppy all alone in the rain, Rex... shivering under a box near the old park. I couldn\'t just leave them.' },
                    { type: 'dialogue', speaker: 'Old Rex', emoji: '🦮', text: 'Hmm... *examines the puppy carefully* A Golden Retriever pup. Very young; can\'t be more than 8 weeks old.' },
                    { type: 'dialogue', speaker: 'Old Rex', emoji: '🦮', text: 'Golden Retrievers... a noble breed, originally from the Scottish Highlands. Lord Tweedmouth himself created the line in the 1860s, crossing a Yellow Retriever with a Tweed Water Spaniel.' },
                    { type: 'narration', text: '📖 Dog Fact: Golden Retrievers are the 3rd most popular breed in America. Bred for loyalty, gentleness, and an unbreakable spirit.' },
                    { type: 'dialogue', speaker: 'Lost Puppy', emoji: '🐶', text: '... I remember now... Mama and Papa... we were playing in the park, and then... then the cats came...' },
                    { type: 'shake', duration: 0.5, intensity: 5 },
                    { type: 'dialogue', speaker: 'Old Rex', emoji: '🦮', text: 'The CATS?! *growls deeply* ... So the rumors are true. The Cat Army has been raiding the outskirts of Barksville.' },
                    { type: 'dialogue', speaker: 'Old Rex', emoji: '🦮', text: 'They\'ve been taking dogs... holding them prisoner in their territory. This little one\'s parents... they must have been captured!' },
                    { type: 'dialogue', speaker: 'Lost Puppy', emoji: '🐶', text: '*whimper* Mama... Papa... Are they... are they okay...?' },
                    { type: 'choice', speaker: '{dogName}', emoji: '{dogEmoji}', text: 'The puppy looks up at you with big, glistening eyes... full of hope, and fear.',
                        choices: [
                            { text: 'I promise I\'ll find your parents. No matter what it takes!' },
                            { text: 'We\'ll get them back. That\'s what the Academy is for!' },
                        ]
                    },
                    { type: 'dialogue', speaker: 'Lost Puppy', emoji: '🐶', text: '*tail wags furiously* R-really?! You... you really mean it?!' },
                    { type: 'dialogue', speaker: 'Old Rex', emoji: '🦮', text: 'Brave words, {dogName}... but the Cat Army is no ordinary threat. You\'ll need to prepare yourself.' },
                    { type: 'dialogue', speaker: 'Old Rex', emoji: '🦮', text: 'First things first; let this little one rest. Meanwhile, you should scout the backyard... cat patrols have been spotted dangerously close to our walls.' },
                    { type: 'reward', bones: 50, treats: 10, xp: 25 },
                    { type: 'narration', text: '🦴 +50 Bones | 🍖 +10 Treats | ⭐ +25 XP\nThe puppy curls up by the crackling fire... and drifts into an exhausted sleep. Time to prepare for what lies ahead.' },
                ]
            },

            // === SCENE 3: Exploration - Academy Grounds (FF7-style Village) ===
            {
                type: 'explore',
                villageMap: 'academy',
                bg: '#3D6B25',
                startX: 14, startY: 18,
                steps: [
                    {
                        type: 'explore',
                        villageMap: 'academy',
                        startX: 14, startY: 18,
                        npcs: [
                            {
                                id: 'rex', emoji: '🦮', name: 'Old Rex',
                                x: 14, y: 10, wander: true,
                                dialogue: 'The Cat Army grows bolder by the day... I saw movement near our southern perimeter last night. Scout the grounds carefully, {dogName}.'
                            },
                            {
                                id: 'nurse', emoji: '🐩', name: 'Nurse Fifi',
                                x: 24, y: 8, wander: false,
                                dialogue: 'The little puppy is resting peacefully in the infirmary... Did you know puppies need 18 to 20 hours of sleep? Golden Retrievers especially; their growing bodies demand it.'
                            },
                            {
                                id: 'scout', emoji: '🐕‍🦺', name: 'Scout',
                                x: 20, y: 14, wander: true,
                                dialogue: 'Psst... {dogName}! I spotted fresh cat pawprints near the south fence! Be on your guard; cats can see six times better than us in the dark...'
                            },
                        ],
                        triggers: [
                            {
                                x: 13, y: 27, w: 4, h: 2,
                                visible: true,
                                label: '⚠️ South Fence',
                                action: 'nextStep'
                            }
                        ]
                    },
                    // After reaching south fence
                    { type: 'endExplore' },
                    { type: 'narration', text: 'As you approach the south fence... a chill runs down your spine. Hissing... from the shadows beyond the fence.' },
                    { type: 'shake', duration: 0.6, intensity: 6 },
                    { type: 'bg', color: '#1a1a2e', emojis: [
                        { emoji: '🌙', x: 0.8, y: 0.1, alpha: 0.5 },
                        { emoji: '🌳', x: 0.15, y: 0.55, alpha: 0.2 },
                        { emoji: '🌳', x: 0.85, y: 0.5, alpha: 0.2 },
                    ]},
                    { type: 'enter', id: 'player', emoji: '{dogEmoji}', name: '{dogName}', x: 0.5, y: 0.65, scale: 1.1 },
                    { type: 'enter', id: 'catleader', emoji: '😼', name: 'Captain Whiskers', x: 0.5, y: 0.35, scale: 1.2 },
                    { type: 'enter', id: 'cat1', emoji: '🐱', name: '', x: 0.25, y: 0.4, scale: 0.8 },
                    { type: 'enter', id: 'cat2', emoji: '🐱', name: '', x: 0.75, y: 0.4, scale: 0.8 },
                    { type: 'dialogue', speaker: 'Captain Whiskers', emoji: '😼', text: 'Well, well, well... A little puppy playing guard dog. How utterly... adorable.' },
                    { type: 'dialogue', speaker: '{dogName}', emoji: '{dogEmoji}', text: 'You...! You\'re the ones who took that puppy\'s parents! Tell me where they are!' },
                    { type: 'dialogue', speaker: 'Captain Whiskers', emoji: '😼', text: 'Hahaha! Those Golden Retrievers? They\'re our... honored guests... at Cat Central. Very comfortable, I assure you. *evil grin*' },
                    { type: 'dialogue', speaker: 'Captain Whiskers', emoji: '😼', text: 'But enough pleasantries. CATS! Show this mutt what happens to dogs... who stick their noses where they don\'t belong!' },
                    { type: 'narration', text: '⚔️ BATTLE! The Cat Army launches an ambush on the Academy grounds!' },
                    { type: 'battle', level: 0 },
                ]
            },

            // === SCENE 4: After First Battle ===
            {
                bg: '#2c1810',
                bgEmojis: [
                    { emoji: '🏫', x: 0.5, y: 0.2, alpha: 0.3 },
                    { emoji: '⭐', x: 0.3, y: 0.15, alpha: 0.3 },
                    { emoji: '⭐', x: 0.7, y: 0.12, alpha: 0.3 },
                ],
                characters: [],
                steps: [
                    { type: 'enter', id: 'player', emoji: '{dogEmoji}', name: '{dogName}', x: 0.5, y: 0.65, scale: 1.1 },
                    { type: 'enter', id: 'elder', emoji: '🦮', name: 'Old Rex', x: 0.35, y: 0.45, scale: 1.2 },
                    { type: 'enter', id: 'puppy', emoji: '🐶', name: 'Lost Puppy', x: 0.65, y: 0.75, scale: 0.7 },
                    { type: 'narration', text: 'The cats scatter into the night, hissing and yowling... {dogName} has defended the Academy!' },
                    { type: 'dialogue', speaker: 'Old Rex', emoji: '🦮', text: 'Impressive, {dogName}... truly impressive! You drove them off. But don\'t celebrate just yet; Captain Whiskers will return... with reinforcements.' },
                    { type: 'dialogue', speaker: 'Lost Puppy', emoji: '🐶', text: '{dogName}! That was amazing! You were so brave! Did... did the cats say anything about my parents...?' },
                    { type: 'dialogue', speaker: '{dogName}', emoji: '{dogEmoji}', text: 'They\'re being held at a place called Cat Central... deep in enemy territory. But don\'t worry; we\'ll bring them home.' },
                    { type: 'dialogue', speaker: 'Old Rex', emoji: '🦮', text: 'Cat Central... *closes eyes* That fortress lies beyond the Park, in the heart of their domain. The journey won\'t be easy.' },
                    { type: 'dialogue', speaker: 'Old Rex', emoji: '🦮', text: 'A river cuts through the Park. And here\'s the thing about cats; they despise water. Their fur isn\'t waterproof like ours... it weighs them down.' },
                    { type: 'narration', text: '📖 Dog Fact: Many dog breeds have water-resistant double coats! Labrador Retrievers produce natural oils that repel water entirely.' },
                    { type: 'dialogue', speaker: 'Old Rex', emoji: '🦮', text: 'I have an old friend at the Park... a Husky named Frost. She guards the river bridges. Find her, and she\'ll help you cross into cat territory.' },
                    { type: 'enter', id: 'scout', emoji: '🐕‍🦺', name: 'Scout', x: 0.15, y: 0.55, scale: 0.9 },
                    { type: 'dialogue', speaker: 'Scout', emoji: '🐕‍🦺', text: 'Wait! I want to help too! I overheard the cats talking... they said the Golden Retrievers are being forced to fetch for the Cat King himself!' },
                    { type: 'dialogue', speaker: 'Scout', emoji: '🐕‍🦺', text: 'Here\'s the cruel part; Goldens have the gentlest grip of any breed. They can carry a raw egg without cracking it... and those cats are exploiting that gift.' },
                    { type: 'dialogue', speaker: 'Lost Puppy', emoji: '🐶', text: 'That... that sounds just like Mama and Papa. They always loved fetching things... but not like this. Not for those cats...' },
                    { type: 'dialogue', speaker: '{dogName}', emoji: '{dogEmoji}', text: 'Then it\'s settled. We head for the Park, find Frost, and push through to Cat Central. Whatever it takes.' },
                    { type: 'dialogue', speaker: 'Old Rex', emoji: '🦮', text: 'Be careful out there, {dogName}. And remember this... the strength of the pack is every dog, and the strength of every dog... is the pack.' },
                    { type: 'narration', text: '📖 Those words echo from "The Jungle Book" by Rudyard Kipling, the ancient Law of the Pack.' },
                    { type: 'reward', bones: 75, treats: 15, xp: 40 },
                    { type: 'narration', text: '🦴 +75 Bones | 🍖 +15 Treats | ⭐ +40 XP' },
                    { type: 'flag', flag: 'ep1_met_whiskers', value: true },
                ]
            },

            // === SCENE 5: Journey to the Park ===
            {
                bg: '#2d5016',
                bgEmojis: [
                    { emoji: '🌳', x: 0.1, y: 0.3, alpha: 0.3 },
                    { emoji: '🌳', x: 0.9, y: 0.25, alpha: 0.3 },
                    { emoji: '🌳', x: 0.2, y: 0.5, alpha: 0.2 },
                    { emoji: '🌳', x: 0.8, y: 0.55, alpha: 0.2 },
                    { emoji: '🌉', x: 0.5, y: 0.3, alpha: 0.4 },
                    { emoji: '🌊', x: 0.4, y: 0.38, alpha: 0.3 },
                    { emoji: '🌊', x: 0.6, y: 0.38, alpha: 0.3 },
                ],
                characters: [],
                steps: [
                    { type: 'narration', text: 'The Park... once a peaceful haven where dogs and their humans played together beneath the open sky.' },
                    { type: 'narration', text: 'Now the Cat Army patrols every bridge and pathway. But the river... the river still runs free.' },
                    { type: 'enter', id: 'player', emoji: '{dogEmoji}', name: '{dogName}', x: 0.3, y: 0.7, scale: 1 },
                    { type: 'enter', id: 'frost', emoji: '🐺', name: 'Frost', x: 0.7, y: 0.45, scale: 1.2 },
                    { type: 'dialogue', speaker: 'Frost', emoji: '🐺', text: '*AWOOOO!* Hold it right there...! ... Hmph. You must be from the Academy. Old Rex sent word you\'d be coming.' },
                    { type: 'dialogue', speaker: '{dogName}', emoji: '{dogEmoji}', text: 'I\'m {dogName}. Two Golden Retrievers are being held prisoner at Cat Central... I need to get across that river.' },
                    { type: 'dialogue', speaker: 'Frost', emoji: '🐺', text: 'Golden Retrievers... Yeah, I saw the cats dragging them through here last week. Their eyes were so sad... I wanted to help, but I was outnumbered.' },
                    { type: 'dialogue', speaker: 'Frost', emoji: '🐺', text: 'I\'m a Siberian Husky; bred by the Chukchi people of ancient Siberia to pull sleds across frozen tundra. A little river crossing? That\'s nothing to me.' },
                    { type: 'narration', text: '📖 Husky Fact: Siberian Huskies can run up to 100 miles per day! Their unique metabolism lets them run for hours without exhaustion.' },
                    { type: 'dialogue', speaker: 'Frost', emoji: '🐺', text: 'But here\'s the problem... the cats have fortified the main bridge. An ambush, waiting for anyone who tries to cross. We\'ll have to fight our way through.' },
                    { type: 'dialogue', speaker: 'Frost', emoji: '🐺', text: 'I\'ll join your pack, {dogName}. My howl can freeze enemies in their tracks; a Husky\'s howl carries over 10 miles. They won\'t know what hit them.' },
                    { type: 'choice', speaker: '{dogName}', emoji: '{dogEmoji}', text: 'Frost stands tall, ice-blue eyes burning with determination.',
                        choices: [
                            { text: 'Welcome to the team, Frost! Let\'s do this!' },
                            { text: 'We\'ll need all the help we can get. Thanks, Frost!' },
                        ]
                    },
                    { type: 'narration', text: '⚔️ BATTLE! Break through the Cat Army\'s blockade at the Park bridge!' },
                    { type: 'battle', level: 1 },
                ]
            },

            // === SCENE 6: The Path to Cat Central ===
            {
                bg: '#1a1a2e',
                bgEmojis: [
                    { emoji: '🏚️', x: 0.3, y: 0.25, alpha: 0.3 },
                    { emoji: '🏚️', x: 0.7, y: 0.2, alpha: 0.3 },
                    { emoji: '🐱', x: 0.2, y: 0.45, alpha: 0.15 },
                    { emoji: '🐱', x: 0.8, y: 0.5, alpha: 0.15 },
                    { emoji: '😼', x: 0.5, y: 0.15, alpha: 0.3 },
                ],
                characters: [],
                steps: [
                    { type: 'enter', id: 'player', emoji: '{dogEmoji}', name: '{dogName}', x: 0.3, y: 0.65, scale: 1 },
                    { type: 'enter', id: 'frost', emoji: '🐺', name: 'Frost', x: 0.2, y: 0.55, scale: 1 },
                    { type: 'narration', text: 'Beyond the river... Cat Central looms against the darkened sky. A maze of alleys, rooftops, and shadows... the stronghold of the Cat King himself.' },
                    { type: 'dialogue', speaker: 'Frost', emoji: '🐺', text: 'We\'re close... I can smell them. Cats everywhere; but underneath that... dog fur. The Golden Retrievers... they\'re here!' },
                    { type: 'enter', id: 'catking', emoji: '👑', name: 'The Cat King', x: 0.5, y: 0.3, scale: 1.5 },
                    { type: 'shake', duration: 0.7, intensity: 8 },
                    { type: 'dialogue', speaker: 'The Cat King', emoji: '👑', text: 'So... the puppies from the Academy dare set paw in MY domain? How delightfully foolish.' },
                    { type: 'dialogue', speaker: 'The Cat King', emoji: '👑', text: 'I am the Cat King! Supreme Ruler of all felines! Those Golden Retrievers? They fetch my royal toys now... and they shall do so forever! MWAHAHA!' },
                    { type: 'dialogue', speaker: '{dogName}', emoji: '{dogEmoji}', text: 'Let them go...! Dogs are nobody\'s servants!' },
                    { type: 'dialogue', speaker: 'The Cat King', emoji: '👑', text: 'You want them back...? Then come and TAKE them! My entire army stands between you and your precious retrievers!' },
                    { type: 'dialogue', speaker: 'The Cat King', emoji: '👑', text: 'Did you know cats always land on their feet? The "righting reflex"... perfected over millions of years. You mutts can\'t even catch your own tails! HAHA!' },
                    { type: 'narration', text: '📖 Cat Fact: The righting reflex is real; cats can rotate their bodies mid-air in less than 0.3 seconds to land safely on their feet.' },
                    { type: 'dialogue', speaker: 'Frost', emoji: '🐺', text: '{dogName}... this is it. The final battle. Everything we\'ve fought for comes down to this moment. Are you ready?' },
                    { type: 'choice', speaker: '{dogName}', emoji: '{dogEmoji}', text: 'The Cat King\'s army assembles in the shadows... rows upon rows of gleaming eyes. This is the fight of your life.',
                        choices: [
                            { text: 'For the Lost Puppy! For their parents! LET\'S GO!' },
                            { text: 'Every dog in the Academy is counting on us. We won\'t fail!' },
                        ]
                    },
                    { type: 'narration', text: '⚔️ FINAL BATTLE! Storm the gates of Cat Central and rescue the Golden Retrievers!' },
                    { type: 'battle', level: 2 },
                ]
            },

            // === SCENE 7: The Rescue ===
            {
                bg: '#1B5E20',
                bgEmojis: [
                    { emoji: '☀️', x: 0.5, y: 0.08, alpha: 0.6 },
                    { emoji: '🌈', x: 0.5, y: 0.18, alpha: 0.4 },
                    { emoji: '🌳', x: 0.1, y: 0.4, alpha: 0.2 },
                    { emoji: '🌳', x: 0.9, y: 0.45, alpha: 0.2 },
                    { emoji: '🦋', x: 0.3, y: 0.3, alpha: 0.3 },
                    { emoji: '🦋', x: 0.7, y: 0.25, alpha: 0.3 },
                ],
                characters: [],
                steps: [
                    { type: 'narration', text: 'The Cat King flees! His army scatters in all directions. And there, in the back of Cat Central...' },
                    { type: 'enter', id: 'mama', emoji: '🦮', name: 'Mama Goldie', x: 0.35, y: 0.45, scale: 1.2 },
                    { type: 'enter', id: 'papa', emoji: '🦮', name: 'Papa Goldie', x: 0.65, y: 0.45, scale: 1.3 },
                    { type: 'narration', text: 'Two beautiful Golden Retrievers, tired but alive, their tails starting to wag...' },
                    { type: 'enter', id: 'player', emoji: '{dogEmoji}', name: '{dogName}', x: 0.3, y: 0.7, scale: 1 },
                    { type: 'enter', id: 'frost', emoji: '🐺', name: 'Frost', x: 0.15, y: 0.65, scale: 0.9 },
                    { type: 'dialogue', speaker: 'Mama Goldie', emoji: '🦮', text: 'Oh my goodness! Are you from the Academy? Is our baby safe?!' },
                    { type: 'dialogue', speaker: '{dogName}', emoji: '{dogEmoji}', text: 'Your puppy is safe and warm at Puppy Academy. They\'ve been so brave, waiting for you.' },
                    { type: 'dialogue', speaker: 'Papa Goldie', emoji: '🦮', text: '*wipes tear with paw* Thank you... thank you so much. We were so worried.' },
                    { type: 'dialogue', speaker: 'Papa Goldie', emoji: '🦮', text: 'Those cats made us fetch things all day. They don\'t understand — we LOVE fetching, but only for people and dogs who love us back!' },
                    { type: 'narration', text: '📖 Retriever Fact: Golden Retrievers were bred specifically to retrieve hunted game gently. Their "soft mouth" is so gentle they can carry a raw egg without cracking it!' },
                    { type: 'shake', duration: 0.3, intensity: 3 },
                    { type: 'narration', text: 'Back at Puppy Academy...' },
                ]
            },

            // === SCENE 8: Reunion ===
            {
                bg: '#2c1810',
                bgEmojis: [
                    { emoji: '🏫', x: 0.5, y: 0.15, alpha: 0.3 },
                    { emoji: '❤️', x: 0.3, y: 0.25, alpha: 0.4 },
                    { emoji: '❤️', x: 0.7, y: 0.2, alpha: 0.4 },
                    { emoji: '🎉', x: 0.15, y: 0.3, alpha: 0.3 },
                    { emoji: '🎉', x: 0.85, y: 0.28, alpha: 0.3 },
                    { emoji: '🦴', x: 0.2, y: 0.8, alpha: 0.15 },
                    { emoji: '🦴', x: 0.8, y: 0.85, alpha: 0.15 },
                ],
                characters: [],
                steps: [
                    { type: 'enter', id: 'puppy', emoji: '🐶', name: 'Lost Puppy', x: 0.5, y: 0.65, scale: 0.8 },
                    { type: 'enter', id: 'mama', emoji: '🦮', name: 'Mama Goldie', x: 0.35, y: 0.45, scale: 1.1 },
                    { type: 'enter', id: 'papa', emoji: '🦮', name: 'Papa Goldie', x: 0.65, y: 0.45, scale: 1.2 },
                    { type: 'dialogue', speaker: 'Lost Puppy', emoji: '🐶', text: 'MAMA! PAPA! *runs and jumps*' },
                    { type: 'shake', duration: 0.3, intensity: 4 },
                    { type: 'move', id: 'puppy', x: 0.5, y: 0.48 },
                    { type: 'dialogue', speaker: 'Mama Goldie', emoji: '🦮', text: 'My baby! Oh, we missed you so much! *nuzzle nuzzle*' },
                    { type: 'dialogue', speaker: 'Papa Goldie', emoji: '🦮', text: 'You\'ve been so brave, little one. We\'re so proud of you.' },
                    { type: 'enter', id: 'player', emoji: '{dogEmoji}', name: '{dogName}', x: 0.5, y: 0.8, scale: 1 },
                    { type: 'enter', id: 'elder', emoji: '🦮', name: 'Old Rex', x: 0.15, y: 0.55, scale: 1.1 },
                    { type: 'enter', id: 'frost', emoji: '🐺', name: 'Frost', x: 0.85, y: 0.6, scale: 0.9 },
                    { type: 'dialogue', speaker: 'Old Rex', emoji: '🦮', text: '{dogName}, you\'ve done something remarkable today. You\'ve shown true courage, loyalty, and heart.' },
                    { type: 'dialogue', speaker: 'Old Rex', emoji: '🦮', text: 'Those are the qualities we value most at Puppy Academy. Not just in dogs — in anyone.' },
                    { type: 'dialogue', speaker: 'Mama Goldie', emoji: '🦮', text: 'We\'d like to stay at the Academy, if you\'ll have us. And our little one too — they want to grow up to be just like {dogName}!' },
                    { type: 'dialogue', speaker: 'Lost Puppy', emoji: '🐶', text: 'My name is Sunny! And when I grow up, I want to help rescue other dogs too!' },
                    { type: 'reward', dog: { breed: 'goldie', name: 'Sunny' } },
                    { type: 'narration', text: '🎉 Sunny the Golden Retriever has joined your kennel!' },
                    { type: 'reward', bones: 200, treats: 30, xp: 100 },
                    { type: 'narration', text: '🦴 +200 Bones | 🍖 +30 Treats | ⭐ +100 XP' },
                    { type: 'dialogue', speaker: 'Frost', emoji: '🐺', text: 'That was quite the adventure. Count me in for the next one, {dogName}!' },
                    { type: 'dialogue', speaker: 'Old Rex', emoji: '🦮', text: 'The Cat King escaped, which means he\'ll be back. But for now... let\'s celebrate.' },
                    { type: 'dialogue', speaker: 'Old Rex', emoji: '🦮', text: 'And {dogName}? Remember what you learned today. Every dog has a story, a breed with a history, and a heart full of loyalty. Take care of them all.' },
                    { type: 'narration', text: '📖 Final Fact: There are over 360 recognized dog breeds in the world, each with its own unique history and purpose. From tiny Chihuahuas to giant Great Danes, every dog is special!' },
                    { type: 'dialogue', speaker: 'Sunny', emoji: '🐶', text: 'Thank you, {dogName}. You\'re the best friend a pup could have!' },
                    { type: 'narration', text: '🐾 Episode 1: "A Lost Pup" — COMPLETE! 🐾\n\nSunny is safe. The family is reunited.\nBut the Cat King is still out there...\n\nTo be continued in Episode 2: "The Pack Grows"' },
                    { type: 'flag', flag: 'ep1_complete', value: true },
                ]
            }
        ]
    }
};
