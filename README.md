# 🪁 Glimpse of Today — WhatsApp Message Generator

> A modern, mobile-first web application designed for teachers and educators to quickly compose, format, and share structured daily class session notes via WhatsApp.

![Glimpse of Today](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20JavaScript-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-orange?style=flat-square)

---

## 🌟 Overview

**Glimpse of Today** solves the daily hassle of manually typing repetitive class update messages for parents on WhatsApp. It provides a clean, fast interface to manage daily subject notes, maintain an 8-period weekly timetable, and output perfectly formatted WhatsApp Markdown text with a single tap.

### 📱 Target Output Format
```text
*🪁 GLIMPSE OF TODAY'S SESSION 🪁*

📆 1️⃣9️⃣-0️⃣7️⃣-2️⃣0️⃣2️⃣6️⃣
*🪂 Sunday*

_*👩🏻‍🏫 CLASS & DIV. :  2G*_
-----------------------------------------------------
🟥1. *_🔤 English_*
* Unit 1 S2 Notes given
-----------------------------------------------------
🟠2. *_🧮 C. E._*
* Favorite rhyme practiced
-----------------------------------------------------
💛3. *_✒️ Montessori_*
* Cards and counters activity
-----------------------------------------------------
```

---

## ✨ Key Features

- 📆 **Keycap Date & Emoji Engine**: Automatically formats dates into keycap emojis (`📆 1️⃣9️⃣-0️⃣7️⃣-2️⃣0️⃣2️⃣6️⃣`) with hyphenated segments.
- 🎨 **100 Background Emojis Array**: Automatically picks a fresh random emoji for the title banner and day of the week on every page refresh!
- 🗓️ **8-Period Slot Timetable**: Maintain full weekly schedules (Monday–Sunday) with support for duplicate subjects per day (e.g. Period #1 & Period #8) rendered separately with 1..8 period tags.
- 📋 **Block Actions (Paste & Clear)**: Every period note card includes dedicated `📋 Paste` (from system clipboard) and `🧹 Clear` buttons for lightning-fast input.
- 💬 **One-Tap WhatsApp Share**: Copy formatted Markdown text directly or trigger direct WhatsApp web/app sharing in one click.
- 🔒 **Generic & Private Preset Support**: Clean blank slate out-of-the-box for any teacher, plus background URL hash routing (`/#2G` or `/?2G`) for secret preset loading.
- 🌙 **Dark Mode & Glassmorphism UI**: Beautiful, responsive mobile-first UI with dark mode support.

---

## 🛠️ Technology Stack

- **Frontend**: Pure Semantic HTML5 & Vanilla JavaScript (ES6+)
- **Styling**: Vanilla CSS3 (Design Tokens, Glassmorphism, Responsive Grid & Flexbox)
- **Icons & Favicon**: Native Unicode Emojis + SVG Data URL Favicon (`🪁`)
- **Storage**: Browser `localStorage` for offline state persistence

---

## 🚀 Getting Started

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/glimps.git
   cd glimps
   ```

2. **Open in Browser**:
   - Double-click `index.html` to open directly in any browser.
   - Or start a local server:
     ```bash
     npx serve .
     # or
     python3 -m http.server 8080
     ```

3. **Access Secret Preset (Optional)**:
   Navigate to `http://localhost:8080/#2G` or `http://localhost:8080/?2G` to automatically load pre-configured class data.

---

## 🌐 Deploy to GitHub Pages

1. **Push your code**:
   ```bash
   git add .
   git commit -m "Initial commit for Glimpse of Today"
   git push origin main
   ```
2. **Enable Pages**:
   - Go to your repository on GitHub → **Settings** → **Pages**.
   - Under **Source**, choose **Deploy from a branch**.
   - Select Branch: **`main`** / Folder: **`/ (root)`** and click **Save**.

Your app will be live at:
`https://<your-username>.github.io/<repo-name>/`

---

## 📄 License

Distributed under the MIT License. Feel free to customize and use for your own school or class updates!
