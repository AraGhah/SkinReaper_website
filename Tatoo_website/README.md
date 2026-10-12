# Skinreaper

Bilingual (English / French) booking website for Skinreaper, tattoo artist at Velours Tattoo, 3455 Saint-Laurent Blvd, Montréal.

Mobile first, dark editorial design, motion driven animations, a 3 step booking flow with a real calendar and time slots, and an optional Google Calendar backend that books clients automatically.

Built with **React 19**, **Vite** and **Motion** (`motion/react`).

---

## 1. What is in the project

```
.
├── index.html             Vite entry: meta tags, fonts, <div id="root">
├── package.json           Scripts and dependencies
├── vite.config.js         Vite + React plugin
├── vercel.json            Vercel build settings and the old /Skinreaper.dc.html redirect
├── booking-backend.gs     Google Apps Script: calendar availability + automatic booking + emails
├── public/
│   ├── favicon.svg
│   └── img/               w1.png ... w10.png portfolio photos, studio.png
└── src/
    ├── main.jsx           Mounts the app
    ├── App.jsx            Page layout, intro, scroll lock
    ├── config.js          Booking settings, contact links, portfolio list
    ├── dict.js            Every visible string, English and French
    ├── styles.css         All styles and design tokens
    ├── lib/               Time zone helpers, image resizing, language context, hooks
    └── components/        Nav, Hero, Marquee, Work, Lightbox, Sections, Booking, motion helpers
```

---

## 2. Run it locally

Requirements: Node.js 20 or newer, an internet connection (Google Fonts) and a recent browser.

```bash
# from the Tatoo_website folder, once
npm install

# live preview, updates instantly on every save
npm run dev

# production build into dist/
npm run build

# serve the production build
npm run preview
```

Open `http://localhost:5500`. `npm run dev` opens it in your browser automatically.

---

## 3. How the page is built

The site is a single page React app. Sections, in page order: Hero, Marquee, Work (filterable gallery + lightbox), About, Pricing, FAQ, Booking, Studio, Footer.

| File | Role |
| --- | --- |
| `src/App.jsx` | Puts the sections together, plays the intro once per session, locks scrolling while the menu or lightbox is open |
| `src/lib/lang.jsx` | Language context. `useLang()` returns `{ lang, t, setLang }`, where `t` is the current `DICT` entry |
| `src/components/motion.jsx` | Reusable animation pieces: `Reveal`, `SplitText`, `ClipReveal`, `ParallaxImg`, `Magnetic`, `CountUp` |
| `src/components/Booking.jsx` | The booking form: steps, validation, calendar, slots, photos, sending |
| `src/lib/time.js` | Studio time zone helpers, calendar slots and opening days |

### Design tokens

Defined as CSS variables at the top of `src/styles.css`.

| Token | Value |
| --- | --- |
| Background | `--bg` `#0A0A0A`, surfaces `--surface` `#121211` |
| Accent | `--accent` `#C8372D` (progress bar, markers) |
| Headings | Anton, uppercase |
| Body | Archivo, 300 to 700 |
| Labels | JetBrains Mono |
| Breakpoints | 700px (tablet) and 1080px (desktop) |

---

## 4. Configuration

Edit the `PROPS` object in `src/config.js`.

| Prop | Section | What it does |
| --- | --- | --- |
| `lang` | Site | Default language, `en` or `fr`. The visitor's choice is saved in `localStorage` (`sr_lang`) |
| `bookingUrl` | Booking | Google Apps Script Web app URL. When set, booking is automatic (section 6) |
| `formEndpoint` | Booking | Fallback email service used only when `bookingUrl` is empty. Default `https://formsubmit.co/ajax/skinreaper_@outlook.com` |
| `gcalId` | Google Calendar | Optional. Public calendar ID, read only availability |
| `gcalKey` | Google Calendar | Optional. Google API key used with `gcalId` |

Priority when sending a booking: `bookingUrl` first, otherwise `formEndpoint`.
Priority for availability: `bookingUrl`, then `gcalId` + `gcalKey`, otherwise no blocking.

---

## 5. The booking flow

Three steps, validated before you can continue.

1. **The tattoo**: idea, style, size, placement, black and grey or colour, budget, optional reference photos (up to 4, resized in the browser).
2. **When**: month calendar (Tuesday to Saturday only, past days blocked), then time slots, then "first tattoo?".
3. **You**: pregnancy question, four acknowledgements, name, email, optional phone and Instagram, preferred contact method.

Rules built in:

- Answering **Yes** to the pregnancy question blocks submission and shows the policy.
- Sunday and Monday are closed.
- Weekday slots: 11:00, 13:00, 15:00, 17:00, 18:00.
- Saturday slots: 11:00 full day (8 h), 11:00 half day (4 h), 15:00 half day (4 h).
- All times are interpreted in the studio time zone, `America/Toronto`, even if the client is elsewhere.
- The Back / Continue bar is sticky at the bottom of the form on mobile.

After sending, the screen shows Sending, then Booked (or Delivered), or a fallback with email, Instagram and copy buttons if something fails.

---

## 6. Automatic booking with Google Calendar (recommended)

`booking-backend.gs` is a free Google Apps Script that lives in the artist's Google account.

When the site has `bookingUrl` set, a booking does all of this with no manual step:

1. Re-checks the slot against the Google Calendar (blocks double bookings).
2. Creates the event in the calendar.
3. Sends the client a Google Calendar invite.
4. Emails the client a confirmation, in English or French.
5. Emails the artist the full details with the reference photos attached.

If the slot was just taken, the client is sent back to the calendar with a message to pick another time.

The same script answers `GET ?action=busy` so booked days and slots are greyed out on the site.

### Setup (about 5 minutes)

1. Go to **script.google.com** and click **New project**.
2. Delete the sample code, paste in all of `booking-backend.gs`, click **Save**.
3. Click **Deploy**, then **New deployment**, gear icon, **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**, then **Authorize access**, choose the Google account, **Advanced**, **Go to project**, **Allow**.
5. Copy the **Web app URL**. It ends in `/exec`.
6. Paste it into `bookingUrl` in the `PROPS` object of `src/config.js`.
7. Check it: opening the URL in a browser must show `{"ok":true,"service":"skinreaper-booking"}`.
8. Make one test booking.

Updating the script later: **Deploy**, **Manage deployments**, edit, **New version**, **Deploy**. The URL stays the same.

### Script settings (top of `booking-backend.gs`)

```js
var CONFIG = {
  CALENDAR_ID: 'primary',      // or a specific calendar id
  TZ: 'America/Toronto',
  OPEN_DAYS: [2, 3, 4, 5, 6],  // ISO weekdays, 1 Monday ... 7 Sunday
  OPEN_HOUR: 11,
  CLOSE_HOUR: 19,
  LOCATION: 'Velours Tattoo, 3455 Saint-Laurent Blvd, Montréal, QC H2X 2T6',
  MAX_BOOKINGS_PER_EMAIL: 3,   // per 6 hours, stops spam
  ARTIST_EMAIL: '',            // empty = the Google account that owns the script
  ARTIST_NAME: 'Skinreaper',
  INSTAGRAM: 'https://instagram.com/_skinreaper',
  MAX_DAYS_AHEAD: 200
};
```

Tip: before deploying, select `testSetup` in the editor and click **Run**. It asks for permissions once and logs the calendar name, the artist email and the busy times for the next two weeks.

Blocking rules in the script:

- Any calendar event that overlaps the slot blocks it (events marked Free / transparent do not).
- An all day event blocks the whole day.
- To take a day off, create an all day event on that day.

### Limits to know

- Apps Script sends about 100 emails per day on a free Google account. That is plenty for a studio.
- Reference photos are resized to 1200 px JPEG and limited to 4 per booking.
- The client must have a valid email, otherwise the invite cannot be sent.

---

## 7. Fallback modes (no backend)

### Email only, no calendar (default until `bookingUrl` is set)

The form posts to `formEndpoint` (FormSubmit). The first request triggers a one time activation email to the address in the URL. Click the link once, then every request arrives automatically.

- It only works from a real hosted domain, not from a local file or preview. In preview, the "Not delivered" screen with the email / Instagram / copy buttons is expected.
- Each email includes an "add to my calendar" link so the artist can add the slot in one click.
- Reference photos are not attached in this mode. The email says how many photos the client chose so the artist can ask for them. Attachments only work with the Google Apps Script backend.

### Read only calendar blocking (optional)

Fill `gcalId` and `gcalKey`. The calendar must be public. This only blocks times on the site. It cannot create events.

1. Google Cloud Console, create a project, enable **Google Calendar API**.
2. Create an **API key**, restrict it to the Calendar API and to your site's domain.
3. Calendar settings, **Access permissions**, make it public, and copy the **Calendar ID**.

---

## 8. Editing content

All visible text is in `DICT` in `src/dict.js`. Every key exists in both `en` and `fr`.

| To change | Edit |
| --- | --- |
| Hero line, about text, FAQ | `DICT.en.*` and `DICT.fr.*` |
| Prices | `DICT.<lang>.pricing.rates` and the pricing FAQ answer |
| Studio hours shown on the page | `DICT.<lang>.studio.pending`, `footer.hours`, `book.weekNote`, `book.satNote`, and the "When do you tattoo?" FAQ |
| Time slots | `DICT.<lang>.book.slotsWeek` and `slotsSat` |
| Open days | `isClosedDow` in `src/lib/time.js` (calendar), and `OPEN_DAYS` in the script |
| Booking style / size / placement / budget options | `DICT.<lang>.book.styles`, `sizes`, `places`, `budgets` |
| Acknowledgement checkboxes | `DICT.<lang>.book.acks` |
| Auto booking wording | `AUTO.en` and `AUTO.fr` in `src/dict.js` (used only when `bookingUrl` is set) |
| Portfolio photos, order, category, placement label | `WORKS` in `src/config.js` |
| Gallery filters | `CATS` in `src/config.js` |
| Hero, About and Studio photos | `HERO_IMG`, `ABOUT_IMG`, `STUDIO_IMG` in `src/config.js` |
| Contact email, Instagram | `EMAIL`, `IG_URL`, `IG_HANDLE` in `src/config.js` |
| Studio address and map | `DICT.<lang>.studio`, and `MAPS_URL` / `MAP_EMBED` in `src/config.js` |

Slot labels must start with the hour (`11:00`, `11 h`). Labels containing `full day` / `journée complète` count as 8 h, `half day` / `demi` as 4 h, anything else as 2 h. The backend and the calendar blocking read those labels.

### Adding portfolio photos

1. Put the image in `public/img/` (for example `public/img/w11.png`).
2. Add a line to `WORKS` in `src/config.js`:
   ```js
   { src: '/img/w11.png', cat: 'cyber', place: { en: 'Thigh', fr: 'Cuisse' } },
   ```
3. `cat` must be `cyber` or `lettering`, or add a new key to `CATS`.

---

## 9. Animations

All animations use Motion (`motion/react`).

| Where | Effect |
| --- | --- |
| First visit | Brand curtain intro, once per browser session |
| Whole page | Red scroll progress bar, film grain overlay, buttons roll their label on hover |
| Navigation | Hides when scrolling down and comes back when scrolling up, a pill slides to the active section, the language pill slides between EN and FR |
| Hero | Title revealed word by word, photo wipes open then drifts and zooms with the scroll, text fades out as you scroll, magnetic main button, scroll cue |
| Marquee | Speeds up and reverses with the scroll direction |
| Work | Sliding filter pill, tiles rearrange smoothly, photos wipe open, hover zoom dims the other tiles, custom "View" cursor on desktop |
| Lightbox | Slides in the direction you navigate, swipe or drag to change photo, thumbnails, arrow keys and Esc |
| About and Studio | Photos wipe open with parallax, tags appear one after another |
| Pricing | Prices count up, cards lift and follow the mouse with a soft light |
| FAQ | Answers open with a height animation, plus turns into minus |
| Booking | Progress bar between steps, steps slide in the right direction, selected options, day and time slide between choices, errors shake, photo thumbnails pop, check mark draws on success |
| Mobile | Menu opens as a circle from the corner with staggered links, bottom bar slides in and out |

Visitors who turn on "reduce motion" in their system settings get the content without movement.

---

## 10. Mobile

- The layout switches to mobile below 1080px: compact top bar (logo, EN / FR, menu), full screen menu, and a fixed bottom bar with **Book**, **Instagram** and **Map**.
- The bottom bar hides while the booking section is on screen and while the menu or lightbox is open.
- Tap targets are at least 44 px (48 px for the main actions).
- The calendar uses 44 px cells.

---

## 11. Deploy

`npm run build` produces a static site in `dist/`. Any static host works.

| Host | How |
| --- | --- |
| Vercel | Connect the repo and set **Root Directory** to `Tatoo_website`. `vercel.json` sets the rest (Vite, `npm run build`, output `dist`) |
| Netlify / Cloudflare Pages | Base directory `Tatoo_website`, build command `npm run build`, output directory `dist` |
| Any other host | Run `npm run build` and upload the contents of `dist/` |

On Vercel, if the project settings still say Framework Preset **Other** and Output Directory `.` from the old version, clear those overrides (or set them to Vite and `dist`). `vercel.json` already contains the right values.

After deploying:

1. Set `bookingUrl` (section 6) or activate FormSubmit (section 7).
2. If you use an API key, restrict it to your domain.
3. Make a test booking in English and one in French.
4. Check a Saturday slot and a weekday slot.
5. Confirm the invite and both emails arrive.

---

## 12. Before launch checklist

Content still to supply or confirm:

- [ ] Deposit, cancellation and no show terms (the Policies section says they are being finalised)
- [ ] Taxes and minimum charge
- [ ] Real flash sheets and prices (the Flash section was removed until artwork exists)
- [ ] Healed and touched up photos (the Healed section was removed until photos exist)
- [ ] Real client reviews (none are shown until they are real)
- [ ] Final wording of the touch up, pregnancy and medication policies
- [ ] Alt text and captions for new photos
- [ ] Final contact email and social handles in the footer

Technical:

- [ ] `bookingUrl` set and tested
- [ ] Studio hours match the script `CONFIG`
- [ ] Social share image (not included, the favicon is in `public/favicon.svg`)
- [ ] Privacy note if analytics are added later

---

## 13. Privacy and safety notes

- Medical details are never collected by the form. Clients are told to give medication and health information directly or on the consent form.
- The aftercare section does not diagnose. It tells people to write to the artist and see a doctor for warning signs.
- Reference photos are sent only to the artist's email and are not stored by the site.
- The site is 18+ only.

---

## 14. Troubleshooting

| Problem | Cause and fix |
| --- | --- |
| Page is blank | Open the browser console. Locally, run `npm install` again. On a host, check that the build ran and the output folder is `dist` |
| Vercel shows 404 NOT_FOUND | Root Directory is not set to `Tatoo_website`, or the dashboard overrides the output directory with `.` |
| Gallery images missing | Check the `src` paths in `WORKS` (they start with `/img/`) and that the files are in `public/img/` |
| "Not delivered" after sending | No `bookingUrl`, or FormSubmit not activated, or testing from a local file. Use the fallback buttons or finish section 6 |
| Booked slots are not blocked | `bookingUrl` is empty, or the script was not redeployed as **Anyone**, or the browser blocked the request. Open the URL directly to test |
| Script says authorization required | Redo step 4 of section 6 |
| Slot says taken but the calendar looks free | An event overlaps the slot, or a Free / transparent event is on a different calendar than `CALENDAR_ID` |
| Wrong time in the calendar | `TZ` in the script does not match the studio time zone |
| No animations | "Reduce motion" is turned on in the system settings. This is intended |
| Intro does not play again | It plays once per browser session. Open a new tab or window to see it again |
| Languages reset | `localStorage` is blocked. The default `lang` prop is used |

---

## 15. Credits and licence

Design and build for Skinreaper. All tattoo photographs belong to Skinreaper and may not be reused without permission. Add your own licence here before publishing the code.
