'use strict';
const os = require('os');

const Koa = require('koa');
const route = require('koa-route');
const multer = require('koa-multer');
const Git = require('nodegit');
const fs = require('fs-extra-promise');
const rp = require('request-promise');
const request = require('request');
const execFile = require('child-process-promise').execFile;
const send = require('koa-send');
const serve = require('koa-static');

const FBI = 'FBI.cia';
const FBI_INJECT = 'FBI_inject_with_banner.app';
const FBI_LATEST = 'https://api.github.com/repos/Steveice10/FBI/releases/latest';
const UNIVERSAL_INJECT_GENERATOR_GIT = 'https://github.com/d0k3/Universal-Inject-Generator.git';
const UNIVERSAL_INJECT_GENERATOR_STABLE = 'a9109b3dd48ecb37838976726afdb25ad6fd2d45';
const UNIVERSAL_INJECT_GENERATOR = 'Universal-Inject-Generator';

const app = new Koa();
const upload = multer({
  dest: os.tmpdir(),
});

app.use(route.get('/', serve('assets')));
app.use(route.get('/assets/*', serve('.')));
app.use(route.post('/inject', upload.single('hsapp')));
app.use(route.post('/inject', (ctx) => {
  const hsapp = ctx.req.file.path;
  const wd = `${hsapp}_hsapp`
  return fs.copyAsync(UNIVERSAL_INJECT_GENERATOR, wd).then(() => {
    return Promise.all([
      fs.moveAsync(hsapp, `${wd}/input/hs.app`),
      fs.copyAsync(FBI, `${wd}/input/${FBI}`),
    ]);
  }).then(() => {
    return execFile(`${wd}/go.sh`, {
      cwd: wd,
    });
  }).then(() => {
    ctx.set('Content-Disposition', `attachment; filename="${FBI_INJECT}"`);
    return send(ctx, `${wd}/${FBI_INJECT}`, {
      root: '/',
    });
  }).then(() => {
    return fs.removeAsync(wd);
  }).then(() => {
    console.log('Success');
  });
}));

rp({
  url: FBI_LATEST,
  headers: {
    'User-Agent': 'ericchu94/hsapp',
    'Accept': 'application/vnd.github.v3+json',
  },
}).then(data => {
  data = JSON.parse(data);
  for (const asset of data.assets) {
    if (asset.name == FBI) {
      return new Promise((resolve, reject) => {
        request(asset.browser_download_url)
          .on('error', reject)
          .on('end', resolve)
          .pipe(fs.createWriteStream(FBI));
      });
    }
  }
});

Git.Clone(UNIVERSAL_INJECT_GENERATOR_GIT, UNIVERSAL_INJECT_GENERATOR).then(repo => {
  return repo.checkoutRef(UNIVERSAL_INJECT_GENERATOR_STABLE);
});

app.listen(process.env.PORT || 3000);
