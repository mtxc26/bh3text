import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { obfuscateCode } from "ruam";

const DIST_DIR = 'src/local-private-dist/'

const renderEmail = (email) => {
    const py = `
from PIL import Image, ImageDraw, ImageFont
import base64, sys, io

font = ImageFont.truetype('/system/fonts/DroidSansMono.ttf', 16)
text = ${JSON.stringify(email)}
pad = 0

tmp = Image.new('RGBA', (1, 1))
d = ImageDraw.Draw(tmp)
bbox = d.textbbox((0, 0), text, font=font)
w, h = bbox[2] - bbox[0] + pad * 2, bbox[3] - bbox[1] + pad * 2

img = Image.new('RGBA', (int(w), int(h)), (255, 255, 255, 0))
d = ImageDraw.Draw(img)
d.text((pad - bbox[0], pad - bbox[1]), text, fill=(0, 0, 0, 255), font=font)

buf = io.BytesIO()
img.save(buf, 'PNG')
sys.stdout.write(base64.b64encode(buf.getvalue()).decode('ascii'))
`
    const r = spawnSync('python3', ['-c', py], { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] })
    if (r.status !== 0) throw new Error(`Python render failed: ${r.stderr}`)
    return `data:image/png;base64,${r.stdout.trim()}`
}

const contactB64   = renderEmail('')
const copyrightB64 = renderEmail('youremail')

// 用 JSON.stringify 把 base64 数据嵌入，混淆后不会留下明文字符串
let out = `// @virtualize
function GetContactEmail(type) {
    if (!type) return null
    var _img = {
        contact:   ${JSON.stringify(contactB64)},
        copyright: ${JSON.stringify(copyrightB64)}
    }
    return _img[type] || null
}

callback(GetContactEmail)`;

out = (obfuscateCode(out, { preset: "max", debugProtection: false }));

out = `// @ts-nocheck
const GetContactEmail = await new Promise(function anonymous(callback) {
${out}
});

export default GetContactEmail;
`;

writeFileSync(join(DIST_DIR, 'contact-emails.js'), out, 'utf-8')
console.log('[contact-emails.node] Generated dist with embedded PNG data URIs')
