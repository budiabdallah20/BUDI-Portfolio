/* eslint-disable no-console -- one-off asset generator, output is the point */
import { readFile, writeFile, stat } from "node:fs/promises";
import sharp from "sharp";

const svgPath = "public/icons/pwa-icon.svg";
const svg = await readFile(svgPath);

async function render(size, out) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log("wrote", out);
}

await render(192, "public/icons/pwa-192.png");
await render(512, "public/icons/pwa-512.png");
await render(512, "public/icons/maskable-512.png");

// favicon.ico — single 48x48 PNG inside a hand-rolled ICO container
const png48 = await sharp(svg, { density: 384 }).resize(48, 48).png({ compressionLevel: 9 }).toBuffer();
const ico = Buffer.alloc(6 + 16 + png48.length);
ico.writeUInt16LE(0, 0); // reserved
ico.writeUInt16LE(1, 2); // type = icon
ico.writeUInt16LE(1, 4); // count = 1
ico.writeUInt8(48, 6); // width
ico.writeUInt8(48, 7); // height
ico.writeUInt8(0, 8); // colors
ico.writeUInt8(0, 9); // reserved
ico.writeUInt16LE(1, 10); // planes
ico.writeUInt16LE(32, 12); // bpp
ico.writeUInt32LE(png48.length, 14); // bytes in resource
ico.writeUInt32LE(22, 18); // offset
png48.copy(ico, 22);
await writeFile("public/favicon.ico", ico);
console.log("wrote public/favicon.ico", (await stat("public/favicon.ico")).size, "bytes");
