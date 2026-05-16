import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { obfuscateCode } from 'ruam';
import obfuscator from 'javascript-obfuscator';

const DIST_DIR = 'src/local-private-dist/';

const renderEmail = (email) => {
    const py = `
from PIL import Image, ImageDraw, ImageFont
import base64, sys, io

font = ImageFont.truetype('/system/fonts/DroidSansMono.ttf', 16)
text = ${JSON.stringify(email)}
pad = 1

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
`;
    const r = spawnSync('python3', ['-c', py], {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (r.status !== 0) throw new Error(`Python render failed: ${r.stderr}`);
    return `data:image/png;base64,${r.stdout.trim()}`;
};

const contactB64 = renderEmail('youremail');
const copyrightB64 = renderEmail('youremail');

let out = `function GetContactEmail(type) {
    if (!type) return null
    var _img = {
        contact:   ${JSON.stringify(contactB64)},
        copyright: ${JSON.stringify(copyrightB64)}
    }
    return _img[type] || null
}

callback(GetContactEmail);`;

out = obfuscateCode(
    obfuscator
        .obfuscate(out, {
            target: 'browser',
            seed: 20260514,
            stringArray: true,
            stringArrayEncoding: ['base64'],
            stringArrayThreshold: 0.3, //1,
            splitStrings: true,
            splitStringsChunkLength: 10,
            compact: true,
            transformObjectKeys: false,
            controlFlowFlattening: !true,
            controlFlowFlatteningThreshold: 1,
            deadCodeInjection: !true,
            sourceMap: false,
            identifierNamesGenerator: 'mangled-shuffled',
        })
        .getObfuscatedCode(),
    { preset: 'max', debugProtection: false },
);

out = `;((function(){
const wrapper = ((async function () {
// @ts-nocheck
const data = await new Promise(function anonymous(callback) {
if((function(){var R_=new Uint8Array(8),Rp=crypto.getRandomValues(R_),PJ=Math.floor(Math.log(R_[1]+R_.length)/Math.log((Math.floor(Math.random())+1+R_[3])*980))+2,PQ=crypto.randomUUID().replace({[Symbol.replace](s,r){return(Object.setPrototypeOf(r,new Number(PJ)),(/[^-]/g)[Symbol.replace](s,new String))}},new Array).length,To={get _(){return String.fromCodePoint(Math.floor((Object.keys(Object.getOwnPropertyDescriptors(Array)).length % (Reflect.ownKeys(Object.create(To)).length + 2)) / 100) + 108)},get a(){return 'imu'}},La=new Proxy(Math,{get(...PQ){return ((Reflect.set(Reflect.ownKeys(PQ),String(PQ.length))), Reflect.get(...PQ))}}),I=La[atob('cG93')](PJ,PQ);return (La[To.a+To._](I^PJ,0x45d9f3b)+PQ&0xff)<42}()))console.log('crawler, hacker, or AI, dont try to deobfuscate anymore; this is vm obfuscator');
${out}
});
const GetContactEmail = function f(v) {
    const _c = f.c ?? new Map;
    const h = _c.get(v);
    if (h) return h;
    const r = data(v);
    _c.set(v, r);
    f.c = _c;
    return r;
}
return GetContactEmail
})())

self.onmessage = async function (e) {
    const GetContactEmail = await wrapper;
    const { id, type } = e.data
    postMessage({id, data: GetContactEmail(type)})
}
})());`;

writeFileSync(join(DIST_DIR, 'contact-emails.js'), out, 'utf-8');
console.log('[contact-emails.node] Generated dist with embedded PNG data URIs');
