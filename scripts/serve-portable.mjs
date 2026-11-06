import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = resolve('StatSEGPA_Portable.html');
createServer((_, res) => {
  try {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(readFileSync(file));
  } catch (error) {
    res.writeHead(500);
    res.end(String(error));
  }
}).listen(4174, '127.0.0.1', () => console.log('Portable HTML served on :4174'));
