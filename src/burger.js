const triggerMenu = document.getElementById("burger");
const menu = document.getElementById("menu");
const topItems = document.querySelectorAll("#menu li");

burger.addEventListener("click", doCross);
topItems.forEach((el) => {
  el.addEventListener("click", doCross);
});

window.addEventListener("scroll", () => {
  if (
    triggerMenu.classList.contains("active") &&
    menu.classList.contains("active")
  ) {
    doCross();
  }
});
window.removeEventListener("scroll", () => doCross());

function doCross() {
  triggerMenu.classList.toggle("active");
  menu.classList.toggle("active");
}
