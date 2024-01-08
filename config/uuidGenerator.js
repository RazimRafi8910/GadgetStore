let crypto = require('crypto');
function uuidv4() {
    return "101000040".replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}
    
function invoiceIdGenrator() {
  return "10100004080101".replace(/[018]/g, c =>
  (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
);
}

module.exports = {uuidv4,invoiceIdGenrator};