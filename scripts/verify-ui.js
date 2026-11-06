async page => {
  const base = 'http://127.0.0.1:4173/';
  const passed = [], errors = [], gpuWarnings = [];
  const check = (ok, message) => { if (!ok) throw Error(message); passed.push(message); };
  const browser = page.context().browser();
  await page.bringToFront();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (/GL_INVALID|overflows texture/i.test(message.text())) gpuWarnings.push(message.text()); });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.mouse.move(5, 5);
  await page.goto(base + '#hero');
  await page.reload();
  await page.waitForTimeout(1300);
  const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
  check(!resources.some(name => /three\.module|\/visuals-|\/image-viewer-/.test(name)), 'Deep links do not eagerly load Three.js, entrance, or PhotoSwipe');
  check(await page.locator('html').evaluate(el => getComputedStyle(el).getPropertyValue('--accent').trim()) === '#d5f46b', 'Original lime palette is retained');
  check(await page.locator('link[rel="canonical"]').getAttribute('href') === 'https://nakram.space/', 'Canonical URL is present');
  check((await page.request.get(base + 'og-image.png')).ok(), 'Social preview image is served');
  check((await page.request.get(base + 'sitemap.xml')).ok() && (await page.request.get(base + 'robots.txt')).ok(), 'Sitemap and robots are served');

  await page.goto(base + '#about');
  await page.waitForTimeout(1300);
  check(await page.locator('#site-header').evaluate(el => getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)'), 'Navigation background is transparent');
  check(await page.locator('.about-photo').evaluate(el => parseFloat(getComputedStyle(el).paddingTop) >= 8), 'About photograph has a real mat frame');
  await page.locator('.about-photo button').click();
  await page.locator('.portfolio-viewer').waitFor();
  await page.waitForTimeout(450);
  check(await page.locator('main').evaluate(el => el.inert), 'Background is inert while image viewer is open');
  check(await page.locator('.pswp__caption').innerText() === 'Akram', 'Photo caption is initialized safely');
  await page.locator('.pswp__button--arrow--next').click();
  await page.waitForTimeout(400);
  check(await page.locator('.pswp__caption').innerText() === 'CarDev, HMIF', 'PhotoSwipe advances through the photo album');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(400);
  check(await page.locator('.pswp__caption').innerText() === 'Akram', 'Keyboard navigation returns to the original photo');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(400);
  check(await page.locator('.pswp__caption').innerText() === 'An ITB beginning', 'Photo navigation wraps from first to last');
  await page.keyboard.press('Escape');
  await page.locator('.portfolio-viewer').waitFor({ state: 'detached' });
  check(await page.locator('.about-photo button').evaluate(el => el === document.activeElement) && !await page.locator('main').evaluate(el => el.inert), 'Closing restores focus to the opener and unlocks background');

  await page.goto(base + '#projects');
  await page.waitForTimeout(1300);
  check(await page.locator('.project-panel:visible').count() === 7, 'All seven projects are visible together');
  check(await page.locator('.project-tabs,.gallery-controls,[role="tabpanel"]').count() === 0, 'Work has no hidden slides or carousel controls');
  check(await page.locator('.hero-copy,.about-facts,.earlier-education').count() === 0, 'Removed hero copy, giant stats and school filler stay removed');
  check(await page.locator('.about-photo img').getAttribute('src') === './photos/akram-portrait.webp', 'About uses the solo portrait');
  check(await page.locator('.moments-heading h2').textContent() === 'Memories.', 'Personal section is named Memories');
  check(await page.locator('.contact-copy').innerText().then(s => s.includes('Open to remote AI & Software Engineering internships')), 'Internship CTA is available in Contact');
  check(await page.locator('main>.chapter').evaluateAll(els => els.map(el=>el.id).join(',')) === 'hero,about,projects,certifications,experience,stack,moments,connect', 'Work and credentials precede memories, which leads into contact');
  check(await page.locator('.project-detail').count() === 7 && await page.locator('#project-panel-2 .project-detail').textContent().then(s => s.includes('My contribution:')), 'Project descriptions include implementation detail and documented personal contribution');
  check(await page.locator('.image-button').first().evaluate(el => getComputedStyle(el).borderRadius === '0px' && parseFloat(getComputedStyle(el).borderTopWidth) >= 1.5), 'Project previews have sharp, visible frames');
  check(await page.locator('.project-panel').first().evaluate(el => el.getBoundingClientRect().height < 600), 'Desktop split project rows stay compact');
  check(await page.locator('.project-panel').evaluateAll(els => els.every((el,i) => { const copy=el.querySelector('.project-content').getBoundingClientRect(), image=el.querySelector('.project-media').getBoundingClientRect(); return i%2 ? image.right<=copy.left+1 : copy.right<=image.left+1; })), 'Desktop project descriptions and images alternate sides');
  check(await page.locator('.project-number,.work-count,.hero-bottom').count() === 0, 'Project numbering and hero Explore button are removed');
  check(await page.locator('.project-panel').evaluateAll(els=>els.every(el=>getComputedStyle(el).borderTopWidth==='0px' && getComputedStyle(el).backgroundColor==='rgba(0, 0, 0, 0)')), 'Work rows flow together without outer card borders or separate backgrounds');
  check(!await page.locator('#stack').textContent().then(s=>s.includes('RAG, semantic search, and embeddings.')), 'Toolkit filler sentence is removed');
  check(await page.locator('.about-photo').evaluate(el=>el.getBoundingClientRect().width<=421), 'About portrait is smaller and balanced with its text');
  await page.locator('.project-build summary').first().focus();
  await page.keyboard.press('Enter');
  check(await page.locator('.project-build').first().evaluate(el => el.open) && await page.locator('.project-detail').first().isVisible(), 'Build details open using the keyboard');
  await page.keyboard.press('Enter');
  check(!await page.locator('.project-build').first().evaluate(el => el.open), 'Build details collapse without hiding the project');
  await page.getByRole('button', { name: 'Enlarge HR Assistant screenshot' }).click();
  await page.locator('.portfolio-viewer').waitFor();
  await page.waitForTimeout(500);
  const initialZoom = await page.locator('.pswp__item').nth(1).locator('.pswp__zoom-wrap').getAttribute('style');
  await page.locator('.pswp__button--zoom').click();
  await page.waitForTimeout(450);
  check(await page.locator('.pswp__item').nth(1).locator('.pswp__zoom-wrap').getAttribute('style') !== initialZoom, 'Project screenshot can actually zoom');
  check(!await page.locator('.pswp__button--arrow--next').isVisible(), 'Single screenshot does not expose unrelated album navigation');
  await page.screenshot({ path: 'output/playwright/frames-viewer-verified.png' });
  await page.keyboard.press('Escape');
  await page.locator('.portfolio-viewer').waitFor({ state: 'detached' });

  await page.goto(base + '#moments');
  await page.waitForTimeout(1300);
  const photo = page.locator('.moment-card-0 button');
  await photo.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const box = await photo.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 - 20, { steps: 8 });
  check(await photo.evaluate(el => el.classList.contains('is-dragging')), 'Framed photo responds to a desktop drag');
  await page.mouse.up();
  await page.waitForTimeout(1000);
  check(await page.locator('.portfolio-viewer').count() === 0, 'Dragging a photo does not accidentally open the viewer');
  check(await photo.evaluate(el => { const matrix = new DOMMatrix(getComputedStyle(el).transform); return Math.abs(matrix.m41) < 1 && Math.abs(matrix.m42) < 1; }), 'Dragged photo springs back to its original position');
  await photo.click();
  await page.locator('.portfolio-viewer').waitFor();
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.locator('.portfolio-viewer').waitFor({ state: 'detached' });
  check(true, 'Normal photo click still opens viewer after a drag');

  await page.goto(base + '#hero');
  await page.waitForTimeout(1200);
  await page.mouse.move(500, 400);
  await page.locator('.portrait-fluid').waitFor();
  await page.waitForTimeout(200);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(200);
  await page.mouse.move(600, 400);
  await page.waitForTimeout(300);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
  await page.mouse.move(650, 420);
  await page.waitForTimeout(400);
  check(gpuWarnings.length === 0, 'Fluid textures resize without GPU dimension warnings');

  for (const [width, height] of [[1440, 900], [768, 1024], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(900);
    for (const section of ['about', 'projects', 'experience', 'moments', 'certifications', 'connect']) {
      await page.goto(base + '?verify=' + width + section + '#' + section);
      await page.waitForTimeout(1100);
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px ${section}: no horizontal page overflow`);
      if (section === 'projects' || section === 'experience') {
        // Measure final layout; offscreen projects intentionally start with a translated entrance.
        if (section === 'projects') {
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await page.waitForFunction(() => document.documentElement.dataset.motion === 'off');
        }
        const selector = section === 'projects' ? '.project-panel' : '.timeline-stop';
        check(await page.locator(selector).evaluateAll(els => els.every((el,i) => els.slice(i+1).every(other => { const a=el.getBoundingClientRect(), b=other.getBoundingClientRect(); return a.right<=b.left+1 || b.right<=a.left+1 || a.bottom<=b.top+1 || b.bottom<=a.top+1; }))), `${width}px ${section}: entries do not overlap`);
        check(await page.locator(selector).evaluateAll(els => els.every(el => [...el.querySelectorAll('h3,p')].every(child => child.getBoundingClientRect().right <= el.getBoundingClientRect().right + 1))), `${width}px ${section}: titles and copy fit inside each entry`);
        if (section === 'projects') {
          await page.emulateMedia({ reducedMotion: 'no-preference' });
          await page.waitForFunction(() => document.documentElement.dataset.motion === 'on');
        }
      }

    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(base + '#projects');
  check(await page.locator('.project-panel:visible').count() === 7, 'Reduced motion preserves all seven projects');
  check(await page.locator('.pin-spacer').count() === 0, 'Reduced motion removes pinned scenes');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base+'?journey=check#experience');
  await page.waitForTimeout(1300);
  await page.locator('.timeline-stop').nth(3).scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  check(await page.locator('.journey-year').innerText() === '2025', 'Journey year follows the active milestone');
  check(await page.locator('.timeline-stop.is-current').count() === 1, 'Journey has exactly one active milestone');
  await page.locator('.menu-toggle').click();
  await page.locator('.navigation a[href="#projects"]').click();
  await page.waitForTimeout(1300);
  check(await page.locator('#projects').evaluate(el => Math.abs(el.getBoundingClientRect().top - document.querySelector('#site-header').offsetHeight) < 4), 'Menu navigation reaches Work without a stale gallery scroll lock');

  const fallbackContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await fallbackContext.route('**/assets/image-viewer-*.js', route => route.abort());
  const fallback = await fallbackContext.newPage();
  await fallback.goto(base + '#projects');
  await fallback.getByRole('button', { name: 'Enlarge HR Assistant screenshot' }).click();
  await fallback.locator('#preview-dialog').waitFor({ state: 'visible' });
  check(await fallback.locator('#preview-image').getAttribute('src') === './projects/hr-assistant.webp', 'Failed viewer chunk falls back to native image dialog');
  await fallback.keyboard.press('Escape');
  check(!await fallback.locator('main').evaluate(el => el.inert), 'Fallback dialog also releases inert state');
  await fallbackContext.close();

  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const phone = await touchContext.newPage();
  phone.on('pageerror', error => errors.push(error.message));
  await phone.goto(base + '#moments');
  await phone.locator('.moment-card-0 button').tap();
  await phone.locator('.portfolio-viewer').waitFor();
  await phone.waitForTimeout(500);
  const touch = await touchContext.newCDPSession(phone);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 300, y: 420 }] });
  for (let x = 280; x >= 60; x -= 20) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: 420 }] });
    await phone.waitForTimeout(20);
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await phone.waitForTimeout(700);
  check(await phone.locator('.pswp__caption').innerText() === 'Campus days', 'Real touch swipe advances the photo viewer');
  await phone.locator('.pswp__button--close').tap();
  await phone.locator('.portfolio-viewer').waitFor({ state: 'detached' });
  check(!await phone.locator('main').evaluate(el => el.inert), 'Touch close restores scrolling');
  await touchContext.close();
  check(errors.length === 0, 'No runtime errors in tested interaction flows' + (errors.length ? ': ' + errors.join('; ') : ''));
  return { passed, errors, gpuWarnings };
}
