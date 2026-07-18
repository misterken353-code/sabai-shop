# sabai-shop — ร้านสบายพาณิชย์

เว็บไซต์ขายสินค้าออนไลน์สไตล์ Lazada สำหรับร้านสบายพาณิชย์

---

## 🌐 เว็บไซต์

| URL | สถานะ |
|-----|-------|
| https://geargao.com | ✅ Live |
| https://misterken353-code.github.io/sabai-shop | ✅ Live (GitHub Pages) |

---

## 🏪 ข้อมูลร้าน

| รายการ | ข้อมูล |
|--------|--------|
| ชื่อร้าน | ร้านสบายพาณิชย์ |
| แบรนด์ | geargao / geargao.com |
| เลขประจำตัวผู้เสียภาษี | 3330300831317 |
| เบอร์ติดต่อ | 080-7673617 |
| พร้อมเพย์ | 0807673617 |
| GitHub | misterken353-code/sabai-shop |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Hosting | GitHub Pages (Free) |
| Domain | geargao.com (via Cloudflare DNS) |
| DNS Provider | Cloudflare (Personal Account) |
| Registrar | Hostsevenplus |
| Frontend | HTML + CSS + JavaScript (Single File) |
| Storage | Static files on GitHub |

---

## 📁 โครงสร้างไฟล์

```
sabai-shop/
├── index.html              # หน้าเว็บหลัก (Lazada-style shop)
├── logo.svg                # โลโก้ร้านสบายพาณิชย์
├── geargao-logo.svg        # โลโก้แบรนด์ geargao
├── geargao-banner.svg      # แบนเนอร์ geargao.com (1200x630, เว็บ+โซเชียล)
├── sabai-receipt-template.pdf  # ใบเสร็จ/ใบกำกับภาษี (พิมพ์ได้)
├── CNAME                   # Custom domain: geargao.com
├── deploy.bat              # Script push ขึ้น GitHub ครั้งแรก
├── fix-push.bat            # Script push (แก้ lock + push)
├── push-cname.bat          # Script push CNAME file
└── start.bat               # Script เปิด dev server
```

---

## 🚀 การ Deploy

### Push ขึ้น GitHub
```batch
cd E:\project\sabai-shop
git add .
git commit -m "update"
git push origin main
```
หรือดับเบิลคลิก **`fix-push.bat`**

### GitHub Pages Settings
- Repository: `misterken353-code/sabai-shop`
- Branch: `main` / root
- Custom Domain: `geargao.com` (ตั้งค่าผ่าน CNAME file)
- HTTPS: ใช้งานได้ (Enforce HTTPS ต้อง login เป็น `misterken353-code`)

---

## 🌐 DNS & Domain

### Cloudflare DNS Records (Zone: geargao.com)
| Type | Name | Value | Proxied |
|------|------|-------|---------|
| A | geargao.com | 185.199.108.153 | No |
| A | geargao.com | 185.199.109.153 | No |
| A | geargao.com | 185.199.110.153 | No |
| A | geargao.com | 185.199.111.153 | No |
| CNAME | www | misterken353-code.github.io | No |

### Nameservers (ตั้งโดย Hostsevenplus)
```
anderson.ns.cloudflare.com
hattie.ns.cloudflare.com
```

---

## 🎨 Assets

### โลโก้ร้าน (logo.svg)
- ชื่อ: ร้านสบายพาณิชย์
- สี: ส้มแดง (#FF3D00) + ขาว

### โลโก้ geargao (geargao-logo.svg)
- ไอคอนเกียร์ + ชื่อ geargao
- สี: #FF3D00 + #1A1A2E

### แบนเนอร์ (geargao-banner.svg)
- ขนาด: 1200x630px (สำหรับ Facebook/LINE/เว็บ)
- พื้นหลังดำ + ตัวอักษรส้ม
- มีข้อมูล: geargao.com, 080-7673617

### ใบเสร็จ (sabai-receipt-template.pdf)
- ชื่อร้าน: ร้านสบายพาณิชย์ / geargao.com
- เลขภาษี: 3330300831317
- เบอร์: 080-7673617
- พร้อมเพย์: 0807673617
- รองรับ: ช่องกรอกสินค้า 8 รายการ, คำนวณ VAT 7%, ลายเซ็น

---

## 👤 Accounts

| Service | Account |
|---------|---------|
| GitHub (repo owner) | misterken353-code |
| GitHub (collaborator/push) | nanthasakscb-eng |
| Cloudflare | nanthasak.scb@gmail.com |
| Hostsevenplus | geargao / (DirectAdmin) |
| Email | nanthasak.scb@gmail.com |

---

## ✅ สิ่งที่ทำเสร็จแล้ว

- [x] สร้างเว็บ Lazada-style (index.html)
- [x] ออกแบบโลโก้ร้านสบายพาณิชย์
- [x] Deploy ขึ้น GitHub Pages
- [x] จด/ตั้งค่า DNS geargao.com บน Cloudflare
- [x] เปลี่ยน Nameserver ผ่าน Hostsevenplus
- [x] CNAME file → custom domain geargao.com
- [x] HTTPS redirect (JavaScript in index.html)
- [x] สร้างโลโก้แบรนด์ geargao
- [x] สร้างแบนเนอร์ geargao.com
- [x] สร้างใบเสร็จ/ใบกำกับภาษี PDF

## ⏳ สิ่งที่ยังค้างอยู่

- [ ] Enable "Enforce HTTPS" ใน GitHub Pages (ต้อง login เป็น misterken353-code)
- [ ] เพิ่มสินค้าจริงในเว็บ
- [ ] ตั้งค่าระบบรับออเดอร์/แจ้งเตือน
