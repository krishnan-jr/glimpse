// Glimpse Constants & Preset Data Module
(function(window) {
  'use strict';

  // Generic Master List of Default Subjects (Empty by default for complete customization)
  const GENERIC_DEFAULT_SUBJECTS = [];

  const GENERIC_DEFAULT_TIMETABLE = {
    'Monday': [],
    'Tuesday': [],
    'Wednesday': [],
    'Thursday': [],
    'Friday': [],
    'Saturday': [],
    'Sunday': []
  };

  // Secret Preset Data for 2G Class
  const PRESET_2G_SUBJECTS = [
    { id: 'sub_1', badge: '🟥', icon: '🔤', name: 'English' },
    { id: 'sub_2', badge: '🟠', icon: '🧮', name: 'C. E.' },
    { id: 'sub_3', badge: '💛', icon: '✒️', name: 'Montessori' },
    { id: 'sub_4', badge: '🟩', icon: '📖', name: 'Malayalam' },
    { id: 'sub_4_cw', badge: '🟩', icon: '📖', name: 'Malayalam C. W.' },
    { id: 'sub_5', badge: '🩵', icon: '🔢', name: 'M. A.' },
    { id: 'sub_6', badge: '🔵', icon: '🦁', name: 'G. K.' },
    { id: 'sub_7', badge: '💜', icon: '🎵', name: 'P. E.' },
    { id: 'sub_8', badge: '🤎', icon: '🌙', name: 'Arabic/MRI' },
    { id: 'sub_9', badge: '🟧', icon: '📐', name: 'Maths' },
    { id: 'sub_10', badge: '💖', icon: '📝', name: 'Hindi' },
    { id: 'sub_10_cw', badge: '💖', icon: '📝', name: 'Hindi C. W.' },
    { id: 'sub_1_cw', badge: '🟥', icon: '🔤', name: 'English C. W.' },
    { id: 'sub_11', badge: '🟢', icon: '🧘🏻‍♀️', name: 'Yoga' },
    { id: 'sub_12', badge: '🟦', icon: '📚', name: 'Library' },
    { id: 'sub_13', badge: '🩵', icon: '💻', name: 'I. T.' },
    { id: 'sub_14', badge: '🤍', icon: '💡', name: 'V. E.' },
    { id: 'sub_15', badge: '💜', icon: '🎨', name: 'Arts' },
    { id: 'sub_16', badge: '💖', icon: '🎼', name: 'Music' }
  ];

  const PRESET_2G_TIMETABLE = {
    'Monday': ['sub_1', 'sub_9', 'sub_4', 'sub_10', 'sub_11', 'sub_12', 'sub_13', 'sub_9'],
    'Tuesday': ['sub_1', 'sub_4', 'sub_13', 'sub_10', 'sub_9', 'sub_3', 'sub_7', 'sub_10'],
    'Wednesday': ['sub_1', 'sub_8', 'sub_4_cw', 'sub_3', 'sub_2', 'sub_5', 'sub_7', 'sub_6'],
    'Thursday': ['sub_1', 'sub_9', 'sub_10_cw', 'sub_14', 'sub_4', 'sub_9', 'sub_1_cw', 'sub_2'],
    'Friday': ['sub_1', 'sub_10', 'sub_15', 'sub_16', 'sub_9', 'sub_4', 'sub_8', 'sub_1'],
    'Saturday': ['sub_1', 'sub_2', 'sub_3', 'sub_4', 'sub_5', 'sub_6', 'sub_7', 'sub_8'],
    'Sunday': ['sub_1', 'sub_2', 'sub_3', 'sub_4', 'sub_5', 'sub_6', 'sub_7', 'sub_8']
  };

  // Secret Preset Data for ENG Attendance Program
  const PRESET_ENG_ATTENDEES = [
    'Ms. Bhagya',
    'Ms. Susan',
    'Ms. Preetha S',
    'Ms. Sheela A R',
    'Ms. Divya Laxmi P S',
    'Ms. Arya Mohan',
    'Ms. Reshmi R',
    'Ms. Sabeena S',
    'Ms. Thasleena',
    'Ms. Fathima Rani',
    'Ms. Zeena Beevi',
    'Ms. Anciya',
    'Ms. Saleela',
    'Ms. Sumayya Mol',
    'Ms. Lina',
    'Ms. Shabnam',
    'Ms. Suja N',
    'Ms. Shahnaz',
    'Mr. Vineeth'
  ];

  const KEYCAP_EMOJIS = {
    '0': '0️⃣',
    '1': '1️⃣',
    '2': '2️⃣',
    '3': '3️⃣',
    '4': '4️⃣',
    '5': '5️⃣',
    '6': '6️⃣',
    '7': '7️⃣',
    '8': '8️⃣',
    '9': '9️⃣'
  };

  const DAYS_OF_WEEK = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const RANDOM_HEADER_EMOJIS_100 = [
    '🪁', '🪂', '✨', '🌟', '🎨', '🚀', '📌', '🎈', '🌺', '🎯',
    '🌈', '⭐', '🔥', '⚡', '🎉', '🏆', '🎓', '📚', '🌻', '🎁',
    '🍀', '💡', '🔔', '🎗️', '🏅', '🥇', '👑', '🥳', '🪄', '🔮',
    '🧸', '🧩', '🎭', '🎪', '🎤', '🎧', '🎷', '🎺', '🎸', '🪕',
    '🎻', '🎲', '♟️', '🎳', '🎮', '🏎️', '🛹', '🛼', '⛵', '🛸',
    '🪐', '💫', '🌌', '🌞', '🌝', '🌸', '💐', '🌷', '🌹', '🥀',
    '🌼', '🪷', '🍁', '🍂', '🍃', '🌿', '🌱', '🌴', '🌳', '🌲',
    '🍉', '🍓', '🍒', '🍎', '🍍', '🧃', '🍿', '🧁', '🍦', '🍩',
    '🍪', '🍫', '🍬', '🍭', '💌', '💎', '🤍', '🧡', '💛', '💚',
    '💙', '💜', '🤎', '💖', '🎏', '🔮', '🏖️', '🎠', '🎆', '🔮'
  ];

  const VIBRANT_NAME_COLORS = [
    '#FF4757', '#2ED573', '#1E90FF', '#FFA502', '#9B59B6',
    '#00D2D3', '#FF6B81', '#70A1FF', '#7BED9F', '#FFA801',
    '#E056FD', '#686DE0', '#00BEC4', '#BE2EDD', '#48DBFB',
    '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6',
    '#EF4444', '#14B8A6', '#F97316', '#D946EF', '#06B6D4'
  ];

  let FEELGOOD_MESSAGES_100 = [
  "Believe you can and you're halfway there. — Theodore Roosevelt",
  "Every day is a fresh start and a new chance to shine.",
  "What small win brought a smile to your face today?",
  "Keep your face always toward the sunshine—and shadows will fall behind you. — Walt Whitman",
  "You are capable of amazing things.",
  "What is one thing you are grateful for right now?",
  "Small steps every day lead to big results over time.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Your energy is contagious—spread kindness today.",
  "What exciting project are you looking forward to working on today?",
  "Do what you can, with what you have, where you are. — Theodore Roosevelt",
  "Happiness is not something readymade. It comes from your own actions. — Dalai Lama",
  "What's a new skill or idea you'd love to explore this week?",
  "Start where you are. Use what you have. Do what you can. — Arthur Ashe",
  "You are stronger and wiser than you think.",
  "What made you laugh recently?",
  "The secret of getting ahead is getting started. — Mark Twain",
  "Act as if what you do makes a difference. It does. — William James",
  "What's a cozy moment you enjoyed today?",
  "Dream big and dare to fail. — Norman Vaughan",
  "Your speed doesn't matter; forward progress is forward progress.",
  "Who is someone that brightened your day recently?",
  "Focus on the beauty in tiny moments.",
  "Make today so awesome that yesterday gets jealous!",
  "What's one good deed you can do today?",
  "Wherever you go, go with all your heart. — Confucius",
  "Turn your obstacles into stepping stones for success.",
  "What hobby or activity brings you pure peace?",
  "Light tomorrow with today. — Elizabeth Barrett Browning",
  "You make the world a better place just by being in it.",
  "What is your favorite way to unwind after a productive day?",
  "Great things never come from comfort zones.",
  "Embrace the journey, enjoy the process, and celebrate the small wins.",
  "What's a song that instantly lifts your mood?",
  "Write it on your heart that every day is the best day in the year. — Ralph Waldo Emerson",
  "Be the reason someone smiles today.",
  "What positive message would you share with your past self?",
  "Peace comes from within; nurture it every day.",
  "Strive for progress, not perfection.",
  "What is one goal you feel super passionate about?",
  "You are standard-issue awesome!",
  "Calculated risks and curiosity lead to wondrous discoveries.",
  "What's the best piece of advice you've ever received?",
  "Magic happens when you don't give up.",
  "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt",
  "What is something that made you feel proud of yourself recently?",
  "Radiate positivity and watch good things manifest around you.",
  "Every mistake is just a lesson leading to growth.",
  "What place brings you the most peaceful thoughts?",
  "Kindness is a language which the deaf can hear and the blind can see. — Mark Twain",
  "Your potential is unlimited—keep building!",
  "What's a simple pleasure that never fails to delight you?",
  "Today is a great day to learn something new.",
  "Be yourself; everyone else is already taken. — Oscar Wilde",
  "What accomplishment are you celebrating this month?",
  "Positive mind, positive vibes, positive life.",
  "Don't count the days, make the days count. — Muhammad Ali",
  "What delicious food made your day extra special?",
  "Opportunities don't happen, you create them. — Chris Grosser",
  "Take a deep breath; you're doing great!",
  "What is a creative idea you've been pondering lately?",
  "Stay curious, stay humble, and keep exploring.",
  "Spread love everywhere you go. — Mother Teresa",
  "What's a book or story that inspired you deeply?",
  "Clear minds make great decisions.",
  "The only limit to our realization of tomorrow is our doubts of today. — Franklin D. Roosevelt",
  "What acts of kindness have you noticed around you?",
  "Happiness grows when shared with others.",
  "Everything you can imagine is real. — Pablo Picasso",
  "What's a milestone you are working toward right now?",
  "Choose joy today, no matter how small.",
  "In the middle of every difficulty lies opportunity. — Albert Einstein",
  "What makes you feel energized and ready to take on the world?",
  "Doubt kills more dreams than failure ever will. — Suzy Kassem",
  "You are creating your own story—make it inspiring!",
  "What is a funny memory that still makes you chuckle?",
  "Life is short, make every moment count.",
  "When you focus on the good, the good gets better.",
  "What is something beautiful you saw today?",
  "Never shrink yourself for someone else's comfort.",
  "Small acts of kindness make a giant splash.",
  "What's your favorite way to spend a quiet morning?",
  "It always seems impossible until it's done. — Nelson Mandela",
  "Courage is grace under pressure. — Ernest Hemingway",
  "What quote inspires you whenever you feel challenged?",
  "Growth begins at the end of your comfort zone.",
  "You are an original—there is nobody else like you!",
  "What is a dream destination on your bucket list?",
  "Smile—it's free therapy!",
  "Success is the sum of small efforts repeated day in and day out. — Robert Collier",
  "What's your secret power when tackling a tough task?",
  "There are so many reasons to be happy.",
  "Shine your light bright and inspire others to do the same.",
  "What is a tradition or ritual that brings you joy?",
  "The best is yet to come!",
  "Believe in your inner strength and resilience.",
  "What is one thing you can do today for your self-care?",
  "Happiness is a state of mind—choose joy today.",
  "Every accomplishment starts with the decision to try.",
  "What exciting adventure awaits you next?",
  "The secret of change is to focus all of your energy not on fighting the old, but on building the new. — Socrates",
  "What's a random act of kindness you witnessed recently?",
  "Your mind is a garden; your thoughts are the seeds. Plant positivity!",
  "What is something you created that you feel really good about?",
  "Nothing is impossible, the word itself says 'I'm possible!' — Audrey Hepburn",
  "What's a comfort movie or show that always makes you feel at home?",
  "Believe in the magic of new beginnings.",
  "What is a compliment you received that stayed with you?",
  "You don't have to be great to start, but you have to start to be great. — Zig Ziglar",
  "What's a peaceful sound in nature that you love?",
  "Kindness is free—sprinkle that stuff everywhere!",
  "What is a small goal you achieved earlier today?",
  "Happiness is a warm cup of tea and a quiet moment to yourself.",
  "What's your favorite scent that brings back happy memories?",
  "You are worthy of all the good things coming your way.",
  "What's a fun topic you could talk about for hours?",
  "The sun will rise and we will try again.",
  "What is one thing that instantly relaxes your mind?",
  "Joy is not in things; it is in us. — Richard Wagner",
  "What's a favorite childhood memory that brings warmth to your heart?",
  "Do small things with great love. — Mother Teresa",
  "What's a skill you learned recently that felt rewarding?",
  "Every sunrise brings a promise of new possibilities.",
  "What's something you look forward to doing this weekend?",
  "Be a rainbow in someone else's cloud. — Maya Angelou",
  "What is a phrase or motto that keeps you grounded?",
  "Your hard work and dedication will yield wonderful fruits.",
  "What's a simple pleasure you enjoyed this morning?",
  "Keep shining; the world needs your unique light!",
  "What's a place in your home where you feel most comfortable?",
  "Attitude is a little thing that makes a big difference. — Winston Churchill",
  "What is a personal strength you are proud of possessing?",
  "Peace begins with a smile. — Mother Teresa",
  "What's a delicious hot beverage you love on a cool day?",
  "You are far more capable than your doubts make you believe.",
  "What's a fun game or puzzle that keeps your mind sharp?",
  "Turn your face to the sun and the shadows will fall behind you.",
  "What is something new you tried recently and enjoyed?",
  "Life is a journey to be experienced, not a problem to be solved.",
  "What's a sweet message you received recently?",
  "Small steps taken consistently create gigantic transformations.",
  "What is a favorite flower or plant that brightens your space?",
  "Wherever life plants you, bloom with grace.",
  "What's a fun memory with your friends that always brings a grin?",
  "You are an essential part of the tapestry of life.",
  "What's a cozy habit you practice during rain or stormy days?",
  "The power of imagination makes us infinite. — John Muir",
  "What is one thing you appreciate about your current setup?",
  "Focus on where you want to go, not on what you fear.",
  "What's a funny joke or riddle that made you laugh?",
  "Every moment is a fresh opportunity to reset and restart.",
  "What is a favorite dish your family makes for celebrations?",
  "Optimism is the faith that leads to achievement. — Helen Keller",
  "What's a favorite quote from a mentor or teacher?",
  "Give your stress wings and let it fly away.",
  "What is a color that instantly boosts your mood?",
  "You are stronger than your storm; keep sailing forward.",
  "What's a delightful surprise that happened to you this month?",
  "With the new day comes new strength and new thoughts. — Eleanor Roosevelt",
  "What's a favorite game you used to play in school?",
  "Laughter is timeless, imagination has no age, and dreams are forever. — Walt Disney",
  "What is a virtue you admire most in others?",
  "Be proud of how far you've come and excited for how far you'll go.",
  "What's a peaceful spot nearby where you like to go for walks?",
  "You don't need a new day to start over; you only need a new mindset.",
  "What's a hobby you'd love to pick up again?",
  "To live will be an terribly big adventure. — J.M. Barrie",
  "What is a lesson you learned this past year that made you wiser?",
  "Surround yourself with people who lift you higher.",
  "What's a favorite animal or pet that makes you smile?",
  "Great things are done by a series of small things brought together. — Vincent van Gogh",
  "What is a favorite holiday or festival memory?",
  "Your potential is like the ocean—endless and deep.",
  "What's a comfortable outfit that makes you feel great?",
  "No act of kindness, no matter how small, is ever wasted. — Aesop",
  "What is a book you think everyone should read?",
  "Choose to see the good in every situation.",
  "What's a song that gives you instant energy?",
  "When you know your worth, nobody can make you feel worthless.",
  "What is a project you finished that felt like a major triumph?",
  "A champion is defined by how they recover when they fall.",
  "What's a favorite place to watch the sunset?",
  "Believe in your inner power and keep pressing forward.",
  "What's a warm memory from a recent trip or outing?",
  "Simplicity is the ultimate sophistication. — Leonardo da Vinci",
  "What is something positive you learned about yourself recently?",
  "Radiate confidence, kindness, and positivity everywhere you step.",
  "What's your favorite time of day to create or focus?",
  "Every day may not be good, but there is something good in every day.",
  "What's a sweet habit you share with someone you love?",
  "The secret to happiness is freedom, and the secret to freedom is courage.",
  "What is one thing you love about your daily routine?",
  "Keep your eyes on the stars and your feet on the ground. — Theodore Roosevelt",
  "What's a creative breakthrough you've had recently?",
  "You are writing your own story; make it a masterpiece!",
  "What is a simple habit that improved your day-to-day life?",
  "Wherever you are, be all there. — Jim Elliot",
  "What's a goal that makes you feel genuinely thrilled?",
  "You possess the courage to overcome any challenge in your way.",
  "Celebrate your unique journey; you are doing fantastically well!"
];

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Export to global scope
  window.GENERIC_DEFAULT_SUBJECTS = GENERIC_DEFAULT_SUBJECTS;
  window.GENERIC_DEFAULT_TIMETABLE = GENERIC_DEFAULT_TIMETABLE;
  window.PRESET_2G_SUBJECTS = PRESET_2G_SUBJECTS;
  window.PRESET_2G_TIMETABLE = PRESET_2G_TIMETABLE;
  window.PRESET_ENG_ATTENDEES = PRESET_ENG_ATTENDEES;
  window.KEYCAP_EMOJIS = KEYCAP_EMOJIS;
  window.DAYS_OF_WEEK = DAYS_OF_WEEK;
  window.RANDOM_HEADER_EMOJIS_100 = RANDOM_HEADER_EMOJIS_100;
  window.VIBRANT_NAME_COLORS = VIBRANT_NAME_COLORS;
  window.FEELGOOD_MESSAGES_100 = FEELGOOD_MESSAGES_100;
  window.escapeHtml = escapeHtml;

})(window);
