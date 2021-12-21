// import
import "./sass/main.scss";
import ApiService from "./api-service.js";
import checkScrollHeight from "./calc-scroll-height.js";

// hbs templates
import gridItem from "./templates/grid-item.hbs";
import gridItemWithLocation from "./templates/grid-item_location.hbs";
import modal from "./templates/modal.hbs";

const debounce = require("lodash.debounce");

const apiService = new ApiService();
const cont = document.querySelector(".grid");
const paginationCont = document.querySelector(".pagination-cont");
const paginationArrow = document.querySelector(".pagination-arrow");
const queryInputs = document.querySelectorAll('[type="search"]');
const queryAlerts = document.querySelectorAll(".query-alert");
const modalWindow = document.querySelector(".modal-window");
const yourCollBtn = document.querySelectorAll(".your-coll-btn");
const topList = document.querySelectorAll(".top-list");
const footerList = document.querySelectorAll(".footer-list");
let totalPages = "";

// On load
function onLoad() {
  // Render default images
  apiService
    .fetchImagesByKeyWords(apiService.query)
    .then(({ results, total_pages }) => {
      renderData(results);
      totalPages = total_pages;
    });
}

// Render image
function renderData(data) {
  let output = `<div class="grid-sizer"></div>`;
  data.forEach(function (e) {
    if (e.user.location != null) {
      output += gridItemWithLocation(e);
    } else {
      output += gridItem(e);
    }
  });
  cont.innerHTML += output;

  // Use masonry
  imagesLoaded(cont).on("progress", function () {
    // layout Masonry after each image loads
    var masonry = new Masonry(cont, {
      columnWidth: ".grid-sizer",
      itemSelector: ".grid-item",
      gutter: 20,
      fitWidth: true,
    });
    masonry.layout();
  });

  window.innerWidth >= 768
    ? document.querySelectorAll(".grid-item").forEach((e) => {
        e.addEventListener("click", onItemClick);
      })
    : true;

  checkClicked(data);
  clickedToggle();
}

// Search
function onQueryInput(e) {
  // Hide alerts
  queryAlerts.forEach((e) => {
    e.hidden = true;
  });
  // Select search alert
  let searchAlert = e.target.dataset.action;

  // Ajax request by keywords
  if (e.target.value.length > 0) {
    apiService.queryPage = 1;
    apiService
      .fetchImagesByKeyWords(e.target.value)
      .then(({ results, total_pages }) => {
        if (results.length > 0) {
          return [results, total_pages];
        } else {
          queryAlerts.forEach((e) => {
            if (e.classList.contains(`${searchAlert}`)) {
              e.hidden = false;
            }
          });
        }
      })
      .then(([results, total_pages]) => {
        results.length > 0 ? scrollToTop() : true;
        clearDisplay();
        renderData(results);
        paginationCont.style.visibility = "visible";
        totalPages = total_pages;
      });
  }
}

// Scroll button
window.addEventListener("scroll", function () {
  document.querySelector(".moveToTop").hidden =
    scrollY < document.documentElement.clientHeight;
});
document.querySelector(".moveToTop").addEventListener("click", scrollToTop);

function scrollToTop() {
  let head = document.querySelector(".search-with-buttons");
  window.scrollTo({
    top: window.innerHeight - head.scrollHeight,
    left: 0,
    behavior: "smooth",
  });
}

// Open modal
function openModalWindow() {
  document.querySelector(".search-with-buttons").style.visibility = "hidden";
  document.querySelector(".moveToTop").hidden = true;
  document.querySelector(".backdrop").hidden = false;
  modalWindow.style.visibility = "visible";
  document.body.style.overflow = "hidden";
  document.querySelector(".backdrop").addEventListener("click", onOverlayClick);
  window.addEventListener("keydown", onKeysPress);
}

async function getImgInfo(imgId) {
  let el = await apiService.fetchImgById(imgId);
  modalWindow.innerHTML = modal(el);
  clickedToggle();
}

// Toggle clicked style when add/removed to your coll
function clickedToggle() {
  document.querySelectorAll(".addToCol").forEach((el) => {
    el.addEventListener("click", (e) => {
      el.classList.toggle("clicked");
      addToColl(e);
    });
  });
}

function checkClicked(data) {
  let clickedId = data.map((e) => {
    let id = yourColl.find((id) => id === e.id);
    return id;
  });
  let addToColArr = Array.from(document.querySelectorAll(".addToCol"));
  addToColArr.forEach((el) => {
    clickedId.forEach((id) => {
      id === el.dataset.id ? el.classList.add("clicked") : true;
    });
  });
}

function onItemClick(event) {
  openModalWindow();
  getImgInfo(event.target.dataset.id);
}

function onOverlayClick(evt) {
  if (evt.target === evt.currentTarget) {
    closeModalWindow();
  }
}

function onKeysPress(evt) {
  if (evt.code === "Escape") {
    closeModalWindow();
  }
}

// Close modal
function closeModalWindow() {
  document.querySelector(".search-with-buttons").style.visibility = "visible";
  document.querySelector(".moveToTop").hidden = false;
  document.querySelector(".backdrop").hidden = true;
  modalWindow.style.visibility = "hidden";
  document.body.style.overflow = "auto";
  document
    .querySelector(".backdrop")
    .removeEventListener("click", onOverlayClick);
  window.removeEventListener("keydown", onKeysPress);
  modalWindow.innerHTML = "";
}

// localStorage
let yourColl = localStorage.getItem("IMG_KEY")
  ? JSON.parse(localStorage.getItem("IMG_KEY"))
  : [];

// Your collection
function addToColl(e) {
  e.stopPropagation();
  const imgName = e.currentTarget.dataset.id;
  const index = yourColl.indexOf(imgName);

  if (index === -1) {
    yourColl.push(imgName);
  } else {
    yourColl.splice(index, 1);
  }

  localStorage.setItem("IMG_KEY", JSON.stringify(yourColl));
}

function clearDisplay() {
  cont.innerHTML = "";
}

// Render your collection
async function showYourColl() {
  clearInputValue();
  clearDisplay();
  scrollToTop();
  paginationCont.style.visibility = "hidden";
  cont.style.height = document.documentElement.clientHeight + "px";

  let yourCollArr = [];

  for (let i = 0; i < yourColl.length; i++) {
    await apiService
      .fetchImgById(yourColl[i])
      .then((result) => yourCollArr.push(result));
  }
  yourCollArr.length !== 0
    ? renderData(yourCollArr)
    : (cont.innerHTML = `
    <div class="empty-coll">
      <h3>
        Please, tup any hearts before image <br />
        to get to the your collection <br />
        <i class="fas fa-smile-wink fa-2x"></i>
      </h3>
    </div>`);
}

// Search by btn
function getCollByBtn(e) {
  clearInputValue();
  let collName = e.currentTarget.dataset.coll;
  apiService.queryPage = 1;

  apiService
    .fetchImagesByKeyWords(collName)
    .then(({ results, total_pages }) => {
      return [results, total_pages];
    })
    .then(([results, total_pages]) => {
      scrollToTop();
      clearDisplay();
      renderData(results);
      totalPages = total_pages;
      paginationCont.style.visibility = "visible";
    });
}

// Clear input value
function clearInputValue() {
  queryInputs.forEach((e) => {
    e.value = "";
  });
}

// Show more images
function getMoreImg() {
  if (apiService.queryPage < totalPages) {
    apiService.queryPage++;

    apiService.fetchImagesByKeyWords(apiService.query).then(({ results }) => {
      renderData(results);
    });
  } else if (apiService.queryPage === totalPages) {
    apiService.fetchImagesByKeyWords(apiService.query).then(({ results }) => {
      renderData(results);
    });
    paginationCont.style.visibility = "hidden";
    paginationArrow.removeEventListener("click", getMoreImg());
  } else {
    paginationCont.style.visibility = "hidden";
    paginationArrow.removeEventListener("click", getMoreImg());
  }
}

window.addEventListener("load", function () {
  preloader();
  onLoad();
  changePlacehold();
  checkLayout();
  checkScrollHeight();
});

// Preloader
function preloader() {
  document.body.classList.add("loaded-hiding");
  window.setTimeout(function () {
    document.querySelector(".preloader").classList.add("loaded");
    document.body.classList.remove("loaded-hiding");
  }, 1500);
}

// Listener search by input
queryInputs.forEach((e) => {
  e.addEventListener("input", debounce(onQueryInput, 1000));
});

// Listener get more images
paginationArrow.addEventListener("click", getMoreImg);

// Listener search by btn
topList.forEach((e) => {
  e.addEventListener("click", getCollByBtn);
});
footerList.forEach((el) => {
  el.addEventListener("click", getCollByBtn);
});

// Render yuor collection
yourCollBtn.forEach((e) => {
  e.addEventListener("click", showYourColl);
});

window.addEventListener("resize", function () {
  changePlacehold();
  checkLayout();
});

window.addEventListener("orientationchange", function () {
  changePlacehold();
  checkLayout();
});

// Check layout
function checkLayout() {
  document.documentElement.clientHeight <= 500
    ? ((document.querySelector(".footer").style.height = "100%"),
      (document.querySelector(".bottom-line").style.height = "100%"))
    : ((document.querySelector(".footer").style.height = "88vh"),
      (document.querySelector(".bottom-line").style.height = "7vh"));
}

// Change placeholder
function changePlacehold() {
  window.innerWidth < 576
    ? document
        .getElementById("search-on-top")
        .setAttribute("placeholder", "Search free photos")
    : document
        .getElementById("search-on-top")
        .setAttribute("placeholder", "Search free high-resolution photos");
}
