const presets = require("./presets");
const e = presets.enums;

class Card {
  color;
  value;
  worth;
  cID;

  special = [];

  constructor(color, value, worth, cID, special = []) {
    this.color = color;
    this.value = value;
    this.worth = worth;
    this.cID = cID;
    this.special = special;
  }

  //return true if the card is special
  isSpecial() {
    return this.special.length > 0;
  }
}

module.exports = Card;