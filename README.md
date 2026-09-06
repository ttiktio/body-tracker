# Body Tracker

เว็บจดสัดส่วนและคำนวณ % Body Fat แบบ local-first สำหรับ GitHub Pages

## Features
- บันทึก Weight, Waist, Neck, Hip, Chest, Arm, Thigh
- คำนวณ BMI
- ประมาณ % Body Fat ด้วย U.S. Navy formula
- คำนวณ Lean Mass / Fat Mass
- History + Edit / Delete
- กราฟ Weight / Body Fat / รอบสัดส่วน
- Export / Import backup JSON
- PWA / Add to Home Screen
- ข้อมูลเก็บใน localStorage ของอุปกรณ์ผู้ใช้

## Deploy on GitHub Pages
1. สร้าง Public repository ใหม่
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ไว้ที่ root ของ repo
3. ไปที่ Settings > Pages
4. Build and deployment > Deploy from a branch
5. Branch: main / root
6. Save
7. เปิด URL `https://USERNAME.github.io/REPOSITORY/`

## Privacy
ข้อมูลการวัดไม่ได้ถูกส่งไปยัง GitHub หรือ backend ของแอป
แต่ source code ของเว็บจะเป็น public หากใช้ public repository

## Important
ค่า Body Fat เป็นค่าประมาณ ไม่ใช่ผลตรวจทางการแพทย์

## 3D Studio redesign

The measurement screen now uses a real MakeHuman anatomical mesh with local Three.js rendering, studio lighting, soft shadows, subtle breathing, touch rotation, zoom, keyboard controls, and front/side/back views. Tap the body, choose a measurement chip, or focus a measurement field to move the tape. The tape follows a cross-section of the mesh; female settings move the waist guide to the natural waist. The neutral reference mannequin is not generated from the user's measurements.

All 3D assets are included in this repository (about 2.1 MB total before compression). No CDN, account, API key, or build step is required. The model loads only when opening measurements. Rendering pauses offscreen and in background tabs, with reduced-motion support. If WebGL or asset loading fails, the written guide and tracker remain available with a retry button.

Existing storage keys, mixed units (height in cm, circumferences in inches, weight in kg), Thai/English, history editing, charts, backups, and PWA support are preserved. Chart backing-store height is now stable across repeated redraws on high-DPI devices. The service-worker cache is versioned, and it only removes caches belonging to this app.

### Checks

- `node tools/check-guide.mjs` — validates the source mesh and all male/female measurement contours (Node 22+).
- `node --check app.js`, `node --check units.js`, `node --check studio.js`, `node --check body3d.js`, `node --check sw.js` — JavaScript syntax checks.
- Asset provenance and reproduction: [assets/ATTRIBUTION.md](assets/ATTRIBUTION.md).
