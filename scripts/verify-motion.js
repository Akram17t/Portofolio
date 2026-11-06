async page => {
  const base='http://127.0.0.1:4173/';
  const passed=[],errors=[];
  const check=(ok,message)=>{if(!ok)throw Error(message);passed.push(message)};
  page.on('pageerror',error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base+'?motion=check#hero');
  await page.waitForTimeout(1200);
  const scrollTo=async (selector,position=.65)=>{
    await page.locator(selector).first().evaluate((el,position)=>window.scrollTo({top:el.getBoundingClientRect().top+scrollY-innerHeight*position,behavior:'instant'}),position);
  };
  for(let i=0;i<7;i++) {
    const panel=page.locator('#project-panel-'+i),media=panel.locator('.project-media');
    const initial=await media.evaluate(el=>getComputedStyle(el).clipPath);
    await scrollTo('#project-panel-'+i);
    await page.waitForTimeout(150);
    const during=await media.evaluate(el=>getComputedStyle(el).clipPath);
    check(initial!=='none' && during!=='none',`Project ${i+1} has a real masked entrance`);
    if(i===1) await page.screenshot({path:'output/playwright/motion-project-mid.png'});
    await page.waitForTimeout(1100);
    check(await media.evaluate(el=>getComputedStyle(el).clipPath==='none'),`Project ${i+1} entrance settles and clears its mask`);
    check(await panel.locator('.project-content>*').evaluateAll(els=>els.every(el=>getComputedStyle(el).opacity==='1' && getComputedStyle(el).transform==='none')),`Project ${i+1} description settles completely`);
  }
  await page.goto(base+'?motion=focus#hero');
  await page.waitForTimeout(1000);
  await page.locator('#project-panel-6 .project-links a').focus();
  check(await page.locator('#project-panel-6 .project-media').evaluate(el=>getComputedStyle(el).clipPath==='none'),'Keyboard focus immediately reveals an arriving project');

  await page.goto(base+'?motion=credentials#hero');
  await page.waitForTimeout(1000);
  const badge=page.locator('.cert-badge').first();
  check(await badge.evaluate(el=>getComputedStyle(el).transform!=='none'),'Credential badge has its own entrance');
  await scrollTo('.certification');
  await page.waitForTimeout(1200);
  check(await badge.evaluate(el=>getComputedStyle(el).transform==='none'),'Credential badge settles without a leftover tilt');

  await page.goto(base+'?motion=social#connect');
  await page.waitForTimeout(1500);
  for(const link of await page.locator('.contact-links .rolling-link,.contact-email').all()) {
    await page.mouse.move(5,5);
    await page.waitForTimeout(1000);
    const before=await link.locator('.roll-original .roll-character').first().boundingBox();
    await link.hover();
    await page.waitForTimeout(1100);
    const after=await link.locator('.link-echo .roll-character').first().boundingBox();
    check(Math.abs(before.y-after.y)<1 && Math.abs(before.x-after.x)<1,`${await link.getAttribute('aria-label')}: hover replacement stays on the same baseline`);
  }
  await page.mouse.move(5,5);
  await page.waitForTimeout(1000);
  const github=page.locator('.contact-links .rolling-link').first();
  const before=await github.locator('.roll-original .roll-character').first().boundingBox();
  await github.focus();
  await page.waitForTimeout(1100);
  const after=await github.locator('.link-echo .roll-character').first().boundingBox();
  check(Math.abs(before.y-after.y)<1,'Keyboard rolling letters use the same aligned baseline');
  await page.screenshot({path:'output/playwright/motion-contact-aligned.png'});

  for(let i=0;i<3;i++) {
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>document.documentElement.dataset.motion==='off');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.waitForFunction(()=>document.documentElement.dataset.motion==='on');
    await page.waitForTimeout(150);
  }
  check(errors.length===0,'Rebuilding motion from a deep page position does not break ScrollTrigger');

  for(const [width,height] of [[1440,900],[768,1024],[390,844],[320,568]]) {
    await page.setViewportSize({width,height});
    await page.goto(base+'?motion=fit'+width+'#projects');
    await page.waitForTimeout(1300);
    check(await page.locator('.rolling-type .roll-label').evaluateAll(els=>els.every(el=>el.scrollWidth<=el.clientWidth+1)),`${width}px: rolling project and Toolkit headings are not clipped`);
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px: rolling text creates no horizontal overflow`);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(base+'?motion=reduced#projects');
  await page.waitForTimeout(400);
  check(await page.locator('.project-media').evaluateAll(els=>els.every(el=>getComputedStyle(el).clipPath==='none' && getComputedStyle(el).transform==='none')),'Reduced motion removes project entrance masks and travel');
  await page.locator('#project-panel-0 .project-links a').focus();
  check(await page.locator('#project-panel-0 .roll-character').evaluateAll(els=>els.every(el=>getComputedStyle(el).transform==='none')),'Reduced motion keeps rolling text still and readable');
  check(errors.length===0,'No runtime errors in motion flows');
  return {passed,errors};
}
