# AutoTailor AI — Chrome & Edge Extension (JobRight.ai Style)

A Manifest V3 browser extension for **Shamir Khan** that provides 1-click in-page application autofill on all major ATS platforms (**Greenhouse, Lever, Workday, Ashby, SmartRecruiters, iCIMS, Eightfold**).

---

## Why an Extension (JobRight.ai / Simplify Style)?

1. **Zero Bot Detection / CAPTCHA**: Runs directly inside your regular everyday Chrome or Edge browser. Cloudflare, Turnstile, and PerimeterX recognize your normal user session.
2. **Logged-In Session Compatibility**: You stay logged in to your existing Workday, Greenhouse, or candidate portal accounts.
3. **In-Page Floating Widget**: Injects an Apple-styled frosted glass widget directly in the bottom-right corner of ATS application forms with a **"⚡ 1-Click Autofill"** button.
4. **Local AI Engine Sync**: Connects to your running AutoTailor dashboard at `http://localhost:8500` to access the Gemini 3.8 Flash Application Q&A solver!

---

## 10-Second Quick Setup Guide

1. Open **Google Chrome** (or Microsoft Edge, Brave, Arc).
2. In the URL address bar, navigate to:
   ```
   chrome://extensions
   ```
3. In the top-right corner, toggle **Developer mode** to **ON**.
4. Click the **Load unpacked** button (top left).
5. Select the `extension` folder located at:
   ```
   C:\Users\shami\OneDrive\Desktop\Coding\Full-Stack Projects\Internship-AI-Agent\extension
   ```
6. The extension is now active! You will see the **⚡ AutoTailor AI** icon in your browser toolbar.

---

## How to Use

1. Browse internships on your AutoTailor dashboard at [http://localhost:8500](http://localhost:8500).
2. Click **"↗ Direct Apply"** on any job card to open the company's application page.
3. Look at the bottom right corner of the page: the **⚡ AutoTailor AI** floating pill widget will appear automatically.
4. Click **"⚡ 1-Click Autofill"**:
   - First Name, Last Name, Email, Phone
   - LinkedIn, GitHub, Portfolio URL
   - Wilfrid Laurier University, Computer Science, Class of 2028
   - Work Authorization = Yes, Sponsorship = No
5. Use the extension icon in your toolbar anytime to solve custom application questions using **Gemini 3.8 Flash**!
