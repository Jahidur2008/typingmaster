/**
 * Seed script for Touch Typing Courses and Lessons (at least 20 lessons).
 * Covers Beginner → Intermediate → Advanced progression.
 */

const { Course, Lesson } = require("../models");

const COURSES_DATA = [
  {
    title: "Beginner: Home Row Foundation",
    slug: "beginner-touch-typing",
    description: "Learn the home row keys (ASDF JKL;), proper finger resting posture, and basic words.",
    language: "english",
    difficulty: "beginner",
    order: 1,
    published: true,
    lessons: [
      {
        title: "Home Row Anchors: F and J",
        description: "Feel the bumps on your F and J keys to anchor your index fingers.",
        instructions: "Place your left index finger on F and your right index finger on J. Feel the small raised ridges on each key. Press each key without looking down, and use your thumbs for space.",
        content: "f j ff jj fj jf fff jjj fjf jfj ff jj f j f j ff jj fj jf",
        targetWpm: 12,
        targetAccuracy: 90,
        order: 1,
      },
      {
        title: "Left Hand Home Keys: A, S, D, F",
        description: "Practice the four home keys for your left hand: pinky on A, ring on S, middle on D, index on F.",
        instructions: "Rest your left pinky on A, ring on S, middle on D, and index on F. Keep your wrists hovering slightly above the desk, not resting.",
        content: "a s d f as df asdf fdsa fa da sa asdf as df fa da fd sa asdf",
        targetWpm: 15,
        targetAccuracy: 90,
        order: 2,
      },
      {
        title: "Right Hand Home Keys: J, K, L, ;",
        description: "Master the right hand keys: index on J, middle on K, ring on L, pinky on semicolon.",
        instructions: "Rest your right index on J, middle on K, ring on L, and pinky on semicolon (;). Relax your shoulders and strike lightly.",
        content: "j k l ; jk l; jkl; ;lkj ;l kj jk l; jkl; ;lkj kl j; jk l;",
        targetWpm: 15,
        targetAccuracy: 90,
        order: 3,
      },
      {
        title: "Full Home Row Drill",
        description: "Combine both hands across all eight home row keys.",
        instructions: "Keep all fingers gently touching their home keys. Only lift the striking finger, then return it immediately to home position.",
        content: "a s d f j k l ; asdf jkl; a; sl dk fj fj dk sl a; asdf jkl; fdsa ;lkj",
        targetWpm: 18,
        targetAccuracy: 90,
        order: 4,
      },
      {
        title: "Center Reach: G and H",
        description: "Reach inward with your index fingers: left index reaches G, right index reaches H.",
        instructions: "Left index stretches right to hit G and snaps back to F. Right index stretches left to hit H and snaps back to J.",
        content: "f g f j h j fg jh g h f g j h g h gh hg f g j h fgf jhj asdfg hjkl;",
        targetWpm: 18,
        targetAccuracy: 90,
        order: 5,
      },
      {
        title: "First Real Words on Home Row",
        description: "Form complete English words using only the home row keys.",
        instructions: "Type in a smooth, continuous rhythm. Say each letter in your head as your finger strikes the key.",
        content: "all fall shall glad flash salad flags half glass dash salsa flask all fall",
        targetWpm: 20,
        targetAccuracy: 90,
        order: 6,
      },
      {
        title: "Home Row Rhythm & Fluency",
        description: "Build steady speed and muscle memory on home row sentences.",
        instructions: "Do not pause between letters. Focus on a steady metronome rhythm with spacebar presses.",
        content: "a lad had a salad a fall flag had a flash shall all lads fall as a glad lad had flags",
        targetWpm: 22,
        targetAccuracy: 90,
        order: 7,
      },
    ],
  },
  {
    title: "Intermediate: Top & Bottom Rows",
    slug: "intermediate-keyboard-mastery",
    description: "Expand your reach to the top row (QWERTY) and bottom row (ZXCVBNM) with punctuation.",
    language: "english",
    difficulty: "intermediate",
    order: 2,
    published: true,
    lessons: [
      {
        title: "Top Row Index: R and U",
        description: "Reach up and slightly inward with your index fingers for R and U.",
        instructions: "Left index reaches up from F to R. Right index reaches up from J to U. Return to F and J immediately.",
        content: "f r f j u j fr ju r u fur rug jar jug fur run fur rug run jar jug fur",
        targetWpm: 20,
        targetAccuracy: 90,
        order: 8,
      },
      {
        title: "Top Row Middle: E and I",
        description: "The two most frequent vowels: E (left middle) and I (right middle).",
        instructions: "Reach left middle up from D to E. Reach right middle up from K to I. These keys appear in nearly every English word.",
        content: "d e d k i k de ki e i die red lie kid ride like fire file life hide side",
        targetWpm: 22,
        targetAccuracy: 90,
        order: 9,
      },
      {
        title: "Top Row Ring & Pinky: W, Q, O, P",
        description: "Strengthen your outer fingers reaching to the upper row.",
        instructions: "Left ring reaches S to W, left pinky reaches A to Q. Right ring reaches L to O, right pinky reaches ; to P.",
        content: "sw w ol o aq q ;p p sow pow row flow slow work word quick quiet people open",
        targetWpm: 22,
        targetAccuracy: 90,
        order: 10,
      },
      {
        title: "Top Row Center Reach: T and Y",
        description: "Extend your index fingers up and diagonally to T and Y.",
        instructions: "Left index extends to T. Right index extends to Y. Keep your wrist steady.",
        content: "ft t jy y try fly they year city yesterday play today stay try city party",
        targetWpm: 24,
        targetAccuracy: 90,
        order: 11,
      },
      {
        title: "Bottom Row Index: V, B, N, M",
        description: "Reach downward with your index fingers into the bottom row.",
        instructions: "Left index drops to V and B. Right index drops to N and M. Move only the finger, not the entire wrist.",
        content: "fv v fb b jn n jm m van ban man name moon move vine view novel brave",
        targetWpm: 24,
        targetAccuracy: 90,
        order: 12,
      },
      {
        title: "Bottom Row Left: Z, X, C",
        description: "Navigate the lower-left keys with your left hand fingers.",
        instructions: "Left pinky drops to Z, ring drops to X, middle drops to C. Return to home row right away.",
        content: "az z sx x dc c zero zone exam zinc cool call calm cycle exact citizen",
        targetWpm: 24,
        targetAccuracy: 90,
        order: 13,
      },
      {
        title: "Punctuation Keys: Comma, Period, Slash",
        description: "Learn essential sentence punctuation with your right hand.",
        instructions: "Right middle finger drops to comma (,). Right ring drops to period (.). Right pinky drops to slash (/).",
        content: "k, , l. . look, see. walk, run. here, there. yes, no. fast, slow. done.",
        targetWpm: 25,
        targetAccuracy: 90,
        order: 14,
      },
    ],
  },
  {
    title: "Advanced: Numbers, Symbols & Speed",
    slug: "advanced-speed-and-symbols",
    description: "Conquer shift capitalization, the number row, programming symbols, and full paragraphs.",
    language: "english",
    difficulty: "advanced",
    order: 3,
    published: true,
    lessons: [
      {
        title: "Shift Keys & Capitalization",
        description: "Opposite-hand Shift technique for fast, error-free capitals.",
        instructions: "When typing a capital letter with your left hand, hold Right Shift with your right pinky. For right-hand capitals, hold Left Shift.",
        content: "The Quick Brown Fox Jumps Over The Lazy Dog. London, Paris, Tokyo, New York.",
        targetWpm: 26,
        targetAccuracy: 90,
        order: 15,
      },
      {
        title: "Number Row Left: 1, 2, 3, 4, 5",
        description: "Reach straight up from the top row to numbers 1 through 5.",
        instructions: "1 (left pinky), 2 (left ring), 3 (left middle), 4 and 5 (left index). Return fingers to home row after every number.",
        content: "1 2 3 4 5 12 34 51 25 123 451 2345 room 204 floor 3 order 15 door 42",
        targetWpm: 22,
        targetAccuracy: 90,
        order: 16,
      },
      {
        title: "Number Row Right: 6, 7, 8, 9, 0",
        description: "Reach up to numbers 6 through 0 with your right hand.",
        instructions: "6 and 7 (right index), 8 (right middle), 9 (right ring), 0 (right pinky).",
        content: "6 7 8 9 0 67 89 90 780 1984 2024 365 7890 item 68 cost 90 count 750",
        targetWpm: 22,
        targetAccuracy: 90,
        order: 17,
      },
      {
        title: "Programming & Math Symbols",
        description: "Type common coding symbols like brackets, operators, and tags.",
        instructions: "Combine Shift with the number row: ! @ # $ % ^ & * ( ) _ + = { } [ ]",
        content: "let x = 10; if (x > 5) { return x * 2; } user@domain.com price = $45.99; tag #code",
        targetWpm: 20,
        targetAccuracy: 90,
        order: 18,
      },
      {
        title: "Quotes & Dialogue Punctuation",
        description: "Practice quotation marks, colons, semicolons, and dashes.",
        instructions: "Right pinky holds Shift and presses Quote for double quotes (\"). Semicolon and colon use the same key.",
        content: 'She said, "Keep typing every day!" Note: speed follows accuracy; never rush.',
        targetWpm: 25,
        targetAccuracy: 90,
        order: 19,
      },
      {
        title: "Prose & Flow: Full Paragraph",
        description: "Integrate everything into natural, continuous English prose.",
        instructions: "Breathe naturally, look ahead to the next word, and maintain continuous rhythm without looking at your hands.",
        content: "Touch typing is not merely about raw finger speed. It frees your conscious mind from the mechanics of the keyboard so your thoughts can flow directly onto the screen.",
        targetWpm: 30,
        targetAccuracy: 90,
        order: 20,
      },
      {
        title: "Mastery Sprint: Speed Challenge",
        description: "The graduation sprint to prove your touch typing speed and accuracy.",
        instructions: "Aim for maximum consistency and accuracy above 90% while pushing your speed beyond 35 words per minute.",
        content: "Success in touch typing comes from consistent daily practice. Once your fingers know where to go, typing becomes as natural as speaking your mind to a friend.",
        targetWpm: 35,
        targetAccuracy: 90,
        order: 21,
      },
    ],
  },
  {
    title: "বাংলা টাইপিং: বর্ণমালা পরিচিতি (Letters)",
    slug: "bangla-letters-foundation",
    description: "স্বরবর্ণ ও ব্যঞ্জনবর্ণের সঠিক কিবোর্ড পজিশন ও আঙুলের মুভমেন্ট শিখুন।",
    language: "bangla",
    difficulty: "beginner",
    order: 4,
    published: true,
    lessons: [
      {
        title: "মৌলিক স্বরবর্ণ (Vowels 1)",
        description: "অ, আ, ই, ঈ, উ এবং ঊ অক্ষরের অনুশীলন।",
        instructions: "অভ্রতে o/a/i/ee/u এবং বিজয়ে F/gf/d/gD/s চাপুন। আঙুলের সঠিক অবস্থান বজায় রাখুন।",
        content: "অ আ ই ঈ উ ঊ অ আ ই ঈ উ ঊ অ আ ই ঈ উ ঊ অ আ ই ঈ উ ঊ",
        targetWpm: 10,
        targetAccuracy: 90,
        order: 1,
      },
      {
        title: "পরবর্তী স্বরবর্ণ (Vowels 2)",
        description: "ঋ, এ, ঐ, ও এবং ঔ অক্ষরের অনুশীলন।",
        instructions: "অভ্রতে r`/e/oi/O/ou এবং বিজয়ে ga/c/gC/x/gX দিয়ে অনুশীলন করুন।",
        content: "ঋ এ ঐ ও ঔ ঋ এ ঐ ও ঔ ঋ এ ঐ ও ঔ ঋ এ ঐ ও ঔ",
        targetWpm: 10,
        targetAccuracy: 90,
        order: 2,
      },
      {
        title: "ক ও চ বর্গ (Consonants: Ka & Cha Rows)",
        description: "ক, খ, গ, ঘ, ঙ এবং চ, ছ, জ, ঝ, ঞ বর্ণের অনুশীলন।",
        instructions: "আঙুল দিয়ে কিবোর্ডের মাঝের ও উপরের রোর কিগুলো আলতো করে চাপুন।",
        content: "ক খ গ ঘ ঙ চ ছ জ ঝ ঞ ক খ গ ঘ ঙ চ ছ জ ঝ ঞ ক খ গ ঘ",
        targetWpm: 12,
        targetAccuracy: 90,
        order: 3,
      },
      {
        title: "ট ও ত বর্গ (Consonants: Ta & Tha Rows)",
        description: "ট, ঠ, ড, ঢ, ণ এবং ত, থ, দ, ধ, ন বর্ণের অনুশীলন।",
        instructions: "মুভমেন্ট মসৃণ রাখুন। এক বর্ণ থেকে অন্য বর্ণে যাওয়ার সময় ছন্দ ঠিক রাখুন।",
        content: "ট ঠ ড ঢ ণ ত থ দ ধ ন ট ঠ ড ঢ ণ ত থ দ ধ ন ট ঠ ড ঢ",
        targetWpm: 12,
        targetAccuracy: 90,
        order: 4,
      },
      {
        title: "প বর্গ ও অন্তস্থ বর্ণ (Pa, Ya, Ra, La)",
        description: "প, ফ, ব, ভ, ম এবং য, র, ল, ব বর্ণের ড্রিল।",
        instructions: "হোম রো ও বটম রোর কিগুলোতে আঙুলের নিয়ন্ত্রণ বজায় রাখুন।",
        content: "প ফ ব ভ ম য র ল ব প ফ ব ভ ম য র ল ব প ফ ব ভ ম",
        targetWpm: 12,
        targetAccuracy: 90,
        order: 5,
      },
      {
        title: "শ, ষ, স, হ ও বিশেষ বর্ণ",
        description: "শ, ষ, স, হ, ড়, ঢ়, য়, ৎ, ং, ঃ, ঁ বর্ণের নিখুঁত অনুশীলন।",
        instructions: "অনস্বার, বিসর্গ ও চন্দ্রবিন্দুর কি পজিশন মুখস্থ করুন।",
        content: "শ ষ স হ ড় ঢ় য় ৎ ং ঃ ঁ শ ষ স হ ড় ঢ় য় ৎ ং ঃ ঁ",
        targetWpm: 14,
        targetAccuracy: 90,
        order: 6,
      },
    ],
  },
  {
    title: "বাংলা টাইপিং: কার ও যুক্তবর্ণ (Kar & Jukto-borno)",
    slug: "bangla-kar-and-conjuncts",
    description: "আ-কার, ই-কারসহ সকল কার চিহ্ন এবং জটিল যুক্তবর্ণ তৈরির দক্ষতা অর্জন করুন।",
    language: "bangla",
    difficulty: "intermediate",
    order: 5,
    published: true,
    lessons: [
      {
        title: "প্রাথমিক কার চিহ্ন (Basic Kar)",
        description: "া, ি, ী, ু, ূ কার চিহ্নের ছন্দময় অনুশীলন।",
        instructions: "ব্যঞ্জনের সাথে কার চিহ্ন যোগ করার সময় ব্যঞ্জন চেপে সাথে সাথে কার চাপুন।",
        content: "কা কি কী কু কূ গা গি গী গু গূ তা তি তী তু তূ পা পি পী পু পূ",
        targetWpm: 14,
        targetAccuracy: 90,
        order: 7,
      },
      {
        title: "উন্নত কার চিহ্ন (Advanced Kar)",
        description: "ৃ, ে, ৈ, ো, ৌ কার চিহ্নের দ্রুত রূপান্তর।",
        instructions: "অভ্র বা বিজয়ে একার ও ওকার তৈরির নিয়ম খেয়াল করুন।",
        content: "কৃ কে কৈ কো কৌ গৃ গে গৈ গো গৌ মৃ মে মৈ মো মৌ বৃ বে বৈ বো বৌ",
        targetWpm: 15,
        targetAccuracy: 90,
        order: 8,
      },
      {
        title: "মৌলিক যুক্তবর্ণ (Common Conjuncts 1)",
        description: "ক্ক, ক্ত, ক্ষ, জ্ঞ, ঙ্ক, ঙ্গ যুক্তবর্ণ ড্রিল।",
        instructions: "অভ্রতে kkh দিয়ে ক্ষ এবং ggy দিয়ে জ্ঞ পাওয়া যায়। বিজয়ে j+g+N ও u+g+I চাপুন।",
        content: "ক্ক ক্ত ক্ষ জ্ঞ ঙ্ক ঙ্গ শিক্ষা জ্ঞান রক্ত অঙ্ক বঙ্গ চক্কর অজ্ঞ বিজ্ঞান",
        targetWpm: 15,
        targetAccuracy: 90,
        order: 9,
      },
      {
        title: "দন্ত্য ও নাসিক্য যুক্তবর্ণ (Conjuncts 2)",
        description: "চ্চ, চ্ছ, জ্জ, ন্ত, ন্থ, ন্দ, ন্ধ, ম্প, ম্ব, ম্ভ যুক্তবর্ণের অনুশীলন।",
        instructions: "শান্ত মনে আঙুল চালান। হসন্ত লিঙ্কের পর সঠিক বর্ণ চাপুন।",
        content: "আনন্দ সুন্দর শান্ত গ্রন্থ বন্ধু অন্ধকার সম্মান লম্বা সম্পদ আরম্ভ ইচ্ছা চঞ্চল",
        targetWpm: 16,
        targetAccuracy: 90,
        order: 10,
      },
      {
        title: "র-ফলা ও য-ফলা (Phola Mastery)",
        description: "ক্র, প্র, ব্র, ট্র, ক্য, ব্য, দ্য, ন্য, স্য ফলার ব্যবহার।",
        instructions: "ব্যঞ্জনের সাথে ফলা যুক্ত করে দ্রুত শব্দ তৈরির অভ্যাস গড়ুন।",
        content: "গ্রাম প্রাণ ব্রত ট্রেন বাক্য ব্যথা বিদ্যা ধন্য সত্য প্রথম প্রকাশ তীব্র",
        targetWpm: 18,
        targetAccuracy: 90,
        order: 11,
      },
    ],
  },
  {
    title: "বাংলা টাইপিং: শব্দ, বাক্য ও অনুচ্ছেদ (Mastery)",
    slug: "bangla-sentences-mastery",
    description: "দৈনন্দিন শব্দ থেকে শুরু করে বিখ্যাত বাংলা বাণী ও সাহিত্যিক অনুচ্ছেদ টাইপিং।",
    language: "bangla",
    difficulty: "advanced",
    order: 6,
    published: true,
    lessons: [
      {
        title: "মৌলিক বাংলা শব্দভাণ্ডার (Daily Words)",
        description: "সবচেয়ে বেশি ব্যবহৃত বাংলা শব্দগুলোর সাবলীল টাইপিং।",
        instructions: "প্রতিটি শব্দের পর স্পেসবার দিয়ে স্বাভাবিক গতিতে টাইপ করুন।",
        content: "আমি আমরা তুমি তোমরা বই কলম পানি আকাশ নদী দেশ মাটি মানুষ ভালো সুন্দর",
        targetWpm: 18,
        targetAccuracy: 90,
        order: 12,
      },
      {
        title: "সহজ বাংলা বাক্য (Simple Sentences)",
        description: "কার ও পাংচুয়েশনযুক্ত সহজ বাক্য তৈরি।",
        instructions: "দাঁড়ি (।) দিতে অভ্রতে পিরিয়ড (.) অথবা বিজয়ে Shift+Period চাপুন।",
        content: "আমাদের দেশ বাংলাদেশ। এখানে নদী বয়ে যায়। সকালে সূর্য ওঠে। পাখি গান গায়। বই পড়া ভালো অভ্যাস।",
        targetWpm: 20,
        targetAccuracy: 90,
        order: 13,
      },
      {
        title: "যুক্তবর্ণ সমৃদ্ধ বাক্য (Complex Sentences)",
        description: "জ্ঞান, শিক্ষা, বিজ্ঞান ও স্বাধীনতা নিয়ে ভাবগম্ভীর বাক্য।",
        instructions: "যুক্তবর্ণ টাইপিংয়ে তাড়াহুড়ো না করে নির্ভুলতায় মনোযোগ দিন।",
        content: "শিক্ষাই জাতির মেরুদণ্ড। জ্ঞানীরা সর্বদা সত্যের সন্ধান করেন। বিজ্ঞান আমাদের প্রাত্যহিক জীবনকে সহজ করেছে। স্বাধীনতা মানুষের জন্মগত অধিকার।",
        targetWpm: 22,
        targetAccuracy: 90,
        order: 14,
      },
      {
        title: "সাহিত্যিক অনুচ্ছেদ ও বাণী (Literature Sprint)",
        description: "রবীন্দ্রনাথ ঠাকুর ও কাজী নজরুল ইসলামের ধ্রুপদী বাণী টাইপিং।",
        instructions: "বাংলা টাইপিংয়ের সর্বোচ্চ গতি ও নির্ভুলতা অর্জনে এই অনুচ্ছেদটি সম্পন্ন করুন।",
        content: "চিত্ত যেথা ভয়শূন্য উচ্চ যেথা শির জ্ঞান যেথা মুক্ত। মোরা একই বৃন্তে দুটি কুসুম হিন্দু মুসলমান। বাংলার মুখ আমি দেখিয়াছি তাই আমি পৃথিবীর রূপ খুঁজিতে যাই না আর।",
        targetWpm: 25,
        targetAccuracy: 90,
        order: 15,
      },
    ],
  },
];

async function seedCourses() {
  console.log("[seed] Seeding Touch Typing Courses & Lessons...");
  for (const courseData of COURSES_DATA) {
    const { lessons, ...courseFields } = courseData;

    let course = await Course.findOne({ slug: courseFields.slug });
    if (!course) {
      course = await Course.create(courseFields);
      console.log(`[seed] Created course: ${course.title}`);
    } else {
      await Course.updateOne({ _id: course._id }, { $set: courseFields });
    }

    for (const lessonData of lessons) {
      await Lesson.findOneAndUpdate(
        { course: course._id, order: lessonData.order },
        { ...lessonData, course: course._id },
        { upsert: true, new: true },
      );
    }
  }
  const totalLessons = await Lesson.countDocuments();
  console.log(`[seed] Courses and ${totalLessons} lessons seeded successfully.`);
}

module.exports = { seedCourses };

if (require.main === module) {
  require("dotenv").config();
  const { connectDB, disconnectDB } = require("../config/db");
  connectDB()
    .then(() => seedCourses())
    .then(() => disconnectDB())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[seed] Error seeding courses:", err);
      process.exit(1);
    });
}
