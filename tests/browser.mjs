import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import {mkdir,writeFile,readFile} from 'node:fs/promises';
const out=new URL('../docs/',import.meta.url);await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));const requests=[];page.on('request',r=>requests.push({url:r.url(),method:r.method()}));
try{
 await page.goto('http://127.0.0.1:4435');await page.waitForFunction(()=>document.getElementById('status').textContent.includes('packets checked'));
 assert.match(await page.locator('#status').innerText(),/6 shared windows/);assert.match(await page.locator('#verdict').innerText(),/witnesses agree|shared change/i);
 await page.screenshot({path:new URL('desktop.png',out).pathname,fullPage:true});
 await page.locator('#time').fill('60');assert.match(await page.locator('#verdict').innerText(),/baseline/i);
 await page.locator('#time').fill('300');await page.locator('#remove').selectOption('W001');await page.waitForFunction(()=>document.querySelector('#source').textContent.includes('11 WEARERS'));assert.match(await page.locator('#status').innerText(),/0 survive/);
 await page.locator('#remove').selectOption('');await page.waitForFunction(()=>document.querySelector('#source').textContent.includes('12 WEARERS'));
 await page.locator('#device').selectOption('W004');assert.match(await page.locator('#device-title').innerText(),/W004/);
 for(const scenario of ['workload','sensor','null','dropout','drift','boundary']){await page.locator('#scenario').selectOption(scenario);await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('packets checked'));const text=await page.locator('#status').innerText();if(['workload','sensor','null','dropout'].includes(scenario))assert.match(text,/0 shared windows/);else if(scenario==='boundary')assert.match(text,/2 shared windows · 0 survive/);else assert.doesNotMatch(text,/· 0 shared windows/);}
 await page.locator('#scenario').selectOption('shared');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('6 shared windows'));
 const dl=page.waitForEvent('download');await page.locator('#export').click();const download=await dl;const capsulePath=new URL('example-capsule.json',out).pathname;await download.saveAs(capsulePath);const capsule=JSON.parse(await readFile(capsulePath));assert.equal(capsule.report.summary.shared_windows,6);
 await page.locator('#file').setInputFiles(capsulePath);await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('6 shared windows'));
 await page.locator('#file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"schema":"canopy/1","samples":[{}]}')});await page.waitForFunction(()=>document.querySelector('#status').classList.contains('error'));assert.match(await page.locator('#status').innerText(),/invalid device/);
 await page.locator('#generate').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('packets checked'));
 await page.locator('#play').click();const before=await page.locator('#time').inputValue();await page.waitForTimeout(500);assert.ok(Number(await page.locator('#time').inputValue())>Number(before));await page.locator('#play').click();
 await page.locator('#about').click();await page.locator('#guide').waitFor({state:'visible'});await page.keyboard.press('Escape');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:new URL('mobile.png',out).pathname,fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);assert.ok(requests.every(r=>r.url.startsWith('http://127.0.0.1:4435/')));assert.ok(requests.every(r=>r.method==='GET'));
 await writeFile(new URL('browser-verification.json',out),JSON.stringify({verified_at:new Date().toISOString(),browser:'Google Chrome / Playwright',flows:['baseline replay','single witness removal','individual trace','all seven scenarios','capsule export/import','invalid input rejection','playback','field guide','390px mobile overflow'],uncaught_errors:errors,network_uploads:0,external_requests:0},null,2));console.log('Browser workflows passed');
}finally{await browser.close();}
