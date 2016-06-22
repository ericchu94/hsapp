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

// Additional data
app.context.info = {};

// General purpose logging
app.use((ctx, next) => {
  const start = new Date();
  return next().then(() => {
    const end = new Date();
    console.log(`${ctx.method} ${ctx.url} - ${end - start} ms`);
  });
});

app.use(route.get('/', serve('assets')));
app.use(route.get('/assets/*', serve('.')));

app.use(route.post('/inject', upload.single('hsapp')));
app.use(route.post('/inject', (ctx) => {
  const hsapp = ctx.req.file.path;
  const size = ctx.req.file.size;
  console.log(`Size: ${size / 1000} kB`);
  const wd = `${hsapp}_hsapp`
  // Setup working directory
  return fs.copyAsync(UNIVERSAL_INJECT_GENERATOR, wd).then(() => {
    // Setup input files
    return Promise.all([
      fs.moveAsync(hsapp, `${wd}/input/hs.app`),
      fs.copyAsync(FBI, `${wd}/input/${FBI}`),
    ]);
  }).then(() => {
    // Exec Universal Inject Generator
    return execFile(`${wd}/go.sh`, {
      cwd: wd,
    });
  }).then(() => {
    // Send file
    ctx.set('Content-Disposition', `attachment; filename="${FBI_INJECT}"`);
    return send(ctx, `${wd}/${FBI_INJECT}`, {
      root: '/',
    });
  }).then(() => {
    // Delete working directory
    return fs.removeAsync(wd);
  }).then(() => {
    console.log('hs.app successfully injected');
  });
}));
app.use(route.get('/info', ctx => {
  ctx.body = app.context.info;
}));

// Update FBI to latest version
function update() {
  rp({
    url: FBI_LATEST,
    headers: {
      'User-Agent': 'ericchu94/hsapp',
      'Accept': 'application/vnd.github.v3+json',
    },
  }).then(data => {
    data = JSON.parse(data);
    app.context.info.fbi = data.name;
    for (const asset of data.assets) {
      if (asset.name == FBI) {
        return new Promise((resolve, reject) => {
          request(asset.browser_download_url)
            .on('error', reject)
            .on('end', resolve)
            .pipe(fs.createWriteStream(`${FBI}_tmp`));
        }).then(() => {
          return fs.moveAsync(`${FBI}_tmp`, FBI, {
            clobber: true,
          });
        }).then(() => {
          console.log(`${FBI} updated`);
        });
      }
    }
  });
}

// Clone Universal Inject Geneartor
Git.Clone(UNIVERSAL_INJECT_GENERATOR_GIT, UNIVERSAL_INJECT_GENERATOR).then(repo => {
  return repo.checkoutRef(UNIVERSAL_INJECT_GENERATOR_STABLE);
});

update();

// Every 10 minutes yo
setInterval(update, 10 * 60 * 1000);

app.listen(process.env.PORT || 3000);
