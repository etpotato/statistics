/* eslint-disable no-console */
import customSelect from './customSelect';

const selectParents = [...document.querySelectorAll('.js-choice')];
const selects = {};
selectParents.forEach(parent => {
  const id = parent.dataset.id;
  selects[id] = customSelect(parent);
});
