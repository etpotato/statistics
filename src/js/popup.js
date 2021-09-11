const Popup = class {
  constructor (popupElem, underlayClass = 'js-popup-underlay', closeClass = 'js-popup-close') {
    this.popupElement = popupElem;
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this._underlayClass = underlayClass;
    this._closeClass = closeClass;
    this._activeClass = 'popup-open';
    this._escHandler = this._escHandler.bind(this);
    this._closeHandler = this._closeHandler.bind(this);
  }

  open () {
    this.popupElement.style.display = 'flex';
    requestAnimationFrame(() => {
      this.popupElement.classList.add(this._activeClass);
      this._addListeners();
      document.body.classList.add('no-scroll');
    });
  }

  close () {
    this.popupElement.classList.remove(this._activeClass);
    this.popupElement.addEventListener('transitionend', () => {
      this.popupElement.style.display = 'none';
      this._removeListeners();
      document.body.classList.remove('no-scroll');
    }, {
      once: true,
    });
  }

  _closeHandler (evt) {
    if (
      evt.target.matches(`.${this._underlayClass}`)
      || evt.target.matches(`.${this._closeClass}`)
    ) {
      evt.preventDefault();
      this.close();
    }
  }

  _escHandler (evt) {
    const escKeyValues = ['Escape', 'Esc'];
    if (escKeyValues.some(code => evt.key === code)) {
      evt.preventDefault();
      this.close(evt);
    }
  }

  _addListeners () {
    this.popupElement.addEventListener('click', this._closeHandler);
    document.addEventListener('keydown', this._escHandler);
  }

  _removeListeners () {
    this.popupElement.removeEventListener('click', this._closeHandler);
    document.removeEventListener('keydown', this._escHandler);
  }
};


export default Popup;
