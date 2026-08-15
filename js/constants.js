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
    { id: 'sub_1', badge: '🟥', icon: '🔤', name: 'English', suffix: '', notes: '' },
    { id: 'sub_2', badge: '🟠', icon: '🧮', name: 'C. E.', suffix: '', notes: '' },
    { id: 'sub_3', badge: '💛', icon: '✒️', name: 'Montessori', suffix: '', notes: '' },
    { id: 'sub_4', badge: '🟩', icon: '📖', name: 'Malayalam', suffix: '', notes: '' },
    { id: 'sub_4_cw', badge: '🟩', icon: '📖', name: 'Malayalam', suffix: 'C. W.', notes: '' },
    { id: 'sub_5', badge: '🩵', icon: '🔢', name: 'M. A.', suffix: '', notes: '' },
    { id: 'sub_6', badge: '🔵', icon: '🦁', name: 'G. K.', suffix: '', notes: '' },
    { id: 'sub_7', badge: '💜', icon: '🎵', name: 'P. E.', suffix: '', notes: '' },
    { id: 'sub_8', badge: '🤎', icon: '🌙', name: 'Arabic/MRI', suffix: '', notes: '' },
    { id: 'sub_9', badge: '🟧', icon: '📐', name: 'Maths', suffix: '', notes: '' },
    { id: 'sub_10', badge: '💖', icon: '📝', name: 'Hindi', suffix: '', notes: '' },
    { id: 'sub_10_cw', badge: '💖', icon: '📝', name: 'Hindi', suffix: 'C. W.', notes: '' },
    { id: 'sub_1_cw', badge: '🟥', icon: '🔤', name: 'English', suffix: 'C. W.', notes: '' },
    { id: 'sub_11', badge: '🟢', icon: '🧘🏻‍♀️', name: 'Yoga', suffix: '', notes: '' },
    { id: 'sub_12', badge: '🟦', icon: '📚', name: 'Library', suffix: '', notes: '' },
    { id: 'sub_13', badge: '🩵', icon: '💻', name: 'I. T.', suffix: '', notes: '' },
    { id: 'sub_14', badge: '🤍', icon: '💡', name: 'V. E.', suffix: '', notes: '' },
    { id: 'sub_15', badge: '💜', icon: '🎨', name: 'Arts', suffix: '', notes: '' },
    { id: 'sub_16', badge: '💖', icon: '🎼', name: 'Music', suffix: '', notes: '' }
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
    "Small steps every day lead to big results over time.",
    "Your energy is contagious—spread kindness today."
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
