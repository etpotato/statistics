function objectMap(object, mapFn) {
  return Object.keys(object).reduce((result, key) => {
    result[key] = mapFn(object[key]);
    return result;
  }, {});
}

function initStats () {
  if (!$('.js-stats').length) return;

  const POPUP_CLASS = 'js-stats-popup';
  const FORM_CLASS = 'js-stats-form';
  const SELECT_CLASS = 'js-stats-select';
  const SELECTED_PARAM_CLASS = 'js-stats-selected-param';
  const SELECTED_LIST_CLASS = 'js-stats-selected';
  const SELECTED_ITEM_CLASS = 'js-stats-selected-item';
  const SELECTED_REMOVE_CLASS = 'js-stats-selected-remove';
  const SEARCH_CLASS = 'js-stats-search';
  const PARAM_PARENT_CLASS = 'js-stats-param-parent';
  const PARAM_CLASS = 'js-stats-param';
  const PARAM_SELECTED_CLASS= 'js-stats-param-selected';
  const SET_PARAM_CLASS = 'js-stats-set-param';
  const $date = $('.js-stats-date');
  const $select = $(`.${SELECT_CLASS}`);
  const $dropdown = $('.js-stats-dropdown');
  const $tab = $('.js-stats-tab');

  // tabs
  const Tabs = class {

    constructor (tabsParent) {
      this.parentElem = tabsParent;
      this.data = this.parentElem.dataset.tabParent;
      this.buttonClass = 'js-stats-tab-button';
      this.activeClass = 'active';
      this.buttonList = this.parentElem.querySelector(`.js-stats-tab-list[data-tab-child=${this.data}]`);
      this.buttons = [...this.buttonList.querySelectorAll(`.${this.buttonClass}`)];
      this._activeIndex = this.buttons.indexOf(this.buttonList.querySelector(`.${this.buttonClass}.${this.activeClass}`));
      this.items = [...this.parentElem.querySelectorAll(`.js-stats-tab-item[data-tab-child=${this.data}]`)];
      this.handleTabClick = this.handleTabClick.bind(this);
      this.addListeners();
    }

    handleTabClick (evt) {
      evt.preventDefault();
      if (!evt.target.classList.contains(this.buttonClass) || evt.target.classList.contains(this.activeClass)) return;
      const index = this.buttons.indexOf(evt.target);
      this.buttons[this._activeIndex].classList.remove(this.activeClass);
      this.items[this._activeIndex].classList.remove(this.activeClass);
      evt.target.classList.add(this.activeClass);
      this.items[index].classList.add(this.activeClass);
      this._activeIndex = index;
    }

    addListeners () {
      this.buttonList.addEventListener('click', this.handleTabClick);
    }
  };
  $tab.each((index, element) => {
    new Tabs(element);
  });

  // datepicker
  $date.on('change', (evt) => {
    $(evt.target).trigger('blur');
  });

  // dropdown
  const Dropdown = class {
    constructor (dropdownElem) {
      this.dropdown = dropdownElem;
      this.data = this.dropdown.dataset.dropdownParent;
      this.dropdownButton = this.dropdown.querySelector(`.js-stats-dropdown-button[data-dropdown-child=${this.data}]`);
      this.activeClass = 'active';
      this.toggleDropdown = this.toggleDropdown.bind(this);
      this.resize = this.resize.bind(this);
      this.init();
    }

    show () {
      const maxHeight = this.dropdown.scrollHeight;
      this.dropdown.style.maxHeight = `${maxHeight}px`;
      this.dropdownButton.classList.add(this.activeClass);
      this.dropdown.classList.add(this.activeClass);
      this.dropdown.addEventListener('transitionend', () => {
        const transition = window.getComputedStyle(this.dropdown).transition;
        this.dropdown.style.overflow = 'visible';
        this.dropdown.style.transition = 'none';
        this.dropdown.style.maxHeight = '600px';
        this.dropdown.style.transition = transition;
      }, {
        once: true,
      });
    }

    hide () {
      const transition = window.getComputedStyle(this.dropdown).transition;
      this.dropdown.style.transition = 'none';
      requestAnimationFrame(() => {
        this.dropdown.style.maxHeight = this.dropdown.scrollHeight;
        this.dropdown.style.transition = transition;
        requestAnimationFrame(() => {
          const maxHeight = this.dropdownButton.scrollHeight;
          this.dropdown.style.overflow = 'hidden';
          this.dropdown.style.maxHeight = `${maxHeight}px`;
          this.dropdownButton.classList.remove(this.activeClass);
          this.dropdown.classList.remove(this.activeClass);
        });
      });

    }

    toggleDropdown (evt) {
      evt.preventDefault();
      if (this.dropdownButton.classList.contains(this.activeClass)) {
        this.hide();
        return;
      }
      this.show();
    }

    resize () {
      if (!this.dropdownButton.classList.contains(this.activeClass)) return;
      this.dropdown.style.maxHeight = `${this.dropdown.scrollHeight}px`;
    }

    init () {
      this.dropdown.style.maxHeight = '1000px';
      this.dropdownButton.addEventListener('click', this.toggleDropdown);
    }
  }
  $dropdown.each((index, element) => {
    new Dropdown(element);
  });

  // select
  function debounce (func, timeout = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
  }
  const choices = {};
  const renderSelected = (name, value) => {
    const item = `
      <li class="stats__filter-selected-item js-stats-selected-item" data-value="${value}">
        <p class="stats__filter-selected-text">${name}</p>
        <button class="stats__filter-selecter-button js-stats-selected-remove" type="button">
            <span class="visually-hidden">Удалить</span>
        </button>
      </li>
    `;
    return item;
  };
  const inputHandler = debounce((evt) => {
    const value = evt.target.value;
    if (!value.trim() && !evt.initial) return;
    const $select = $(evt.target).closest('.choices').find(`.${SELECT_CLASS}`);
    const id = $select.data('id');
    $.ajax({
        method: "POST",
        url: "/local/ajax/statistics.php",
        data: {value: value, action: "searchPk"},
        dataType: "json",
    }).done(function (response) {
      if (!response.searchItems) return;
      const newChoices = response.searchItems.map((item) => {
        return {
          label: item.NAME,
          value: item.ID,
        };
      });
      choices[id].setChoices(newChoices, 'value', 'label', true);
    }).fail(function (error) {
      console.log(error.message);
    });
  }, 300);
  const choicesConfig = {
    singleArea: {
      classNames: {
        listDropdown: 'choices__dropdown',
        listSingle: 'choices__list--single choices__selected-list stats__filter-input stats__filter-select',
        inputCloned: 'choices__search',
        itemSelectable: 'choices__selected',
        activeState: 'active',
        openState: 'open',
      },
      searchPlaceholderValue: 'Поиск места проведения экзамена',
      noResultsText: 'Совпадений не найдено',
      callbackOnInit: function () {
        $(this.passedElement.element).one('change', () => {
          $(this.itemList.element).css('color', '#3b4256');
        });
      },
    },
    singleSkill: {
      searchResultLimit: 100,
      noResultsText: 'Совпадений не найдено',
      noChoicesText: 'Выберите квалификацию',
      searchPlaceholderValue: 'Поиск квалификации',
      classNames: {
        listDropdown: 'choices__dropdown',
        listSingle: 'choices__list--single choices__selected-list stats__filter-input stats__filter-select',
        inputCloned: 'choices__search',
        itemSelectable: 'choices__selected',
        activeState: 'active',
        openState: 'open',
      },
      callbackOnInit: function () {
        $(this.passedElement.element).one('change', () => {
          $(this.itemList.element).css('color', '#3b4256');
        });

        // ajax на ввод
        $(this.input.element).on('input', inputHandler);
        inputHandler({target: this.input.element, initial: true});
      },
    },
    multipleArea: {
      maxItemCount: 6,
      maxItemText: (maxItemCount) => {
        return `Максимальное количество - ${maxItemCount}`;
      },
      removeItems: true,
      removeItemButton: true,
      searchResultLimit: 100,
      noResultsText: 'Совпадений не найдено',
      noChoicesText: 'Выберите квалификацию',
      classNames: {
        listDropdown: 'choices__dropdown',
        listSingle: 'choices__list--single choices__selected-list stats__filter-input stats__filter-select',
        inputCloned: `choices__search ${SEARCH_CLASS}`,
        itemSelectable: 'choices__selected',
        activeState: 'active',
        openState: 'open',
      },
      callbackOnInit: function () {
        const choice = this;

        // модификации DOM
        this.dropdown.element.prepend(this.containerInner.element);
        this.input.element.placeholder = 'Поиск квалификаций';
        const choosedTitle = document.createElement('div');
        choosedTitle.classList.add('stats__filter-select-title-wrap');
        choosedTitle.innerHTML = `
          <p class="stats__filter-select-title">Выбранные квалификации</p>
          <p class="stats__filter-select-info">Максимальное количество — ${this.config.maxItemCount}</p>
          `;
        this.containerInner.element.prepend(choosedTitle);

        const choicesTitle = document.createElement('div');
        choicesTitle.classList.add('stats__filter-select-title-wrap');
        choicesTitle.innerHTML = '<p class="stats__filter-select-title">Список квалификаций</p>';
        this.dropdown.element.insertBefore(choicesTitle, this.choiceList.element);

        // ajax на ввод
        $(this.input.element).on('input', inputHandler);
        inputHandler({target: this.input.element, initial: true});
        // синзронизация мультиселекта и списка выбранных
        const param = $(this.passedElement.element).closest(`.${SELECTED_PARAM_CLASS}`);
        const paramType = param.data('selected');
        const $selectedList = $(this.passedElement.element).closest(`.${FORM_CLASS}`).find(`.${SELECTED_LIST_CLASS}[data-selected=${paramType}]`);
        $(this.passedElement.element).on('addItem', (evt) => {
          $selectedList.prepend(renderSelected(evt.detail.label, evt.detail.value));
        });
        $(this.passedElement.element).on('removeItem', (evt) => {
          $selectedList.find(`.${SELECTED_ITEM_CLASS}[data-value="${evt.detail.value}"]`).remove();
        });
        $selectedList.on('click', `.${SELECTED_REMOVE_CLASS}`, (evt) => {
          evt.preventDefault();
          const $item = $(evt.target).closest(`.${SELECTED_ITEM_CLASS}`);
          const value = $item.data('value');
          $item.remove();
          choice.removeActiveItemsByValue(value);
        });
      },
    },
    multipleSkill: {
      maxItemCount: 6,
      maxItemText: (maxItemCount) => {
        return `Максимальное количество - ${maxItemCount}`;
      },
      removeItems: true,
      removeItemButton: true,
      searchResultLimit: 100,
      noResultsText: 'Совпадений не найдено',
      noChoicesText: 'Выберите место проведения экзамена',
      classNames: {
        listDropdown: 'choices__dropdown',
        listSingle: 'choices__list--single choices__selected-list stats__filter-input stats__filter-select',
        inputCloned: `choices__search ${SEARCH_CLASS}`,
        itemSelectable: 'choices__selected',
        activeState: 'active',
        openState: 'open',
      },
      callbackOnInit: function () {
        const choice = this;
        // модификации DOM
        this.dropdown.element.prepend(this.containerInner.element);
        this.input.element.placeholder = 'Поиск места проведения экзамена';
        const choosedTitle = document.createElement('div');
        choosedTitle.classList.add('stats__filter-select-title-wrap');
        choosedTitle.innerHTML = `
          <p class="stats__filter-select-title">Выбранные места проведения экзамена</p>
          <p class="stats__filter-select-info">Максимальное количество — ${this.config.maxItemCount}</p>
          `;
        this.containerInner.element.prepend(choosedTitle);

        const choicesTitle = document.createElement('div');
        choicesTitle.classList.add('stats__filter-select-title-wrap');
        choicesTitle.innerHTML = '<p class="stats__filter-select-title">Список мест проведения экзамена</p>';
        this.dropdown.element.insertBefore(choicesTitle, this.choiceList.element);

        // ajax на ввод
        // $(this.input.element).on('input', inputHandler);

        // синзронизация мультиселекта и списка выбранных
        const param = $(this.passedElement.element).closest(`.${SELECTED_PARAM_CLASS}`);
        const paramType = param.data('selected');
        const $selectedList = $(this.passedElement.element).closest(`.${FORM_CLASS}`).find(`.${SELECTED_LIST_CLASS}[data-selected=${paramType}]`);
        $(this.passedElement.element).on('addItem', (evt) => {
          $selectedList.prepend(renderSelected(evt.detail.label, evt.detail.value));
        });
        $(this.passedElement.element).on('removeItem', (evt) => {
          $selectedList.find(`.${SELECTED_ITEM_CLASS}[data-value="${evt.detail.value}"]`).remove();
        });
        $selectedList.on('click', `.${SELECTED_REMOVE_CLASS}`, (evt) => {
          evt.preventDefault();
          const $item = $(evt.target).closest(`.${SELECTED_ITEM_CLASS}`);
          const value = $item.data('value') + '';
          $item.remove();
          choice.removeActiveItemsByValue(value);
        });
      },
    },
  };
  $select.each((index, element) => {
    const id = element.dataset.id;
    const type = element.dataset.type;
    choices[id] = new Choices(element, choicesConfig[type]);
    if (id === 'an-single-skill' || id === 'an-single-area') choices[id].disable();
  });
  // autoscroll on hover
  $select.on('change', (evt) => {
    $(evt.target).closest('.choices').find('.choices__selected-list').on('mouseover', (e) => {
      const text = $(e.currentTarget).find('.choices__selected')[0];
      text.textContent += '\u2000';
      let index = 1;
      function scroll () {
        requestAnimationFrame(() => {
          text.scroll({
            left: index,
          });
          if (index === 0) return;
          index += 1;
          scroll();
        });
      }
      scroll();
      $(e.currentTarget).one('mouseout', () => {
        index = 0;
        text.scroll({
          left: 0,
          behavior: 'smooth',
        });
      });
    });
  });

  // Popup
  const Popup = class {

    constructor (popupElem) {
      this.popupElement = popupElem;
      this.underlay = this.popupElement.querySelector('.js-stats-popup-underlay');
      this.closePopup = this.popupElement.querySelector('.js-stats-popup-close');
      this.activeClass = 'active';
      this.open = this.open.bind(this);
      this.close = this.close.bind(this);
      this._onEsc = this._onEsc.bind(this);
    }

    open () {
      this.popupElement.style.display = 'flex';
      requestAnimationFrame(() => {
          this.popupElement.classList.add(this.activeClass);
          this._addListeners();
          document.body.classList.add('no-scroll');
      });
    }

    close (evt) {
      evt.preventDefault();
      this.popupElement.classList.remove(this.activeClass);
      this.popupElement.addEventListener('transitionend', () => {
          this.popupElement.style.display = 'none';
          this._removeListeners();
          document.body.classList.remove('no-scroll');
      }, {
        once: true,
      });
    }

    _onEsc (evt) {
      const escKeyValues = ['Escape', 'Esc'];
      if (escKeyValues.some((code) => evt.key === code)) this.close(evt);
    }

    _addListeners () {
      this.underlay.addEventListener('click', this.close);
      this.closePopup.addEventListener('click', this.close);
      document.addEventListener('keydown', this.onEsc);
    }

    _removeListeners () {
      this.underlay.removeEventListener('click', this.close);
      this.closePopup.removeEventListener('click', this.close);
      document.removeEventListener('keydown', this.onEsc);
    }
  };

  const popupInvalid = new Popup(document.querySelector(`.${POPUP_CLASS}[data-popup=admin-stats-invalid]`));
  const popupError = new Popup(document.querySelector(`.${POPUP_CLASS}[data-popup=admin-stats-error]`));

  // validateForm
  const validateForm = (form) => {
    let isValid = true;
    const required = [...form.querySelectorAll(`.${SELECT_CLASS}[data-required=true]:not(:disabled)`)];
    if (!required.length) return isValid;
    isValid = required.every(select => {
      return select.value.trim();
    });
    if (!isValid) {
      required.forEach(select => {
        const choicesSingle = select.parentNode.querySelector('.choices__list--single');
        choicesSingle.classList.add('invalid');
        select.addEventListener('change', () => {
          choicesSingle.classList.remove('invalid');
        }, {once: true});
      });
      popupInvalid.open();
    }
    return isValid;
  };

  // reset select
  const resetSelect = (evt) => {
    const selects = [...evt.target.querySelectorAll('.js-stats-select')];
    const singleSelects = selects.filter(select => select.matches(':not([multiple])'));
    const multipleSelects = selects.filter(select => select.matches('[multiple]'));
    const selectedLists = [...multipleSelects[0].closest(`.${FORM_CLASS}`).querySelectorAll(`.${SELECTED_LIST_CLASS}`)];
    singleSelects.forEach(select => {
      choices[select.dataset.id].destroy();
      choices[select.dataset.id].init();
    });
    multipleSelects.forEach(select => {
      choices[select.dataset.id].removeActiveItems();
    })
    selectedLists.forEach(list => {
      list.innerHTML = '';
    });
  };

  // ajax
  const ajaxTemplate = (requestData) => {
      return window.fetch('/local/ajax/statistics.php', {method: 'POST', body: requestData})
          .then(function(response) {return response.json();})
  };

  // cards page
  const CARDS_PAGE_CLASS = 'js-stats-cards';
  const CARD_CLASS = 'js-stats-card';
  const CARD_COUNT_CLASS = 'js-stats-card-count';
  const cardsPageElement = document.querySelector(`.${CARDS_PAGE_CLASS}`);
  const cardsAjaxTemplate = () => {

    let data = new FormData($('.js-stats-cards .js-stats-form')[0])
    return window.fetch('/local/ajax/statistics.php', {method: 'POST', body: data})
        .then(function(response) {return response.json();})

    /*return new Promise((resolve, reject) => {
      return resolve(
        {
          request: {
            all: {
              count: Math.round(Math.random() * 100),
              href: '#',
            },
            success: {
              count: Math.round(Math.random() * 100),
              href: '#',
            },
            fail: {
              count: Math.round(Math.random() * 100),
              href: '#',
            },
          },
          theory: {
            all: {
              count: Math.round(Math.random() * 100),
              href: '#',
            },
            success: {
              count: Math.round(Math.random() * 100),
              href: '#',
            },
            fail: {
              count: Math.round(Math.random() * 100),
              href: '#',
            },
          },
        }
      );
    });*/
  };
  const CardsPage = class {
    constructor (page) {
      this.parent = page;
      this.cardCountClass = CARD_COUNT_CLASS;
      this.form = this.parent.querySelector(`.${FORM_CLASS}`);
      this.cards = [...this.parent.querySelectorAll(`.${CARD_CLASS}`)];
      this.update = this.update.bind(this);
      this._init();
      this._addListeners();
    }

    update (data) {
      this.cards.forEach(card => {
        const group = card.dataset.statsGroup;
        const type = card.dataset.statsType;
        card.href = data[group][type].href;
        card.querySelector(`.${this.cardCountClass}`).textContent = data[group][type].count;
      });
    }

    _addListeners () {
      this.form.addEventListener('submit', (evt) => {
        evt.preventDefault();
        if (!validateForm(evt.target)) {
          return;
        };

        const data = new FormData(evt.target);

        cardsAjaxTemplate()
          .then(data => this.update(data))
          .catch(error => {
            console.log(error);
            popupError.open();
          });
      });
      this.form.addEventListener('reset', (evt) => {
        resetSelect(evt);
        cardsAjaxTemplate()
          .then(data => this.update(data))
          .catch(error => {
            console.log(error);
            popupError.open();
          });
      });
    }

    _init () {
      cardsAjaxTemplate()
        .then(data => this.update(data))
        .catch(error => {
          console.log(error);
          popupError.open();
        });
    }
  };
  const cardsPage = new CardsPage(cardsPageElement);

  // table page
  const TABLE_PAGE = 'js-stats-table'
  const TABLE_CLASS = 'js-stats-tbody';
  const POPUP_OPEN_CLASS = 'js-stats-skill';
  const POPUP_TABLE_CLASS = 'js-stats-popup-table';
  const tableAjaxTemplate = (requestData) => {

      return window.fetch('/local/ajax/statistics.php', {method: 'POST', body: requestData})
          .then(function(response) {return response.json();})
    /*return new Promise ((resolve, reject) => {
      const getItem = () => {
        return {
          correct: Math.round(Math.random() * 100) + '%',
          time: '00:' + Math.round(Math.random() * 59),
          number: Math.round(Math.random() * 200),
        };
      };
      return resolve(new Array(20).fill(null).map(item => getItem()));
    });*/
  };


  const TablePage = class {
    constructor (page) {
      this.parent = page;
      this.form = this.parent.querySelector(`.${FORM_CLASS}`);
      this.table = this.parent.querySelector(`.${TABLE_CLASS}`);
      this.buttonClass = POPUP_OPEN_CLASS;
      this.popup = new Popup(document.querySelector(`.${POPUP_CLASS}[data-popup=admin-stats-table]`));
      this.popupElement = this.popup.popupElement;
      this.popupTable = this.popupElement.querySelector(`.${POPUP_TABLE_CLASS}`);
      this.initClass = 'init';
      this._openPopup = this._openPopup.bind(this);
      this._addListeners();
    }

    update (data) {
      this.parent.classList.remove(this.initClass);
      const sumArray = (array) => array.reduce((accum, item) => {
        accum += item;
        return accum;
      }, null);
      const tableRows = data.props.reduce((accum, item) => {
        accum +=
          `<tr class="stats__skill-tr">
            <td class="stats__skill-td">
              <button class="stats__skill-button ${this.buttonClass}" data-id="${item.id}">${item.prop}</button>
            </td>
            <td class="stats__skill-td">${sumArray(item.request)}</td>
            <td class="stats__skill-td">${sumArray(item.success)}</td>
            <td class="stats__skill-td">${sumArray(item.fail)}</td>
          </tr>`
        return accum;
      }, '');
      this.table.innerHTML = tableRows;
    }

    _addListeners () {
      this.form.addEventListener('submit', (evt) => {
        evt.preventDefault();
        if (!validateForm(evt.target)) {
          return;
        }
        const data = new FormData(evt.target);
        ajaxTemplate(data)
          .then(data => this.update(data))
          .catch(error => {
            console.log(error);
            popupError.open();
          });
      });
      this.form.addEventListener('reset', (evt) => {
        let data = new FormData(evt.target);
        resetSelect(evt);
        this.parent.classList.add(this.initClass);
        // ajaxTemplate()
        //   .then(data => this.update(data))
        //   .catch(error => {
        //     console.log(error);
        //     popupError.open();
        //   });
      });
      this.table.addEventListener('click', this._openPopup);
    }

    _openPopup (evt) {
      evt.preventDefault();
      evt.target.blur();
      if (!evt.target.matches(`.${this.buttonClass}`)) return;

      let skill = $(evt.target).data('id');
      $('[data-popup=admin-stats-table] .js-stats-popup-name').text(evt.target.textContent);

      let formData = new FormData($('.js-stats-table .js-stats-form')[0]);
      formData.append('action', 'getQuestionsStatistics');
      formData.append('id', skill);

      tableAjaxTemplate(formData).then(data => {
        const tableRows = data.reduce((accum, item, index) => {
          accum +=
            `<tr class="stats__popup-tr">
              <td class="stats__popup-td">${item.name}</td>
              <td class="stats__popup-td">${item.correct}</td>
              <td class="stats__popup-td">${item.time}</td>
              <td class="stats__popup-td">${item.number}</td>
            </tr>`
          return accum;
        }, '')

        this.popupTable.innerHTML = tableRows;
        this.popup.open();
      }).catch(error => {
        console.log(error);
        popupError.open();
      });

    }
  };
  const tablePageElement = document.querySelector(`.${TABLE_PAGE}`);
  const tablePage = new TablePage(tablePageElement);

  // analytics page
  const ANALYTICS_PAGE_CLASS = 'js-stats-analytics';
  const CHART_WRAP_CLASS = 'js-stats-chart-wrap';
  const CHART_VIEW_CLASS = 'js-stats-chart-view';
  const CHART_VIEW_INPUT_CLASS = 'js-stats-chart-view-input';
  const CHART_PARENT_CLASS = 'js-stats-chart-parent';
  const CHART_AREA_CLASS = 'js-stats-area';
  const CHART_INTERVAL_START_CLASS = 'js-stats-interval-start';
  const CHART_INTERVAL_END_CLASS = 'js-stats-interval-end';
  const CHART_NAME_CLASS = 'js-stats-name';
  const CHART_PROPS_CLASS = 'js-stats-props';
  const CHART_CLASS = 'js-stats-chart';
  const TOGGLE_CHART_CLASS = 'js-stats-chart-toggle';
  const CHART_PRINT_CLASS = 'js-stats-chart-print';
  const CHART_PRINT_TITLE_CLASS = 'js-stats-chart-print-title';
  const CHART_PRINT_TEXT_CLASS = 'js-stats-chart-print-text';
  const ADAPT_CLASS = 'js-stats-adapt';

  const MyChart = class {
    constructor (chartItem, ajaxData) {
      this.parent = chartItem;
      this.chartElement = this.parent.querySelector(`.${CHART_CLASS}`);
      this.printButton = this.parent.querySelector(`.${CHART_PRINT_CLASS}`);
      this.toggleClass = TOGGLE_CHART_CLASS;
      this.toggles = [...this.parent.querySelectorAll(`.${this.toggleClass}`)];
      this.chartType = this.parent.dataset.chartType;
      this._GRAPH_COLORS = [
        {
          name: 'blue',
          r: 80,
          g: 138,
          b: 255,
        },
        {
          name: 'yellow',
          r: 243,
          g: 168,
          b: 62,
        },
        {
          name: 'green',
          r: 49,
          g: 217,
          b: 156,
        },
        {
          name: 'red',
          r: 229,
          g: 77,
          b: 96,
        },
        {
          name: 'purple',
          r: 133,
          g: 103,
          b: 255,
        },
        {
          name: 'pink',
          r: 236,
          g: 121,
          b: 255,
        },
      ];
      this._bgColors = this._GRAPH_COLORS.map(item => {
        return `rgba(${item.r}, ${item.g}, ${item.b}, 1)`;
      })
      this.data = ajaxData;
      this.chart = new Chart(this.chartElement, this._getChartConfig());
      this.activeClass = 'active';
      this.dataURL = '';
      this.title = this.parent.querySelector(`.${CHART_PRINT_TITLE_CLASS}`);
      this._toggleChart = this._toggleChart.bind(this);
      this._addListeners();
    }

    updateView (ajaxData, view) {
      this.data = ajaxData;
      this.chartElement.dataset.chartView = view;
      this._updateConfig();
      const targetToggle = this.toggles.find(toggle => toggle.dataset.chartView === view);
      this.toggles.forEach(toggle => toggle.classList.remove(this.activeClass));
      targetToggle.classList.add(this.activeClass);
    }

    _getChartConfig () {
      const chartView = this.chartElement.dataset.chartView;
      // set dataURL for chart
      const setPrint = (context) => {
        this.dataURL = context.chart.toBase64Image('image/png', 1);
      };
      switch (chartView) {
        case 'bar':
        return {
          type: 'bar',
          data: {
            labels: [null, null ,...this.data.props.map(item => item.prop), null, null],
            datasets: [{
              label: '',
              data: [null, null, ...this.data.props.map((dataItem) => {
                return dataItem[this.chartType].reduce((accum, number) => {
                  accum += number;
                  return accum;
                }, 0);
              }), null, null],
            }],
          },
          plugins: [
            {
              id: 'custom_canvas_background_color',
              beforeDraw: (chart) => {
                const ctx = chart.canvas.getContext('2d');
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
              },
            },
          ],
          options: {
            responsive: false,
            maintainAspectRatio: false,
            categoryPercentage: 0.9,
            borderRadius: 4,
            borderskipped: 'bottom',
            borderWidth: 0,
            backgroundColor: [null, null, ...this._getBgGradients(), null, null],
            animation: {
              onComplete: setPrint,
            },
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                padding: 8,
                displayColors: true,
                titleFont: {
                  size: 14,
                  family: 'Roboto',
                },
                bodyFont: {
                  size: 14,
                  family: 'Roboto',
                },
              },
            },
            scales: {
              x: {
                grid: {
                  display: false,
                  borderColor: 'rgba(225, 234, 245, 1)',
                },
                ticks: {
                  display: false,
                },
              },
              y: {
                grid: {
                  tickLength: 0,
                  borderDash: [8, 8],
                  borderWidth: 0,
                  color: 'rgba(225, 234, 245, 1)',
                },
                ticks: {
                  count: 4,
                  padding: 8,
                  font: {
                    size: 12,
                    family: 'Roboto',
                    color: 'rgba(59, 66, 86, 0.5)',
                  },
                  callback: function(value, index, values) {
                    return +Number.parseInt(value);
                  },
                },
              },
            },
          },
        };
        case 'line':
          // if (this.data.dates.length > 15) {
          //   this.chartElement.style.minWidth = `${this.data.dates.length * 45}px`;
          //   this.chartElement.parentNode.classList.add('custom-scroll');
          // } else {
          //   this.chartElement.style.minWidth = '100%';
          //   this.chartElement.parentNode.classList.remove('custom-scroll');
          // }
          return {
          type: 'line',
          data: {
            labels: this.data.dates,
            datasets: this.data.props.map((item, index) => {
              const dataset = {
                label: item.prop,
                data: item[this.chartType],
                borderColor: this._bgColors[index],
                pointHoverBackgroundColor: this._bgColors[index],
              };
              return dataset;
            }),
          },
          plugins: [
            {
              id: 'custom_canvas_background_color',
              beforeDraw: (chart) => {
                const ctx = chart.canvas.getContext('2d');
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
              },
            },
          ],
          options: {
            responsive: false,
            maintainAspectRatio: false,
            borderWidth: 1,
            cubicInterpolationMode: 'monotone',
            fill: false,
            pointRadius: 6,
            pointHitRadius: 20,
            pointBorderWidth: 0,
            pointBackgroundColor: 'rgba(255, 255, 255, 0)',
            pointHoverRadius: 4,
            animation: {
              onComplete: setPrint,
            },
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                padding: 12,
                caretPadding: 5,
                displayColors: false,
                titleFont: {
                  size: 14,
                  family: 'Roboto',
                },
                bodyColor: 'rgba(255, 255, 255, 1)',
                bodyFont: {
                  size: 14,
                  family: 'Roboto',
                },
                bodySpacing: 0,
                callbacks: {
                  title: function (context) {
                    return context[0].formattedValue;
                  },
                  label: function (context) {
                    return context.dataset.label;
                  },
                }
              },
            },
            scales: {
              x: {
                grid: {
                  display: false,
                  borderColor: 'rgba(225, 234, 245, 1)',
                },
                ticks: {
                  padding: 0,
                  font: {
                    size: 12,
                    family: 'Roboto',
                    color: 'rgba(59, 66, 86, 0.5)',
                  },
                },
              },
              y: {
                grid: {
                  tickLength: 0,
                  borderDash: [8, 8],
                  borderWidth: 0,
                  color: 'rgba(225, 234, 245, 1)',
                },
                ticks: {
                  count: 4,
                  padding: 8,
                  font: {
                    size: 12,
                    family: 'Roboto',
                    color: 'rgba(59, 66, 86, 0.5)',
                  },
                  callback: function(value, index, values) {
                    return +Number.parseInt(value);
                  },
                },
              },
            },
          },
        };
      };
    }

    _getBgGradients () {
      const barCtx = this.chartElement.getContext('2d');
      const gradients = this._GRAPH_COLORS.map(item => {
        const gradient = barCtx.createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, `rgba(${item.r}, ${item.g}, ${item.b}, 0.75)`);
        gradient.addColorStop(1, `rgba(${item.r}, ${item.g}, ${item.b}, 0.5)`);
        return gradient;
      });
      return gradients;
    }

    _updateConfig () {
      const newConfig = this._getChartConfig();
      this.chart.config.type = newConfig.type;
      this.chart.config.data = newConfig.data;
      this.chart.config.options = newConfig.options;
      this.chartElement.style.width ='100%';
      const width = this.chartElement.getBoundingClientRect().width;
      this.chart.resize(width, 250);
      this.chart.update();
    }

    _addListeners () {
      this.parent.addEventListener('click', this._toggleChart);
    }

    _toggleChart (evt) {
      if (!evt.target.matches(`.${this.toggleClass}`) || evt.target.matches(`.${this.toggleClass}.${this.activeClass}`)) return;
      evt.preventDefault();
      const toggle = evt.target;
      const chartView = toggle.dataset.chartView;
      this.chartElement.dataset.chartView = chartView;
      this._updateConfig();
      this.toggles.forEach(toggle => toggle.classList.remove(this.activeClass));
      toggle.classList.add(this.activeClass);
    }
  };

  const Param = class {
    constructor (parentElem) {
      this.parent = parentElem;
      this.params = [...this.parent.querySelectorAll(`.${PARAM_CLASS}`)];
      this.setParamClass = SET_PARAM_CLASS;
      this.selectClass = SELECT_CLASS;
      this.selectedClass = PARAM_SELECTED_CLASS;
      this.activeClass = 'active';
      this.initParam = this.params[0].dataset.param;
      this.handleClick = this.handleClick.bind(this);
      this.setInit();
      this.parent.addEventListener('input', this.handleClick);
    }

    show (param) {
      const selectedLists = [...this.parent.querySelectorAll(`.${this.selectedClass}[data-param=${param.dataset.param}]`)];
      selectedLists.forEach(list => list.classList.add(this.activeClass));
      param.classList.add(this.activeClass);
      const selectElements = param.querySelectorAll(`.${this.selectClass}`)
      selectElements.forEach(element => {
        choices[element.dataset.id].enable();
      });
    }

    hide (param) {
      const selectedLists = [...this.parent.querySelectorAll(`.${this.selectedClass}[data-param=${param.dataset.param}]`)];
      selectedLists.forEach(list => list.classList.remove(this.activeClass));
      param.classList.remove(this.activeClass);
      const selectElements = param.querySelectorAll(`.${this.selectClass}`);
      selectElements.forEach(element => {
        choices[element.dataset.id].disable();
      });
    }

    handleClick (evt) {
      if (!evt.target.matches(`.${this.setParamClass}`)) return;
      const paramType = evt.target.dataset.param;
      this.params.forEach(param => {
        const isMatch = param.dataset.param === paramType;
        isMatch ? this.show(param) : this.hide(param);
      });
    }

    setInit () {
      const paramType = this.initParam;
      this.params.forEach(param => {
        const isMatch = param.dataset.param === paramType;
        isMatch ? this.show(param) : this.hide(param);
      });
    }

    setChecked () {
      const checked = this.parent.querySelector(`.${this.setParamClass}:checked`);
      const paramType = checked.dataset.param;
      this.params.forEach(param => {
        const isMatch = param.dataset.param === paramType;
        isMatch ? this.show(param) : this.hide(param);
      });
    }
  };

  const MAP_WRAP_CLASS = 'js-stats-map-wrap';
  const MAP_PARENT_CLASS = 'js-stats-map-parent';
  const MAP_PRINT_CLASS = 'js-stats-map-print';
  const MAP_CLASS = 'js-stats-map';
  const MAP_GRID_CLASS = 'js-stats-map-grid';

  const MAP_DATA = {
    request: {
      'RU-ALT': 34,
      'RU-BEL': 45,
      'RU-STA': 294,
      'RU-KHA': 3,
      'RU-LIP': 100,
      'RU-PNZ': 188,
      'RU-TAM': 1000,
      'RU-KYA': 56,
      'RU-CHU': 744,
      'RU-KO': 700,
    },
    success: {
      'RU-ALT': 34,
      'RU-BEL': 5,
      'RU-STA': 294,
      'RU-KHA': 3,
      'RU-LIP': 3455,
      'RU-PNZ': 188,
      'RU-KYA': 2200,
      'RU-KO': 1500,
      'RU-CHU': 221,
      'RU-TAM': 233,
    },
    fail: {
      'RU-ALT': 2323,
      'RU-BEL': 45,
      'RU-STA': 43,
      'RU-KHA': 3,
      'RU-KYA': 1200,
      'RU-LIP': 23,
      'RU-KO': 1990,
      'RU-PNZ': 188,
      'RU-CHU': 244,
      'RU-TAM': 443,
    },
  };

  const Map = class {
    constructor (mapParent, ajaxData) {
      this.parent = mapParent;
      this.printButton = this.parent.querySelector(`.${MAP_PRINT_CLASS}`);
      this.mapElement = this.parent.querySelector(`.${MAP_CLASS}`);
      this.grid = this.mapElement.parentNode.querySelector(`.${MAP_GRID_CLASS}`);
      this.type = this.mapElement.dataset.chartType;
      this._options = {
        center: [66.868747, 100.365425],
        zoom: 2,
        controls: [],
      };
      this._defaultGeoOptions = {
        fillColor: '#ffffff',
        fillOpacity: 0,
        strokeStyle: 'solid',
        strokeColor: '#ffffff',
        strokeOpacity: 0.0000001,
      };
      this.init(ajaxData);
    }

    _getPointsCollection (data) {
      let pointsFeatures = [];
      for (const [regionId, regionData] of Object.entries(data)) {
        if (typeof regionData.points != 'undefined') {
          for (const [key, points] of Object.entries(regionData.points)) {
            let pointFeature = {
              type: "Feature",
              id: key,
              geometry: {
                type: "Point",
                coordinates: points.coords
              },
              properties: {
                balloonContent: points.name
              },
              options: {
                iconLayout: 'default#image',
                iconImageHref: '/local/templates/ibrush/svg_icons/map-icon-statistic.svg',
              }
            }
            pointsFeatures.push(pointFeature);
          }
        }
      }

      return {
        type: 'FeatureCollection',
        features: pointsFeatures
      };
    }

    init (ajaxData) {
      this.map = new ymaps.Map(this.mapElement, this._options);
      this.map.panes.get('ground').getElement().style.filter = 'grayscale(100%)';
      const data = ajaxData[this.type];
      let dataNumbers = objectMap(data, function(obj) {
        return obj.count;
      });
      dataNumbers = Object.values(dataNumbers);
      if (!dataNumbers.length) return;

      let pointsCollection = this._getPointsCollection(data);

      ymaps.ready(() => {

        ymaps.borders.load('RU', {
          lang: 'ru',
          quality: 2,
          }).then(geojson => {
            this.collection = geojson.features.map(feature => {
              const region = feature.properties.iso3166;
              feature.id = region;

              if (typeof data[region] !== 'undefined' && data[region].count > 0) {
                const count = data[region].count;
                const percent = this._getPercent(count, dataNumbers)
                const color = this._getColor(percent);
                feature.options = {
                  fillColor: color,
                  fillOpacity: 0.4,
                  strokeColor: color,
                  strokeStyle: 'solid',
                  strokeOpacity: 0.5,
                };
              } else {
                feature.options = this._defaultGeoOptions;
              }
              return feature;
            });
            const objectCollection = {
              type: 'FeatureCollection',
              features: this.collection,
            };

            this.geoQuery = ymaps.geoQuery(objectCollection).addToMap(this.map);
            this.geoQueryPoints = ymaps.geoQuery(pointsCollection).addToMap(this.map);

            // const geoObject = this.geoQuery.searchContaining([55.771064, 37.661527]).get(0);
            // geoObject.options.set({
            //   fillColor: '#ff0000',
            //   fillOpacity: 1,
            // });
          })
          .catch(error => console.log(error));
        this._setGrid(dataNumbers);
      });
    }

    update (ajaxData) {

      this.map.destroy();
      this.init(ajaxData);
      return;

      const data = ajaxData[this.type];
      let dataNumbers = objectMap(data, function(obj) {
        return obj.count;
      });
      dataNumbers = Object.values(dataNumbers);
      this.geoQuery.each((geoObject) => {
        const region = geoObject.properties.get('iso3166');
        if (typeof data[region] !== 'undefined') {
          const count = data[region].count;
          const percent = this._getPercent(count, dataNumbers);
          const color = this._getColor(percent);
          geoObject.options.set({
            fillColor: color,
            fillOpacity: 0.4,
            strokeColor: color,
            strokeStyle: 'solid',
            strokeOpacity: 0.5,
          });
        } else {
          geoObject.options.set(this._defaultGeoOptions);
        }
      });

      this.geoQueryPoints.each((geoObject) => {
        this.geoQueryPoints.remove(geoObject);
      });

      let pointsCollection = this._getPointsCollection(data);
      //this.map.destroy();
    }

    _getPercent (nubmer, array) {
      let min = Math.min(...array)
      let max = Math.max(...array);
      if (min == max) return 1;
      const maxNormalized =  max - min;
      return (nubmer - Math.min(...array)) / maxNormalized;
    }

    _setGrid (numbers) {
      const NUMBER = 10;
      const min = Math.round(Math.min(...numbers));
      const step = Math.round((Math.max(...numbers) - Math.min(...numbers)) / NUMBER);
      let listItems = ``;
      const array = new Array(NUMBER).fill(null).map((item, index) => {
        item = min + (step * index);
        listItems += `
          <li class="stats__map-grid-item">${item}</li>
        `;
        return item;
      });
      this.grid.innerHTML = listItems;
    }

    _getColor (percent) {
      const MAX = 120;
      let h = MAX * percent,
          s = 95,
          l = 55;

      s /= 100;
      l /= 100;

      let c = (1 - Math.abs(2 * l - 1)) * s,
          x = c * (1 - Math.abs((h / 60) % 2 - 1)),
          m = l - c/2,
          r = 0,
          g = 0,
          b = 0;

      if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
      } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
      } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
      } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
      } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
      } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
      }
      r = Math.round((r + m) * 255).toString(16);
      g = Math.round((g + m) * 255).toString(16);
      b = Math.round((b + m) * 255).toString(16);
      if (r.length == 1)
        r = "0" + r;
      if (g.length == 1)
        g = "0" + g;
      if (b.length == 1)
        b = "0" + b;
      return "#" + r + g + b;
    }
  }

  const AnalyticsPage = class {
    constructor (page) {
      this.parent = page;
      this.form = this.parent.querySelector(`.${FORM_CLASS}`);
      this.chartView = this.form.querySelector(`.${CHART_VIEW_CLASS}`);
      this.chartViewInputClass = CHART_VIEW_INPUT_CLASS;
      this.chartViewInputs = [...this.chartView.querySelectorAll(`.${this.chartViewInputClass}`)];
      this.paramElement = this.form.querySelector(`.${PARAM_PARENT_CLASS}`);
      this.param = new Param(this.paramElement);
      this.chartWrap = this.parent.querySelector(`.${CHART_WRAP_CLASS}`);
      this.chartArea = this.parent.querySelector(`.${CHART_AREA_CLASS}`);
      this.chartInterval = {
        start: this.parent.querySelector(`.${CHART_INTERVAL_START_CLASS}`),
        end: this.parent.querySelector(`.${CHART_INTERVAL_END_CLASS}`),
      };
      this.chartName = this.parent.querySelector(`.${CHART_NAME_CLASS}`);
      this.chartProps = this.parent.querySelector(`.${CHART_PROPS_CLASS}`);
      this.chartElements = [...this.parent.querySelectorAll(`.${CHART_PARENT_CLASS}`)];
      this.chartPrintText = this.parent.querySelector(`.${CHART_PRINT_TEXT_CLASS}`);
      this.charts = [];
      this.initClass = 'init';
      this.activeClass = 'active';
      this.mapWrap = this.parent.querySelector(`.${MAP_WRAP_CLASS}`);
      this.mapParents = [...this.mapWrap.querySelectorAll(`.${MAP_PARENT_CLASS}`)];
      this.maps = [];
      this.adaptElements = [...this.form.querySelectorAll(`.${ADAPT_CLASS}`)];
      this._adaptForm = this._adaptForm.bind(this);
      this._printChart = this._printChart.bind(this);
      this._addListeners();
    }

    _addListeners () {
      this.form.addEventListener('submit', (evt) => {
        evt.preventDefault();
        if (!validateForm(evt.target)) {
          return;
        };
        // this.chartView.disabled = true;
        const data = new FormData(evt.target);
        // this.chartView.disabled = false;
        ajaxTemplate(data)
          .then(data => this._update(data))
          .catch(error => {
            console.log(error);
            popupError.open();
          });
      });
      this.form.addEventListener('reset', (evt) => {
        resetSelect(evt);
        this.param.setInit();
        this.adaptElements.forEach(element => this._showAdapt(element));
        this.chartWrap.classList.remove(this.activeClass);
        this.mapWrap.classList.remove(this.activeClass);
        // let data = new FormData(evt.target);
        // setTimeout(() => {
        //   ajaxTemplate()
        //     .then(data => this._update(data))
        //     .catch(error => {
        //       console.log(error);
        //       popupError.open();
        //     });
        // }, 0);
      });
      this.chartView.addEventListener('change', this._adaptForm);
    }

    _adaptForm (evt) {
      if (!evt.target.matches(`.${this.chartViewInputClass}`)) return;
      const view = evt.target.dataset.view;
      if (view === 'map') {
        this.adaptElements.forEach(element => this._hideAdapt(element));
      } else {
        this.adaptElements.forEach(element => this._showAdapt(element));
        this.param.setChecked();
      }
    }

    _hideAdapt (element) {
      element.classList.remove(this.activeClass);
      [...element.querySelectorAll('input')].forEach(input => input.disabled = true);
    }

    _showAdapt (element) {
      element.classList.add(this.activeClass);
      [...element.querySelectorAll('input')].forEach(input => input.disabled = false);
    }

    _setText (data) {
      this.chartArea.textContent = data.area;
      this.chartInterval.start.textContent = data.interval.start;
      this.chartInterval.end.textContent = data.interval.end;
      this.chartName.textContent = data.name;
      // const colors = ['#508AFF', '#F3A83E', '#31D99C', '#E54D60', '#8567FF', '#EC79FF'];
      const props = data.props.reduce((accum, item, index) => {
        accum +=
          `<li class="stats__an-param-item">
            <span class="stats__an-param-dot"></span>
            <p class="stats__an-param-text">${item.prop}</p>
          </li>`;
        return accum;
      }, '');
      this.chartProps.innerHTML = props;
    }

    _update (data) {
      const activeViewToggle = this.chartViewInputs.find(input => input.checked);
      const view = activeViewToggle.dataset.view;
      if (view === 'map') {
        if (this.mapWrap.classList.contains(this.initClass)) {
          this._initMap(data.props);
          return;
        }
        this.chartWrap.classList.remove(this.activeClass);
        this.mapWrap.classList.add(this.activeClass);
        requestAnimationFrame(() => {
          this.maps.forEach(map => {
            map.update(data.props);
          });
        });
      } else {
        if (this.chartWrap.classList.contains(this.initClass)) {
          this._initChart(data, view);
          return;
        }
        this.mapWrap.classList.remove(this.activeClass);
        this.chartWrap.classList.add(this.activeClass);
        requestAnimationFrame(() => {
          this._setText(data);
          this.charts.forEach(chart => {
            chart.updateView(data, view);
          });
        });
      }
    }

    _initChart (data, view) {
      this.chartWrap.classList.remove(this.initClass);
      this.mapWrap.classList.remove(this.activeClass);
      this.chartWrap.classList.add(this.activeClass);
      requestAnimationFrame(() => {
        this._setText(data);
        this.chartElements.forEach(element => {
          const chart = new MyChart(element, data);
          this.charts.push(chart);
          chart.updateView(data, view);
          chart.printButton.addEventListener('click', (evt) => {
            evt.preventDefault();
            this._printChart(chart);
          });
        });
      });
    }

    _initMap (data) {
      this.mapWrap.classList.remove(this.initClass);
      this.chartWrap.classList.remove(this.activeClass);
      this.mapWrap.classList.add(this.activeClass);
      requestAnimationFrame(() => {
        this.mapParents.forEach(mapParent => {
          const map = new Map(mapParent, data);
          this.maps.push(map);
          map.printButton.addEventListener('click', (evt) => {
            evt.preventDefault();
            this._printMap(map);
          });
        });
      });
    }

    _printChart (chart) {
      const myWindow = window.open('', 'Печать графика', 'height=400,width=600');
      myWindow.document.open();
      const styles = `
        .stats__an-top-wrap {
          display: grid;
          grid-auto-flow: column;
          justify-content: start;
          align-items: start;
          grid-gap: 2.4rem;
          margin-bottom: 1.6rem;
          font-size: 1.4rem;
          line-height: 1.14;
          color: #b8bcc6;
        }

        .stats__an-top-wrap p {
          margin: 0;
        }

        .stats__an-city {
          margin: 0;
        }

        .stats__an-title {
          margin-top: 0;
          font-family: "Roboto", "Arial", sans-serif;
          margin-bottom: 1rem;
        }

        .stats__an-param-list {
          margin: 0;
          margin-bottom: 1rem;
          padding: 0;
          list-style: none;

        }

        .stats__an-param-list li {
          margin: 0;
          padding: 0;
        }

        .stats__an-param-list li:not(:last-of-type),
        .stats__an-param-list li:not(:last-of-type) {
          margin-bottom: 0.6rem;
        }

        .stats__an-param-list li::before {
          display: none;
        }

        .stats__an-param-item {
          display: grid;
          grid-template-columns: auto 1fr;
          grid-gap: 1.1rem;
          align-items: center;
          justify-content: start;
          font-family: "Roboto", "Arial", sans-serif;
        }
        .stats__an-param-item:last-child {
          margin-bottom: 0;
        }

        .stats__an-param-item:nth-child(1) .stats__an-param-dot {
          background-color: #508AFF;
        }
        .stats__an-param-item:nth-child(2) .stats__an-param-dot {
          background-color: #F3A83E;
        }
        .stats__an-param-item:nth-child(3) .stats__an-param-dot {
          background-color: #31D99C;
        }
        .stats__an-param-item:nth-child(4) .stats__an-param-dot {
          background-color: #E54D60;
        }
        .stats__an-param-item:nth-child(5) .stats__an-param-dot {
          background-color: #8567FF;
        }
        .stats__an-param-item:nth-child(6) .stats__an-param-dot {
          background-color: #EC79FF;
        }

        .stats__an-param-dot {
          display: block;
          width: 0.7rem;
          height: 0.7rem;
          border-radius: 50%;
          background-color: #c0c3c9;
        }

        .stats__an-param-text {
          margin: 0;
          font-size: 1rem;
          line-height: 1.14;
          font-weight: 500;
        }

        .stats__print-title {
          margin: 0;
          font-family: "Roboto", "Arial", sans-serif;
          font-size: 1.2rem;
          line-height: 1.2;
          font-weight: 700;
        }
      `;
      let windowContent = '<!DOCTYPE html><html><head><title>' + document.title  + '</title>';
      windowContent += `<style>${styles}</style></head><body>`;
      windowContent += this.chartPrintText.innerHTML;
      windowContent += `<h1 class="stats__print-title">${chart.title.textContent}<h1>`;
      const image = `<img src="${chart.dataURL}" width="600" height="250">`;
      windowContent += image;
      windowContent += '</body></html>';
      myWindow.document.write(windowContent);
      myWindow.focus();
      setTimeout(() => {
        myWindow.print();
        myWindow.document.close();
        myWindow.close();
      }, 0)
      return true;
    }

    _printMap (map) {
      const PRINT_MAP_CLASS = 'print-map';
      document.body.classList.add(PRINT_MAP_CLASS);
      map.parent.classList.add(PRINT_MAP_CLASS);
      window.print();
      document.body.classList.remove(PRINT_MAP_CLASS);
      map.parent.classList.remove(PRINT_MAP_CLASS);
    }
  }

  const analyticsPageElement = document.querySelector(`.${ANALYTICS_PAGE_CLASS}`);
  const analyticsPage = new AnalyticsPage(analyticsPageElement);

  $(document).on('click', '.js-kos-stats-map', function (e) {
    e.preventDefault();

    let formData = new FormData($('.js-stats-analytics .js-stats-form')[0]);
    formData.delete('action');
    formData.delete('AREA[]');
    formData.append('action', 'getKosAnalytics');
    formData.append('AREA', $(this).data('area-id'));
    //formData.append('id', skill);

    const sumArray = (array) => array.reduce((accum, item) => {
      accum += item;
      return accum;
    }, null);

    let areaName = $(this).data('area-name');


    ajaxTemplate(formData).then(data => {

      const tableRows = data.props.reduce((accum, item) => {
        accum +=
          `<tr class="stats__skill-tr">
            <td class="stats__skill-td">${item.prop}</td>
            <td class="stats__skill-td">${sumArray(item.request)}</td>
            <td class="stats__skill-td">${sumArray(item.success)}</td>
            <td class="stats__skill-td">${sumArray(item.fail)}</td>
          </tr>`
        return accum;
      }, '');
      $('[data-popup=map-stats-table] .js-stats-popup-name').text(areaName);
      $('[data-popup=map-stats-table] .js-stats-popup-table').html(tableRows);


      let popup = new Popup(document.querySelector(`[data-popup=map-stats-table]`));
      popup.open();
    }).catch(error => {
      console.log(error);
    });
  })

}

$('.js-modal-link[data-target=export-statistics]').on('click', function(e){
  if ($(this).attr('href')) {
    e.preventDefault();
  }
  var target = $('[data-modal='+ $(this).data('target') +']');
  modal(target);
});

$(document).on('click', '.js-export-statistics', function () {
  BX.showWait();

  let query = {
    c: 'ibrush:statistics.mcok',
    action: 'export',
    mode: 'class'
  };

  let data = {
    type: $(this).data('type'),
    dateFrom: $('input[name=DATE_FROM]').val(),
    dateTo: $('input[name=DATE_TO]').val(),
    place: $('select[name=AREA]').val(),
    pk: $('select[name="SKILL[]"]').val(),
    SITE_ID: 's1',
    sessid: BX.message('bitrix_sessid')
  };

  let request = $.ajax({
    url: '/bitrix/services/main/ajax.php?' + $.param(query, true),
    method: 'GET',
    data: data
  });

  return new Promise((resolve, reject) => {
    request.done(function (response) {
      BX.closeWait();
      if (response.status != 'success' || !response.data.file) {
        reject('Произошла ошибка, попробуйте позже');
      } else {
        window.location.href = response.data.file;
      }
    });
  });
});


