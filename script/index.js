'use strict'
// Config
const DEFAULT_QUERY = 'town';

let form = document.querySelector('.search-form');
const contentSection = document.querySelector('.content');
const modal = document.querySelector('.modal');
const modalImage = document.querySelector('.modal-img');
const columns = document.querySelectorAll('.column');
const modalLoader = document.querySelector('.modal-loader');
const mainContentLoader = document.querySelector('.mainContent-loader');
let currentPage = 1;
let previousQuery = DEFAULT_QUERY;
let isMainDataFetched = false;
let isModalImageLoaded = false;
let isModalOpen = false;

// Components

class LoadMoreButton {
  constructor() {
    const buttonElement = document.createElement('button');
    buttonElement.type = 'button';
    buttonElement.className = 'loadMore-button';
    buttonElement.innerHTML = 'Load More';

    buttonElement.onclick = () => {
      const { query: currentQuery } = getCurrentFormValues();

      window.scrollTo(0, 0);
      currentPage++;
      // If form search query value was changed, load by old query
      if (previousQuery !== currentQuery) {
        getImages(previousQuery);
        return;
      }
      // Get images by current form search query, if it's not changed
      getImages(currentQuery);
    }

    return buttonElement;
  }
}

class Img {
  constructor({ webformatURL, largeImageURL }) {
    let div = document.createElement('div');
    div.className = 'img-wrapper';
    div.innerHTML = `
      <img 
        src='' 
        alt='found img'
        data-src=${webformatURL} 
        data-large=${largeImageURL}
        class='grid-img'
      >`;

    return div;
  }
}

class ErrorMessage {
  constructor(message) {
    const messageElement = document.createElement('h2');
    messageElement.className = "error-message";
    messageElement.textContent = message;

    return messageElement;
  }
}

// Loaders

const toggleModalLoader = () => {
  modalImage.hidden = !isModalImageLoaded;
  modalLoader.hidden = isModalImageLoaded;
}

const toggleMainDataLoader = () => {
  isMainDataFetched = !isMainDataFetched;
  mainContentLoader.style.display = (isMainDataFetched) ? 'none' : 'flex';  // Toggle loader's display  
}

//Modal

const showModal = (src) => {
  modalImage.src = src;  // Assignment of the image's source value based on passed value

  modalImage.onload = () => {  // When image loaded, change interface
    if (!isModalOpen) return;  // If image loaded when modal window closed, do nothing 
    isModalImageLoaded = true;
    toggleModalLoader();  // Replace loader 
  }

  modal.style.display = 'flex';  // Change visibility of the modal window 
  isModalOpen = true;
  document.body.addEventListener('click', hideModal);  // Close modal delegated handler
}

const hideModal = e => {
  const targetClasses = e.target.classList;
  // When click was on the image, do nothing 
  if (!(targetClasses.contains('modal') || targetClasses.contains('modal-close'))) return;

  isModalImageLoaded = false;
  isModalOpen = false;

  modal.classList.add('fadeOut');  // Add animation

  setTimeout(() => {  // Wait till animation ended
    modal.classList.remove('fadeOut');  // Remove animation
    modal.style.display = 'none';  // Change visibility of the modal window 
    toggleModalLoader();  // Return loader
  }, 250);
  
  document.body.removeEventListener('click', hideModal);  // Remove click listener from body 
}

// Request and Response

const getUrl = ({ query, imagesPerPage }) =>
  `https://pixabay.com/api/?key=13863081-cfc3b9a87c9f70c0bb449a8f3&q=${query}&image_type=photo&per_page=${imagesPerPage}&page=${currentPage}`

function getImages(query) {
  const { imagesPerPage } = getCurrentFormValues();  // Current images per page amount
  let url = getUrl({ query, imagesPerPage });  // Get Url string by query and images per page 
  previousQuery = query;  // Set current query as previous

  columns.forEach(item => item.innerHTML = '');  // Columns cleaning
  // Interface changing
  toggleMainDataLoader();
  hideErrorMessage();
  hideLearnMoreButton();
  // Request images from server
  makeRequest(url);
}

async function makeRequest(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.hits.length) {  // Show error when response with no images
      showErrorMessage("Can't find any of images");
      return;
    }

    handleResponse(data);
  } catch (error) {
    // Error handling
    showErrorMessage("404 Error");
    console.error(`Can't load data from server`);
  }
}

const handleResponse = data => {
  let imgsList = [];
  const { imagesPerPage } = getCurrentFormValues();
  // Show load more button when there are more images
  if (data.totalHits > +imagesPerPage * currentPage) {
    showLoadMoreButton();
  }
  // New images creation based on the response from server
  data.hits.forEach(img => {
    const newImg = new Img(img);
    imgsList = [...imgsList, newImg];
  });

  setImgs(imgsList);  // Set created images 
  observe();  // Apply lazy load 
  toggleMainDataLoader();
}

// Form handling

form.addEventListener('submit', e => {
  e.preventDefault();
  const { query } = getCurrentFormValues();  // Get current search query

  currentPage = 1;  // Reset current page value
  getImages(query);
});

function getCurrentFormValues() {
  return {
    query: form.elements.query.value || DEFAULT_QUERY,
    imagesPerPage: form.elements.perPage.value || 20
  }
}

//ImageElement

function setImgs(imgs) {
  const columnsAmount = columns.length;
  const elemsPerColumn = Math.floor(imgs.length / columnsAmount); // Amount of elements in each column
  let imgsList = [...imgs];  // Copy of imgs array for preventing mutation

  // Inserting images to columns
  for (let i = 0; i < columnsAmount; i++) {
    let insertableImages = imgsList.splice(0, elemsPerColumn);  // Images in current column
    columns[i].append(...insertableImages);
  }
  // Inserting rest of the images
  if (imgsList.length) {
    imgsList.forEach((item, i) => columns[i].append(item));
  }
}

const handleClick = e => {  // Image click handler 
  const target = e.target;
  if (!target.classList.contains('grid-img')) return;  // Delegation

  showModal(target.dataset.large);
}

document.body.addEventListener('click', handleClick);  // Set image click handler 

// Error Message

const showErrorMessage = (message) => {
  const currentErrorMessage = document.querySelector('.error-message');
  toggleMainDataLoader();  // Remove main data loader 

  // When error message doesn't exist, create it
  if (!currentErrorMessage) {
    const messageElement = new ErrorMessage(message);
    contentSection.append(messageElement);
    return;
  }
  // When error message exist, modify it
  currentErrorMessage.textContent = message;
  currentErrorMessage.hidden = false;
}

const hideErrorMessage = () => {
  const currentErrorMessage = document.querySelector('.error-message');
  if (currentErrorMessage) {  // Hide error message if it's exist
    currentErrorMessage.hidden = true;
  }
}

// Load more button 

const showLoadMoreButton = () => {
  const currentElement = document.querySelector('.loadMore-button');

  // When load more btn doesn't exist, create it
  if (!currentElement) {
    contentSection.append(new LoadMoreButton());
    return;
  }
  // When load more btn exist, modify it
  currentElement.hidden = false;
}

const hideLearnMoreButton = () => {
  const currentElement = document.querySelector('.loadMore-button');

  if (!currentElement) return;

  currentElement.hidden = true;  // Hide error message if it's exist
}

// Lazy Load

function observe() {
  const targets = document.querySelectorAll('.grid-img');  // Elements to apply lazy load 

  function lazyLoad(target) {
    const intObs = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.intersectionRatio > 0) {  // When target in loading area 
          const image = entry.target;
          // Insert source value from attribute
          image.src = image.getAttribute('data-src');
          // When image is loaded, apply styles
          image.onload = () => {
            image.classList.add('loaded');
            image.parentElement.style.backgroundImage = 'none';
            image.parentElement.style.minHeight = 'auto';
          }

          observer.disconnect();  // Disable lazy load 
        }
      })
    }, { rootMargin: '50px' });  // Load area margin

    intObs.observe(target);
  }

  targets.forEach(lazyLoad); // Apply lazy load to target elements
}

makeRequest(getUrl(getCurrentFormValues()));