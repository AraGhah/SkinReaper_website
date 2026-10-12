# Skinreaper

Bilingual (English / French) booking website for Skinreaper, tattoo artist at Velours Tattoo, 3455 Saint-Laurent Blvd, Montréal.

Mobile first, dark editorial design, scroll animations, a 3 step booking flow with a real calendar and time slots, and an optional Google Calendar backend that books clients automatically.

---

## 1. What is in the project

```
.
├── index.html             The whole website (markup, styles, copy, logic), a Design Component file
├── support.js             Runtime that renders index.html. Keep it next to the page
├── vercel.json            Redirects the old /Skinreaper.dc.html address to the home page
├── image-slot.js          Drag and drop image placeholder helper (loaded by the page)
├── booking-backend.gs     Google Apps Script: calendar availability + automatic booking + emails
├── img/                   Create this folder and add the photos (not included in the repo)
│   ├── w1.png ... w10.png Portfolio photos (gallery, hero = w1, about = w8)
│   └── studio.png         Studio interior photo
└── README.md
```

There is no build step, no npm, no framework install. It is static files.

Until a photo exists in `img/`, the page shows a striped "Drop a photo here" slot in its place. Dropping an image on the slot (or clicking it) previews it for the current browser session only. Save the real file in `img/` with the exact name shown in the slot to publish it.

---

## 2. Run it locally

You need any static file server. A plain double click on the file can block `fetch` calls and images, so use a server.

```bash
# from the project folder, once
npm install

# live preview, reloads the page on every save
npm run dev

# plain static server, no reload
npm start
```

Open `http://localhost:5500`. `npm run dev` opens it in your browser automatically.

Without npm: `python -m http.server 8080`, then `http://localhost:8080`.

Requirements: an internet connection (Google Fonts: Anton and Archivo) and a recent browser.

| Feature | Needs |
| --- | --- |
| Scroll reveal animations | Chrome / Edge 115+, Safari 26+. Older browsers and Firefox show everything without the scroll effect |
| Everything else | Any current browser |

---

## 3. How the page is built

`index.html` is a single Design Component file with three parts:

1. **Template** (between `<x-dc><template>` and `</template></x-dc>`): all sections, inline styles, `{{ holes }}` for text and `<sc-for>` / `<sc-if>` / `<sc-else>` for lists and conditions. Events are written `on-click="method(args)"` (also `on-input`, `on-change`, `on-submit`), boolean attributes `if-disabled="expr"`.
2. **`PROPS`, `DICT` and `AUTO`** (top of the script): configuration, then every visible string in `en` and `fr`. Edit copy here.
3. **`class Component`** (bottom of the script): state and behavior (language, gallery filter, lightbox, FAQ, booking form, calendar, sending). `renderVals()` prepares the values the template reads.

`support.js` is the small runtime: it moves `<helmet>` into `<head>`, renders the template, and patches the DOM on each state change without losing focus or typed text.

Sections, in page order: Hero, Work (filterable gallery + lightbox), About, Styles, Pricing, Aftercare, FAQ, Policies, Booking, Studio, Footer.

Styling is inline on purpose. The only global CSS is the `<style>` inside `<helmet>` at the top (resets, fonts, `@keyframes`, reduced motion).

### Design tokens

| Token | Value |
| --- | --- |
| Background | `#0A0A0A`, panels `#0D0D0D` / `#101010` |
| Text | `#F2F2F0` main, `#A6A6A2` / `#8C8C88` / `#6E6E6B` muted |
| Error | `#E0736B` |
| Success | `#8FBF8F` |
| Headings | Anton, uppercase |
| Body | Archivo, 300 to 600 |
| Layout switch | Desktop at 1080px and up, mobile layout below |

---

## 4. Configuration (Tweaks panel)

These are the component props. Edit them in the `PROPS` object at the top of the script in `index.html`.

| Prop | Section | What it does |
| --- | --- | --- |
| `lang` | Site | Default language, `en` or `fr`. The visitor's choice is saved in `localStorage` (`sr_lang`) |
| `reduceMotion` | Site | Forces animations and parallax off |
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
6. Paste it into `bookingUrl` in the `PROPS` object of `index.html`.
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

All visible text is in `DICT` near the top of the script. Every key exists in both `en` and `fr`.

| To change | Edit |
| --- | --- |
| Hero line, about text, FAQ, aftercare, policies | `DICT.en.*` and `DICT.fr.*` |
| Prices | `DICT.<lang>.pricing.rates` and the pricing FAQ answer |
| Studio hours shown on the page | `DICT.<lang>.studio.pending`, `footer.hours`, `book.weekNote`, `book.satNote`, and the "When do you tattoo?" FAQ |
| Time slots | `DICT.<lang>.book.slotsWeek` and `slotsSat` |
| Open days | `closed = dow === 0 \|\| dow === 1` in `renderVals()` (calendar), and `OPEN_DAYS` in the script |
| Booking style / size / placement / budget options | `DICT.<lang>.book.styles`, `sizes`, `places`, `budgets` |
| Acknowledgement checkboxes | `DICT.<lang>.book.acks` |
| Auto booking wording | `AUTO.en` and `AUTO.fr` (used only when `bookingUrl` is set) |
| Portfolio photos, order, category, placement label | `this.works` array in the constructor |
| Gallery filters | `this.catLabels` and the `filters` list in `renderVals()` |
| Contact email, Instagram | Search for `skinreaper_@outlook.com` and `instagram.com/_skinreaper` |
| Studio address and map | Studio section, Google Maps link and the OpenStreetMap iframe |

Slot labels must start with the hour (`11:00`, `11 h`). Labels containing `full day` / `journée complète` count as 8 h, `half day` / `demi` as 4 h, anything else as 2 h. The backend and the calendar blocking read those labels.

### Adding portfolio photos

1. Put the image in `img/` (for example `img/w11.png`).
2. Add a line to `this.works`:
   ```js
   { src: 'img/w11.png', cat: 'cyber', place: { en: 'Thigh', fr: 'Cuisse' } },
   ```
3. `cat` must be `cyber` or `lettering`, or add a new key to `catLabels` and `filters`.

---

## 9. Animations

| Where | Effect |
| --- | --- |
| Page load | Nav drops in, hero title slides up line by line, hero photo zooms out, hero text fades up in sequence |
| Scroll | Section titles fade up, gallery photos wipe open and settle, About and Studio photos reveal, rows slide in, hero photo has a light parallax |
| Booking | Step changes drop in, selected calendar day pops, month grid slides, time slots drop in, green check draws on success |
| Mobile | Bottom bar slides up |

Scroll animations use CSS scroll timelines (`animation-timeline: view()`), so there is no scroll JavaScript for reveals. Parallax and the nav background are the only scroll handlers.

`prefers-reduced-motion` and the `reduceMotion` prop shorten all animations and stop parallax.

---

## 10. Mobile

- The layout switches to mobile below 1080px: compact top bar (logo, EN / FR, menu), full screen menu, and a fixed bottom bar with **Book**, **Instagram** and **Map**.
- The bottom bar hides while the booking section is on screen and while the menu or lightbox is open.
- Tap targets are at least 44 px (48 px for the main actions).
- The calendar uses 44 px cells.

---

## 11. Deploy

It is a static site. Upload the whole folder (keep `support.js`, `image-slot.js` and `img/` next to `index.html`).

| Host | How |
| --- | --- |
| Netlify | Drag the folder into Netlify Drop |
| Cloudflare Pages / Vercel | Connect the repo, build command empty, output directory `.` |
| GitHub Pages | Push the folder, enable Pages on the branch |

On Vercel the repository root is not the site: set **Root Directory** to `Tatoo_website`, Framework Preset **Other**, Build Command empty, Output Directory `.`.

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
- [ ] Favicon and social share image (not included)
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
| Page is blank | `support.js` missing or the path is wrong. Keep it beside `index.html` |
| Vercel shows 404 NOT_FOUND | Root Directory is not set to `Tatoo_website`, or `index.html` is missing |
| Gallery images missing | Check the `src` paths in `this.works` and that `img/` was uploaded |
| "Not delivered" after sending | No `bookingUrl`, or FormSubmit not activated, or testing from a local file. Use the fallback buttons or finish section 6 |
| Booked slots are not blocked | `bookingUrl` is empty, or the script was not redeployed as **Anyone**, or the browser blocked the request. Open the URL directly to test |
| Script says authorization required | Redo step 4 of section 6 |
| Slot says taken but the calendar looks free | An event overlaps the slot, or a Free / transparent event is on a different calendar than `CALENDAR_ID` |
| Wrong time in the calendar | `TZ` in the script does not match the studio time zone |
| No scroll animations | Browser without scroll timeline support. The page still works |
| Languages reset | `localStorage` is blocked. The default `lang` prop is used |

---

## 15. Credits and licence

Design and build for Skinreaper. All tattoo photographs belong to Skinreaper and may not be reused without permission. Add your own licence here before publishing the code.
