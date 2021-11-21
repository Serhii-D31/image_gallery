// import
import "./sass/main.scss";
import ApiService from "./api-service.js";

// hbs templates
import gridItem from "./templates/grid-item.hbs";
import gridItemWithLocation from "./templates/grid-item_location.hbs";
import modal from "./templates/modal.hbs";

const debounce = require("lodash.debounce");

const apiService = new ApiService();
const cont = document.querySelector(".grid");
const paginationCont = document.querySelector(".pagination-buttons");
const queryInputs = document.querySelectorAll('[type="search"]');
const queryAlerts = document.querySelectorAll(".query-alert");
const modalWindow = document.querySelector(".modal-window");
const yourCollBtn = document.querySelector(".your-coll-btn");
const topList = document.querySelectorAll(".top-list");
const footerList = document.querySelectorAll(".footer-list");
var allButtons = "";

// On load
function onLoad() {
  // Render default images
  apiService.fetchImagesByKeyWords(apiService.query).then(({ results }) => {
    renderData(results);
    let currentBtn = allButtons.find(
      (el) => el.textContent == apiService.queryPage
    );
    addActiveClass(currentBtn);
  });

  // Pagination;
  let paginationLength = 15;
  createPagination(paginationLength);

  allButtons = Array.from(
    document.querySelectorAll(".pagination-buttons__item")
  );

  // All number button
  allButtons.slice(1, -1).forEach((el) => {
    el.onclick = function () {
      if (apiService.queryPage === Number(el.textContent)) {
        return true;
      } else {
        scrollToTop();
        clearActiveClass();
        el.classList.remove("btn-hover");
        el.classList.add("active");

        apiService.queryPage = Number(el.textContent);

        apiService
          .fetchImagesByKeyWords(apiService.query)
          .then(({ results }) => {
            renderData(results);
          });
      }
    };
  });

  // Prev, Next btn
  [allButtons[0], allButtons.at(-1)].forEach((el) => {
    el.onclick = function () {
      if (
        (apiService.queryPage > 1 && el.dataset.type === "prev-b") ||
        (apiService.queryPage < paginationLength &&
          el.dataset.type === "next-b")
      ) {
        if (el.dataset.type === "next-b") {
          Number((apiService.queryPage += 1));
          scrollToTop();
          // Changing current btn style
          clearActiveClass();
          let currentBtn = allButtons.find(
            (el) => el.textContent == apiService.queryPage
          );
          addActiveClass(currentBtn);
          /////////////////////////////////////
          apiService
            .fetchImagesByKeyWords(apiService.query)
            .then(({ results }) => {
              renderData(results);
            });
        } else {
          Number((apiService.queryPage -= 1));
          scrollToTop();
          // Changing current btn style
          clearActiveClass();
          let currentBtn = allButtons.find(
            (el) => el.textContent == apiService.queryPage
          );
          addActiveClass(currentBtn);
          /////////////////////////////////////
          apiService
            .fetchImagesByKeyWords(apiService.query)
            .then(({ results }) => {
              renderData(results);
            });
        }
      }
    };
  });
}

// Clear active class
function clearActiveClass() {
  allButtons.slice(1, -1).forEach((el) => {
    el.classList.contains("active") ? el.classList.remove("active") : true;
    el.classList.contains("btn-hover") ? true : el.classList.add("btn-hover");
  });
}
// Add active class
function addActiveClass(currentBtn) {
  currentBtn.classList.remove("btn-hover");
  currentBtn.classList.add("active");
}

// Pagination
function createPagination(paginationLength) {
  let buttonsStr =
    '<span class="pagination-buttons__item btn-hover" data-type="prev-b"><i class="fas fa-caret-left fa-lg"></i></span> <div class="interiorPaginCont">';
  for (let i = 0; i < paginationLength; i++) {
    buttonsStr += `<span class="pagination-buttons__item btn-hover">${
      i + 1
    }</span>`;
  }
  buttonsStr +=
    '</div> <span class="pagination-buttons__item btn-hover" data-type="next-b"><i class="fas fa-caret-right fa-lg"></i></span>';
  paginationCont.innerHTML = buttonsStr;
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
  cont.innerHTML = output;

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

  document.querySelectorAll(".grid-item").forEach((e) => {
    e.addEventListener("click", onItemClick);
  });

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
      .then(({ results }) => {
        if (results.length > 0) {
          return results;
        } else {
          queryAlerts.forEach((e) => {
            if (e.classList.contains(`${searchAlert}`)) {
              e.hidden = false;
            }
          });
        }
      })
      .then((results) => {
        results.length > 0 ? scrollToTop() : true;
        paginationCont.style.visibility = "visible";
        clearActiveClass();
        let currentBtn = allButtons.find(
          (el) => el.textContent == apiService.queryPage
        );
        addActiveClass(currentBtn);
        renderData(results);
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
    top: document.documentElement.clientHeight - head.offsetHeight,
    left: 0,
    behavior: "smooth",
  });
}

// Open modal
function openModalWindow() {
  document.querySelector(".search-with-buttons").style.visibility = "hidden";
  document.querySelector(".moveToTop").hidden = true;
  document.querySelector(".backdrop").hidden = false;
  modalWindow.style.left =
    "calc((" +
    (document.documentElement.clientWidth - modalWindow.offsetWidth) +
    "px) / 2)";
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
      addToColl(e);
      el.classList.toggle("clicked");
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
  const imgName = e.currentTarget.dataset.id;
  e.stopPropagation();
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
  clearDisplay();
  paginationCont.style.visibility = "hidden";
  scrollToTop();

  let yourCollArr = [];

  for (let i = 0; i < yourColl.length; i++) {
    await apiService
      .fetchImgById(yourColl[i])
      .then((result) => yourCollArr.push(result));
  }
  renderData(yourCollArr);
}

// Search by btn
function getCollByBtn(e) {
  let collName = e.currentTarget.dataset.coll;

  apiService.queryPage = 1;

  apiService
    .fetchImagesByKeyWords(collName)
    .then(({ results }) => {
      return results;
    })
    .then((results) => {
      scrollToTop();
      paginationCont.style.visibility = "visible";
      clearActiveClass();
      let currentBtn = allButtons.find(
        (el) => el.textContent == apiService.queryPage
      );
      addActiveClass(currentBtn);
      renderData(results);
    });
}

window.addEventListener("load", onLoad());

// Listener search by input
queryInputs.forEach((e) => {
  e.addEventListener("input", debounce(onQueryInput, 1000));
});

// Listener search by btn
topList.forEach((e) => {
  e.addEventListener("click", getCollByBtn);
});
footerList.forEach((el) => {
  el.addEventListener("click", getCollByBtn);
});

// Render yuor collection
yourCollBtn.addEventListener("click", showYourColl);
