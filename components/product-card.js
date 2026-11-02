/* Isolated native Web Component boundary for future card-by-card migration. */
class KalsaraProductCard extends HTMLElement {
  constructor(){ super(); this.attachShadow({mode:'open'}); }
  connectedCallback(){
    if(this.shadowRoot.childNodes.length) return;
    const slot=document.createElement('slot');
    const style=document.createElement('style');
    style.textContent=':host{display:block;contain:content}';
    this.shadowRoot.append(style,slot);
  }
}
if(!customElements.get('kalsara-product-card')) customElements.define('kalsara-product-card',KalsaraProductCard);
