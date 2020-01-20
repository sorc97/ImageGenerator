'use strict'

let form = document.querySelector('.search-form');
let imgs = [];
let counter = 0;
// let elemsPerColumn = 0;
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
  if (modalImage.classList.contains("tall")) modalImage.classList.remove('tall');
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
  const imagesPerPage = document.querySelector('.perPage').value;

  return `https://pixabay.com/api/?key=13863081-cfc3b9a87c9f70c0bb449a8f3&q=${query}&image_type=photo&per_page=${imagesPerPage}`
  // return `https://pixabay.com/api/?key=13863081-cfc3b9a87c9f70c0bb449a8f3&q=${query}&image_type=photo&per_page=${imagesPerPage}&min_width=1920&min_height=1080`
}

// Form's submit handling
form.addEventListener('submit', e => {
  e.preventDefault();
  let url = getUrl();

  columns.forEach(item => item.innerHTML = ''); // Columns cleaning
  imgs = [];  // Images cleaning
  isMainDataFetched = false;

  toggleMainDataLoader();
  makeRequest(url);
})

//Request
function makeRequest(url) {
  fetch(url)
    .then(res => res.json())
    .then(data => {
      data.hits.forEach(img => createImg(img))
      timeDec(setImgs)(imgs);
      console.log(data);
      observe();
      isMainDataFetched = true;
      toggleMainDataLoader();
      return data;
    })
  // .then(item => console.log(item.hits))
}

//ImageElement
const createImg = ({ webformatURL, largeImageURL }) => {
  let div = document.createElement('div');
  div.className = 'img-wrapper';
  div.innerHTML = `
    <img 
      src='' 
      data-src=${webformatURL} 
      data-large=${largeImageURL}
      class='grid-img'
    >`;
    // src='./imgs/load2.svg' 
    // class='grid-img'

  imgs = [...imgs, div];
}

function setImgs(imgs) {
  const columnsAmount = columns.length;
  const elemsPerColumn = Math.floor(imgs.length / 4);
  let imgsClone = [...imgs];

  for (let i = 0; i < columnsAmount; i++) {
    let insertImgs = imgsClone.splice(0, elemsPerColumn);
    columns[i].append(...insertImgs);
  }

  if (imgsClone.length) {
    imgsClone.forEach((item, i) => columns[i].append(item));
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
          // image.classList.add('appearence');
          // image.classList.add('loaded');

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