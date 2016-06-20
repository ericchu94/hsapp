'use strict';
const os = require('os');

const Koa = require('koa');
const route = require('koa-route');
const multer = require('koa-multer');

const app = new Koa();
const upload = multer({
  dest: os.tmpdir(),
});

app.use(route.post('/inject', upload.single('hsapp')));
app.use(route.post('/inject', (ctx) => {
  console.log(ctx.req.file);
  ctx.body = 'hi';
}));

app.use(route.get('/', ctx => {
  ctx.body = 'hello';
}));

app.listen(3000);
