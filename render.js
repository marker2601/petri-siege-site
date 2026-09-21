#!/usr/bin/env node
/* Petri Siege site · render for GitHub Pages (zero dependencies).

   node render.js [--out <dir>]      default output: _site/ next to this file

   Copies the site files to the output folder. When the environment variable SUPPORT_EMAIL holds a
   plain email address (the site repo's optional variable, step 5.13), the placeholder
   <!-- @support-email --> is replaced with one line "Or email ADDRESS." (HTML-escaped);
   otherwise the placeholder stays as it is. The address is never written to the log or to a
   committed file; it only appears in the rendered page. */
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const args = process.argv.slice(2);
const oi = args.indexOf('--out');
const OUT = oi >= 0 ? path.resolve(args[oi + 1]) : path.join(SRC, '_site');
const PLACEHOLDER = '<!-- @support-email -->';
const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const SKIP = { 'render.js': true, _site: true, node_modules: true };

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function copyTree(from, to, email, stats) {
  fs.mkdirSync(to, { recursive: true });
  for (const name of fs.readdirSync(from)) {
    if (SKIP[name] || name[0] === '.') continue;
    const src = path.join(from, name);
    const dst = path.join(to, name);
    if (path.resolve(src) === OUT) continue;
    const st = fs.statSync(src);
    if (st.isDirectory()) { copyTree(src, dst, email, stats); continue; }
    if (/\.html$/i.test(name)) {
      let html = fs.readFileSync(src, 'utf8');
      if (email && html.indexOf(PLACEHOLDER) >= 0) {
        const e = esc(email);
        html = html.split(PLACEHOLDER).join('<p>Or email <a href="mailto:' + e + '">' + e + '</a>.</p>');
        stats.filled.push(name);
      }
      fs.writeFileSync(dst, html);
    } else fs.copyFileSync(src, dst);
    stats.files++;
  }
}

const raw = (process.env.SUPPORT_EMAIL || '').trim();
const email = EMAIL.test(raw) ? raw : '';
fs.rmSync(OUT, { recursive: true, force: true });
const stats = { files: 0, filled: [] };
copyTree(SRC, OUT, email, stats);
console.log('Rendered ' + stats.files + ' file(s) to ' + path.relative(process.cwd(), OUT) + '.');
if (email) console.log('Support email line added to: ' + stats.filled.join(', ') + '.');
else if (raw) console.log('SUPPORT_EMAIL is set but is not a plain email address; the email line was left out.');
else console.log('SUPPORT_EMAIL is not set; the support page offers the issue form only.');
