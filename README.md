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

## Anatomy image guide

The default measurement guide uses the owner's supplied anatomy illustration, displayed at 74% opacity on a pale background. A CSS display crop suppresses peripheral organ labels. The original image is preserved unchanged. The view highlights one tape location at a time for neck, chest, waist, hip, upper arm, or thigh. Select a chip, tap a landmark, or focus a measurement field to update it. Zoom controls enlarge the selected area up to 2× and reset to the full body. Female settings move the waist marker to the natural waist.

This is a front-view illustration rather than a rotatable 3D model. The current page does not import WebGL code or precache its mesh/library. The reference JPEG is about 339 KB. If the image fails to load, its overlay is hidden, the written instructions remain usable, and a retry button appears.

Existing local data, Thai/English, height in cm, circumferences in inches, weight in kg, history editing, charts, backups, and PWA functionality are retained. The high-DPI chart height fix remains. Cache version 5 loads the new image guide.

### Checks

- `node --check app.js`, `node --check units.js`, `node --check studio.js`, `node --check sw.js` — active JavaScript syntax checks.
- Image provenance and earlier model licenses: [assets/ATTRIBUTION.md](assets/ATTRIBUTION.md).
- `node tools/check-guide.mjs` validates the retained, inactive 3D mesh; it is not a test of the current image-based interface.
