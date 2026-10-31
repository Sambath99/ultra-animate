---
name: ultra-animate
description: Make a silent 3D animated showcase video (9:16 or 16:9 MP4/HTML) from any topic, file or image. Styles - 3D map route, newspaper headline, ink wash, product teardown, paper desk, stat chart; can combine several. 3D only, no voice, no host, no brand colors. Always asks the user to pick styles first.
---

# ultra-animate (3D style reels, no voice, no face, no project setup)

## 0. Get the engine (nothing to attach)
The engine is on GitHub: `git clone https://github.com/Sambath99/ultra-animate.git` (public; skip if the folder already exists in the session). Then `cd ultra-animate && npm install && npx playwright install chromium`. Render in the cloud workspace; the user attaches nothing and installs nothing. Send only the finished video/HTML.

User drops a topic, a file (PDF/doc/sheet), an image or a link. You decide which 3D style(s) fit, ask them to confirm, then output a video. Everything is three.js rendered in headless Chromium, deterministic `render(t)`, frames to FFmpeg. No Kiri voice, no Bong Mouy, no NGX branding: pick colors that suit the topic. 3D only; never add flat 2D slides.

## 1. ASK FIRST — every use (AskUserQuestion, one call, selectable options)
1. **Style(s)** (multi-select, recommend 1 to 3 based on what they dropped; say why in the option description):
   - `stat-chart`: huge counting number over a glowing 3D growth line (revenue, students, results)
   - `map-route`: 3D city with a route drawing itself (location, journey, campus, "find us")
   - `headline`: 3D newspaper with highlighted key lines (news, claims, quotes, announcements)
   - `ink-wash`: layered 3D mountains + red sun, poetic quote (brand mood, quotes, calm intros)
   - `teardown`: exploded 3D product/stack with labelled parts (how it works, tools, features, steps)
   - `paper-desk`: paper chart + pen circle + note card + sticky tape on a desk (insight, tip, analysis)
   - `Combine` is automatic when several are chosen: one segment per style, crossfaded, with a grid end card.
2. **Mood / theme**: let them pick from `noir, ivory, ocean, forest, sunset, mono, jade, rose` (or "you choose"). Recommended = what fits the topic (finance/tech noir or ocean, culture ivory, nature forest). Do NOT default to NGX navy/red.
3. **Format and length**: 9:16 1080x1920 (TikTok/Reels, default), 16:9 1920x1080, or 1:1. Length 15 s / 30 s / 45 s (about 5 to 8 s per style plus 1.5 s command intro and 3 s end card).
4. **Delivery**: HTML preview first (fast check) or straight to MP4. End card: grid of styles + CTA text, plain end, or none.
If the user already answered some, skip those. Never assume from a previous video.

## 2. Content
- File/image: read it first (file-reading / pdf-reading skills; view the image). Extract real facts, numbers, names, places. Never invent figures; if a number is only a placeholder, set `footnote: "illustrative numbers"`.
- Topic only: write concise props yourself and show a 5-line storyboard before building.
- Khmer text works (UA Kantumruy font is embedded). Keep each text short.

## 3. Build the spec
Write `reel.json`:
```
{ "w":1080,"h":1920,"intro":true,
  "segments":[{"style":"stat-chart","dur":6,"theme":"noir","cmd":"/stat-chart","hint":"Big number + glowing 3D growth line","caption":"","props":{...}}],
  "end":{"type":"grid","title":"...","sub":"...","cta":"...","cta2":"..."} }
```
Themes: noir, ivory, ocean, forest, sunset, mono, jade, rose, or an object `{bg,fg,mute,accent,card,paper}`. Different themes per segment are fine; keep it intentional.
Props per style (all optional, sensible demo defaults exist):
- stat-chart: `kicker,label,prefix,unit,from,to,decimals,footnote,series[],xlabels[],marks[{i,text,sub}]`
- map-route: `seed,title,start,dest,dist,via,end,places[]`
- headline: `paper,section,date,head,byline,body,highlights[],highlightLines[],fovk`
- ink-wash: `text,sub,seal,layers,seed`
- teardown: `kind:"keyboard"|"stack"`, `parts[]` (your own layers: name/sub)
- paper-desk: `title,series[],circleAt,pen,note,sticky,fig`
Read the `make(P,...)` of the chosen style in `lib/` to see the exact prop names. Camera zoom for portrait can be tuned with `props.fovk` (>1 = wider).
`example_reel.json` is a full 6-style demo.

## 4. Build, check, render
Setup once per machine/session, inside the skill folder (the one with `package.json`): `npm install` then `npx playwright install chromium`. FFmpeg with libx264 is required. Run all commands from that folder.
1. `node lib/build.js reel.json out.html`
2. `node lib/preview.js out.html` -> stills + `contact_sheet.jpg`. LOOK at it: cropped text, empty areas, overlaps. Fix props or `fovk`.
3. HTML-first: send the html (SendUserFile). MP4: `node lib/render.js out.html out.mp4 --fps 30` in the background (WebGL via SwiftShader, about 1 to 1.5 s per frame per worker on 2 cores; a 30 s video takes roughly 10 to 15 min). Send the mp4 (files over ~30 MB can't be copied to a linked device; send via SendUserFile).
4. Silent video: say so; offer to add music or voice later with other skills.

## 5. Adding new styles (user will add more later)
Create `lib/ua_style_x_<name>.js` containing `STYLES['<name>'] = {name, desc, make(P, th, W, H){ ... return {scene, cam, frame(t, d){...}} }}` using helpers from `ua_core.js` (THREE as `T`, `cvTex`, `label`, `envScene`, `particles`, easing `o3 io3 spring pr cl lerp`, `theme`, `FONT`). `build.js` auto-includes it; add the style to the list in section 1 and to the FK zoom table in `ua_main.js` if portrait needs a wider fov. Always 3D (real perspective camera movement), never flat slides.

## Lessons
- Check the contact sheet before rendering; portrait framing is the usual problem.
- Keep text on screen minimal and big; one idea per segment.
- Do not reuse NGX colors unless the user asks.
