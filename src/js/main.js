/* eslint-disable no-console */
import customSelect from './customSelect';

const theGood = ['ab', 'bc', 'cd'];
const theBad = [...theGood, 'deeeeee'];
console.log(theBad);
console.log('TheUgly');

const selectParents = [...document.querySelectorAll('.js-choice')];
const selects = {};
selectParents.forEach(parent => {
  const id = parent.dataset.id;
  selects[id] = customSelect(parent);
  console.dir(selects[id]);
});

