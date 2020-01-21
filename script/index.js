'use strict'

let form = document.querySelector('.search-form');
let counter = 0;
const maximumElementsPerPage = 200;
// let elemsPerColumn = 0;
const contentSection = document.querySelector('.content');
const modal = document.querySelector('.modal');
const modalImage = document.querySelector('.modal-img');
const columns = document.querySelectorAll('.column');
const loader = document.querySelector('.loader');
const mainContentLoader = document.querySelector('.mainContent-loader');
let isMainDataFetched = false;
let isImageLoaded = false;
let isModalOpen = false;
// let loaderTimer;

//Modal
const replaceLoader = () => {
  if (isImageLoaded) {
    modalImage.hidden = false;
    loader.hidden = true;
    return;
  }

  modalImage.hidden = true;
  loader.hidden = false;
  /* modalImage.hidden = !modalImage.hidden;
  loader.hidden = !loader.hidden; */
}

const toggleMainDataLoader = () => {
  isMainDataFetched = !isMainDataFetched;
  mainContentLoader.style.display = (isMainDataFetched) ? 'none' : 'flex';
}

const showModal = (src) => {
  modalImage.classList.add('appearence');
  modalImage.src = src;
  console.log(isImageLoaded);

  modalImage.onload = () => {
    if (!isModalOpen) return;
    isImageLoaded = true;
    replaceLoader();
    console.log(isImageLoaded);
  }
  modal.style.display = 'flex';

  document.body.addEventListener('click', hideModal);
  isModalOpen = true;
}

const hideModal = e => {
  if (!e.target.classList.contains('modal')) return;

  isImageLoaded = false;
  isModalOpen = false;
  modal.style.display = 'none';
  replaceLoader();

  document.body.removeEventListener('click', hideModal);
  console.log(isImageLoaded);
}

const handleClick = e => {
  let target = e.target;
  if (!target.classList.contains('grid-img')) return;

  showModal(target.dataset.large);
}

document.body.addEventListener('click', handleClick);


//Query
const getUrl = () => {
  const query = form.elements.query.value || 'town';
  const imagesPerPage = form.elements.perPage.value || 50;
  // const imagesPerPage = document.querySelector('.perPage').value || 50;
  // const imagesPerPage = elementsPerPage.value || 50;

  return `https://pixabay.com/api/?key=13863081-cfc3b9a87c9f70c0bb449a8f3&q=${query}&image_type=photo&per_page=${imagesPerPage}`
  // return `https://pixabay.com/api/?key=13863081-cfc3b9a87c9f70c0bb449a8f3&q=${query}&image_type=photo&per_page=${imagesPerPage}&min_width=1920&min_height=1080`
}

// Error Message
const createErrorMessage = (message) => {
  const messageElement = document.createElement('h2');
  messageElement.className = "error-message";
  messageElement.textContent = message;

  return messageElement;
}

const showErrorMessage = (message) => {
  const currentErrorMessage = document.querySelector('.error-message');
  toggleMainDataLoader();

  if (!currentErrorMessage) {
    const messageElement = createErrorMessage(message);
    contentSection.append(messageElement);
    return;
  }

  currentErrorMessage.textContent = message;
  currentErrorMessage.hidden = false;
}

const hideErrorMessage = () => {
  const currentErrorMessage = document.querySelector('.error-message');
  if (currentErrorMessage) {
    currentErrorMessage.hidden = true;
  }
}

// Form's submit handling
form.addEventListener('submit', e => {
  e.preventDefault();
  // if(!elementsPerPageValidation()) return;
  
  let url = getUrl();

  columns.forEach(item => item.innerHTML = ''); // Columns cleaning

  toggleMainDataLoader();
  hideErrorMessage();
  makeRequest(url);
});

/* const elementsPerPageValidation = () => {
  const perPageElement = form.elements.perPage;
  const currentValue = perPageElement.value;

  if(currentValue > 200) {
    showErrorMessage('Maximum 200 elements');

    return false;
  }

  return true;
} */

//Request
async function makeRequest(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.hits.length) {  //Response with no images
      showErrorMessage("Can't find any of images");
      return;
    }

    handleResponse(data.hits);
  } catch (error) {
    showErrorMessage("404 Error");
    console.error(`Can't load data from server`);
  }
}

const handleResponse = data => {
  let imgsList = [];

  data.forEach(img => {
    const newImg = createImg(img);
    imgsList = [...imgsList, newImg];
  });

  timeDec(setImgs)(imgsList);
  console.log(data);
  observe();
  toggleMainDataLoader();
}

//ImageElement

function createImg({ webformatURL, largeImageURL }) {
  let div = document.createElement('div');
  div.className = 'img-wrapper';
  div.innerHTML = `
    <img 
      src='' 
      data-src=${webformatURL} 
      data-large=${largeImageURL}
      class='grid-img'
    >`;

  return div;
}

function setImgs(imgs) {
  const columnsAmount = columns.length;
  const elemsPerColumn = Math.floor(imgs.length / 4);
  let imgsList = [...imgs];

  for (let i = 0; i < columnsAmount; i++) {
    let insertImgs = imgsList.splice(0, elemsPerColumn);
    columns[i].append(...insertImgs);
  }

  if (imgsList.length) {
    imgsList.forEach((item, i) => columns[i].append(item));
  }
}

// Lazy Load
function observe() {
  const targets = document.querySelectorAll('.grid-img');

  function lazyLoad(target) {
    const intObs = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        // console.log(entry.intersectionRatio);

        // if(entry.isIntersecting) {
        if (entry.intersectionRatio > 0) {
          const image = entry.target;
          image.src = image.getAttribute('data-src');
          image.onload = () => {
            image.classList.add('loaded');
            image.parentElement.style.backgroundImage = 'none';
            image.parentElement.style.minHeight = 'auto';
          }

          observer.disconnect();
        }
      })
    }, { rootMargin: '50px' });

    intObs.observe(target);
  }
  targets.forEach(lazyLoad);
}

makeRequest(getUrl());

function timeDec(func) {
  return function () {
    let start = Date.now();

    let result = func.apply(this, arguments);

    console.log(`Function execute time: ${Date.now() - start} ms`);
    return result;
  }
}