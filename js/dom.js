/* Kalsara DOM renderer: parse fragments, strip executable content/unsafe attributes,
 * then commit with replaceChildren. Dynamic HTML is retained for legacy templates,
 * but no legacy module writes directly to Element.innerHTML.
 */
const ALLOWED_TAGS = new Set(('a abbr address article aside b blockquote br button caption code col colgroup dd del details div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr i img input label legend li main mark ol optgroup option output p picture pre q section select small span strong sub summary sup table tbody td textarea tfoot th thead time tr u ul svg path circle line rect polyline polygon g defs lineargradient stop ellipse text tspan').split(' '));
const ALLOWED_ATTRS = new Set(('alt aria-label aria-live aria-modal autocomplete autofocus checked colspan class colSpan content contenteditable data-* datetime dir disabled download draggable for height hidden href id inputmode lang max maxlength min minlength multiple name open placeholder rel required readonly role rowspan selected size src step style tabindex target title type value viewbox spellcheck autocapitalize accept form method enctype pattern formaction action controls focusable d cx cy r x x1 x2 y y1 y2 fill stroke stroke-width stroke-linecap stroke-linejoin points xmlns preserveaspectratio rx ry stroke-dasharray stroke-dashoffset fill-rule clip-rule opacity transform').toLowerCase().split(' '));
const URL_ATTRS = new Set(['href','src','action','formaction','xlink:href']);
const DROP_TAGS = new Set(['script','iframe','object','embed','applet','base','meta','link','foreignobject']);
function safeUrl(value) {
  const v = String(value).trim();
  if (!v || v[0] === '#' || v[0] === '/' || v.startsWith('./') || v.startsWith('../')) return true;
  try { const u = new URL(v, document.baseURI); return ['http:','https:','mailto:','tel:','blob:'].includes(u.protocol); }
  catch { return false; }
}
function sanitizeNode(node) {
  if (node.nodeType === Node.COMMENT_NODE) { node.remove(); return; }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const tag = node.localName.toLowerCase();
  if (DROP_TAGS.has(tag) || !ALLOWED_TAGS.has(tag)) { node.remove(); return; }
  for (const attr of [...node.attributes]) {
    const name = attr.name.toLowerCase();
    const allowed = ALLOWED_ATTRS.has(name) || name.startsWith('aria-') || name.startsWith('data-');
    if (!allowed || name.startsWith('on')) { node.removeAttribute(attr.name); continue; }
    if (URL_ATTRS.has(name) && !safeUrl(attr.value)) { node.removeAttribute(attr.name); continue; }
    if (name === 'style' && /(url\s*\(|expression\s*\(|@import|behavior\s*:|-moz-binding)/i.test(attr.value)) node.removeAttribute(attr.name);
  }
  for (const child of [...node.childNodes]) sanitizeNode(child);
}
function fragmentFrom(html) {
  const parsed = new DOMParser().parseFromString(String(html ?? ''), 'text/html');
  const fragment = document.createDocumentFragment();
  for (const child of [...parsed.body.childNodes]) {
    if (child.nodeType === Node.COMMENT_NODE) continue;
    const copy = document.importNode(child, true);
    sanitizeNode(copy);
    if (copy.nodeType !== Node.ELEMENT_NODE || ALLOWED_TAGS.has(copy.localName.toLowerCase())) fragment.append(copy);
  }
  return fragment;
}
export function setHTML(element, html) {
  if (!element || typeof element.replaceChildren !== 'function') throw new TypeError('Target DOM tidak valid');
  element.replaceChildren(fragmentFrom(html));
}
export function appendHTML(element, html) {
  if (!element || typeof element.append !== 'function') throw new TypeError('Target DOM tidak valid');
  element.append(fragmentFrom(html));
}
export function insertHTML(element, position, html) {
  const fragment = fragmentFrom(html);
  switch (String(position).toLowerCase()) {
    case 'beforebegin': element.before(fragment); break;
    case 'afterbegin': element.prepend(fragment); break;
    case 'beforeend': element.append(fragment); break;
    case 'afterend': element.after(fragment); break;
    default: throw new TypeError('Posisi insert HTML tidak valid');
  }
}
export function copyChildren(target, source) {
  if (!target || !source || !target.replaceChildren) throw new TypeError('Target/sumber DOM tidak valid');
  const clone = document.createDocumentFragment();
  const sourceNode = source.content || source;
  for (const child of [...sourceNode.childNodes]) {
    if (child.nodeType === Node.COMMENT_NODE) continue;
    const copy = child.cloneNode(true);
    sanitizeNode(copy);
    if (copy.nodeType !== Node.ELEMENT_NODE || ALLOWED_TAGS.has(copy.localName.toLowerCase())) clone.append(copy);
  }
  target.replaceChildren(clone);
}
const KDOM = Object.freeze({setHTML, appendHTML, insertHTML, copyChildren});
globalThis.KDOM = KDOM;
