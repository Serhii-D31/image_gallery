export default class ApiService {
  constructor() {
    this.URL = "https://api.unsplash.com/";
    this.API_KEY = "IOmMPsNCdSs34nBqLfNar1wu83RWoXZdT6fzsGeGMas";
    this.query = "cars";
    this.queryPage = 1;
    this.options = {
      contentType: "application/json",
    };
  }

  fetchImagesByKeyWords(keyWords) {
    this.setSearchQuery(keyWords);
    return fetch(
      `${this.URL}search/photos/?&query=${this.query}&per_page=29&client_id=${this.API_KEY}&page=${this.queryPage}`,
      this.options
    )
      .then((r) => this.checkResponse(r))
      .then((results) => results)
      .catch((reason) => console.log(reason));
  }
  fetchImgById(imgId) {
    return fetch(
      `${this.URL}/photos/${imgId}?&client_id=${this.API_KEY}`,
      this.options
    )
      .then((r) => this.checkResponse(r))
      .then((result) => result);
  }
  setSearchQuery(keyString) {
    keyString
      ? (this.query = keyString.toLowerCase().replaceAll(" ", "+"))
      : true;
  }

  checkResponse(r) {
    if (r.status === 200) {
      return r.json();
    } else if (r.status === 404) {
      alert("the resource could not be found");
    } else if (r.status === 401) {
      alert(`Access to your account has been suspended, contact administrator`);
    }
  }
}
