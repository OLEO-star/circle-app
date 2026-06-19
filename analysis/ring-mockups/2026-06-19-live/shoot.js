const { chromium } = require("/Users/hiraiichijou/.npm/_npx/e41f203b7505f1fb/node_modules/playwright");
const path = require("path");

const OUT = "/Users/hiraiichijou/home/my-company/circle-app/analysis/ring-mockups/2026-06-19-live";
const jobs = [
  { demo: "mixed", file: "live_mix.png" },
  { demo: "sciences", file: "live_sci.png" },
  { demo: "humanities", file: "live_hum.png" },
];

(async () => {
  const browser = await chromium.launch();
  for (const j of jobs) {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    const url = `http://localhost:3000/result?demo=${j.demo}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    // wait for ring canvas to exist
    await page.waitForSelector("canvas", { timeout: 15000 });
    // let the static ring draw settle
    await page.waitForTimeout(800);
    const canvas = await page.$("canvas");
    const box = await canvas.boundingBox();
    // capture canvas + some padding around it
    const pad = 24;
    await page.screenshot({
      path: path.join(OUT, j.file),
      clip: {
        x: Math.max(0, box.x - pad),
        y: Math.max(0, box.y - pad),
        width: box.width + pad * 2,
        height: box.height + pad * 2,
      },
    });
    console.log(`${j.demo}: canvas ${Math.round(box.width)}x${Math.round(box.height)} -> ${j.file}`);
    await ctx.close();
  }
  await browser.close();
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
