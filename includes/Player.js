const presets = require("./presets");
const e = presets.enums;

class Player {
  hand = [];
  pID = null;
  role;
  sequence;
  name;
  points;
  readyToStart;
  disconnect;
  uno;
  watching;

  constructor(pID = null) {
    this.pID = pID;
    this.reset(false);
  }

  reset(softReset = true) {
    this.hand = [];
    this.uno = false;
    this.readyToStart = false;

    if (!softReset) {
      this.points = 0;
      this.watching = 0;
      this.role = e.role.UNDECIDED;
      this.sequence = null;
      this.name = "anonymous player";
      this.disconnect = false;
    }
  }

  sortHand() {
    //sort by color, then worth, then value
    this.hand.sort((a, b) => {
      if (a.color > b.color) return -1;
      else if (a.color === b.color) {
        if (a.worth > b.worth) return -1;
        else if (a.worth === b.worth) {
          if (a.value > b.value) return -1;
          else return 1;
        } else return 1;
      } else return 1;
    });

    //move colorless to end
    this.hand.sort((a, b) => {
      if (a.color == e.color.COLORLESS) return -1;
      else return 1;
    });
  }

  takeCards(cards) {
    if (!Array.isArray(cards)) cards = [cards];
    this.hand = this.hand.concat(cards);
    this.sortHand();
  }

  giveCards() {
    let cards = this.hand;
    this.hand = [];
    return cards;
  }

  giveCard(cID, copy = false) {
    if (this.hasCard(cID)) {
      if (copy) return this.hand[this.getCardIndex(cID)];
      else return this.hand.splice(this.getCardIndex(cID), 1)[0];
    }

    return false;
  }

  hasCard(cID) {
    return this.hand.some(card => card.cID == cID);
  }

  getCardIndex(cID) {
    return this.hand.findIndex(card => card.cID == cID);
  }

  getHandTotal() {
    return this.hand.length;
  }

  isPlayer(pID) {
    return this.role == e.role.PLAYER;
  }

  isSpectator(pID) {
    return this.role == e.role.SPECTATOR;
  }
}

module.exports = Player;
