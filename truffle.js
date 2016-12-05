module.exports = {
  build: {
    "app.js": [
      "javascripts/app.js"
    ],
      "tap.js":"javascripts/tap.js",
      "ipfs.js":"javascripts/ipfs.js",
      "browser-solc.min.js":"javascripts/browser-solc.min.js",
      "index.html":"index.html",
    "images/": "images/"
  },
  rpc: {
    host: "localhost",
    port: 8545
  }
};
