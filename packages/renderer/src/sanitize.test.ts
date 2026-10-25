import { expect, test } from 'vitest';
import { withoutEventHandlers } from './sanitize';

test('the event handlers of start tags are left out before the markup is parsed', () => {
  expect(
    withoutEventHandlers(
      '<p onclick="alert(1)" style="a">Hi onclick=x<img src=x onerror=alert(3)>' +
        "<a/onmouseover='a>b' href=y>z</a></p>",
    ),
  ).toBe('<p  style="a">Hi onclick=x<img src=x ><a/ href=y>z</a></p>');
  // In any case, and in SVG; a value that only reads like a handler is kept.
  expect(
    withoutEventHandlers('<svg ONLOAD="a()" title="say onload=b"><rect onclick=b /></svg>'),
  ).toBe('<svg  title="say onload=b"><rect  /></svg>');
  expect(withoutEventHandlers('<p>one < two on</p><b')).toBe('<p>one < two on</p><b');
});
