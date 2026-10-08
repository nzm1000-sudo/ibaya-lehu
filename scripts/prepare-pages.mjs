import { readFileSync, writeFileSync } from 'node:fs';

// GitHub Pages serves this shell for dynamic routes such as /answer/b314-27.
// The client router reads the original URL and opens the requested screen.
writeFileSync('dist/404.html', readFileSync('dist/index.html'));
writeFileSync('dist/.nojekyll', '');
writeFileSync('dist/CNAME', 'ibaya-lehu.nizoza.com\n');
