import Choices from 'choices.js';

const PARENT_CLASS = 'js-choice';
const SELECT_CLASS = 'js-choice-select';
const SELECTED_CLASS = 'js-choice-selected';
const SELECTED_ITEM_CLASS = 'js-choice-item';
const SELECTED_REMOVE_CLASS = 'js-choice-remove';

// const selectParents = [...document.querySelectorAll(`.${PARENT_CLASS}`)];

// const selects = selectParents.map(parent => parent.querySelector(`.${SELECT_CLASS}`));
// const choices = {};

// scroll selected text on hover
const canScrollText = select => {
  select.closest(`.${PARENT_CLASS}`).querySelector('.choices__selected-list').addEventListener('mouseover', evt => {
    const text = evt.currentTarget.querySelector('.choices__selected');
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
    evt.currentTarget.addEventListener('mouseout', () => {
      index = 0;
      text.scroll({
        left: 0,
        behavior: 'smooth',
      });
    }, {once: true});
  });
};

// render selected list item
const renderSelected = (name, value) => {
  const item = document.createElement('li');
  item.classList.add('choice__selected-item', SELECTED_ITEM_CLASS);
  item.dataset.value = value;
  item.innerHTML = `
    <p class="choice__selected-text">${name}</p>
    <button class="choice__selected-button ${SELECTED_REMOVE_CLASS}" type="button">
        <span class="visually-hidden">Удалить</span>
    </button>
  `;
  return item;
};

// sync select & selected list
const syncSelect = choice => {
  const select = choice.passedElement.element;
  const selected = select.closest(`.${PARENT_CLASS}`).querySelector(`.${SELECTED_CLASS}`);
  select.addEventListener('addItem', evt => {
    selected.prepend(renderSelected(evt.detail.label, evt.detail.value));
  });
  select.addEventListener('removeItem', evt => {
    const item = selected.querySelector(`.${SELECTED_ITEM_CLASS}[data-value="${evt.detail.value}"]`);
    if (!item) return;
    item.remove();
  });
  selected.addEventListener('click', evt => {
    if (!evt.target.matches(`.${SELECTED_REMOVE_CLASS}`)) return;
    evt.preventDefault();
    const item = evt.target.closest(`.${SELECTED_ITEM_CLASS}`);
    const value = `${item.dataset.value}`;
    item.remove();
    choice.removeActiveItemsByValue(value);
  });
};

const getChoicesConfig = parentElement => {
  const type = parentElement.dataset.choiceType;
  const maxItemCount = parentElement.dataset.choiceMax ? parentElement.dataset.choiceMax : -1;

  const choicesConfig = {
    single: {
      classNames: {
        listDropdown: 'choices__dropdown',
        listSingle: 'choices__list--single choices__selected-list choice__input',
        inputCloned: 'choices__search',
        itemSelectable: 'choices__selected',
        activeState: 'active',
        openState: 'open',
      },
      searchPlaceholderValue: 'Search',
      noResultsText: 'No results found',
      searchResultLimit: 10,
      callbackOnInit: function () {
        this.passedElement.element.addEventListener('change', () => {
          this.itemList.element.style.color = '#050a35';
        });

        // autoscroll on hover
        canScrollText(this.passedElement.element);
      },
    },
    multiple: {
      maxItemCount: maxItemCount,
      maxItemText: maxCount => `Only ${maxCount} values can be added`,
      removeItems: true,
      removeItemButton: true,
      searchResultLimit: 100,
      noResultsText: 'No results found',
      noChoicesText: 'No choices to choose from',
      classNames: {
        listDropdown: 'choices__dropdown',
        listSingle: 'choices__list--single choices__selected-list choice__select',
        inputCloned: 'choices__search',
        itemSelectable: 'choices__selected',
        activeState: 'active',
        openState: 'open',
      },
      callbackOnInit: function () {
        const choice = this;
        // select DOM tweaks
        this.dropdown.element.prepend(this.containerInner.element);
        this.input.element.placeholder = 'Search ';
        const choosedTitle = document.createElement('div');
        choosedTitle.classList.add('choice__select-title-wrap');
        let text;
        if (this.config.maxItemCount > 0)
          text = `
            <p class="choice__select-title">Selected</p>
            <p class="choice__select-info">Maximum - ${this.config.maxItemCount} values</p>
          `;
        else
          text = `
            <p class="choice__select-title">Selected</p>
            <p class="choice__select-info"></p>
          `;
        choosedTitle.innerHTML = text;
        this.containerInner.element.prepend(choosedTitle);
        const choicesTitle = document.createElement('div');
        choicesTitle.classList.add('choice__select-title-wrap');
        choicesTitle.innerHTML = '<p class="choice__select-title">Choices list</p>';
        this.dropdown.element.insertBefore(choicesTitle, this.choiceList.element);

        syncSelect(choice);
        // render initial selected list
        const selectedItems = this.getValue();
        if (!selectedItems.length) return;
        selectedItems.forEach(item => {
          const itemElement = renderSelected(item.label, item.value);
          const selected = this.passedElement.element.closest(`.${PARENT_CLASS}`).querySelector(`.${SELECTED_CLASS}`);
          selected.prepend(itemElement);
        });
      },
    },
  };
  return choicesConfig[type];
};

const customSelect = selectParent =>  {
  const selectElement = selectParent.querySelector(`.${SELECT_CLASS}`);
  return new Choices(selectElement, getChoicesConfig(selectParent));
};

export default customSelect;
