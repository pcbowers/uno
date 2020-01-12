const presets = require("./presets");
const e = presets.enums;

const Card = require("./Card");

class Deck {
  drawPile = [];
  discardPile = [];

  constructor(numPlayers) {
    this.reset(numPlayers);
  }

  reset(numPlayers) {
    this.drawPile = [];
    this.discardPile = [];

    this.create(numPlayers);
    this.shuffle();

    if (this.drawPile.length > 0) {
      let card;
      do {
        card = this.deal(1);
        this.discard(card);
      } while (card.isSpecial());
    }
  }

  create(numPlayers) {
    if (numPlayers < presets.MIN_PLAYERS) return false;
    let specialOption = numPlayers == 2 ? "specialsForTwoPlayers" : "specials";

    let cID = 1; //that way always returns true
    for (let card in presets.CARDS) {
      card = presets.CARDS[card];
      for (let set = 0; set < card.sets; set++) {
        for (let i = 1; i <= presets.MAX_COLORS; i++) {
          let color = e.color[i];
          if (!card.color) color = e.color.COLORLESS;
          this.drawPile.push(
            new Card(color, card.value, card.worth, cID, card[specialOption])
          );
          cID++;
        }
      }
    }
  }

  shuffle() {
    this.drawPile = this.drawPile.concat(
      this.discardPile.splice(0, this.discardPile.length - 1)
    );

    for (let i = this.drawPile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.drawPile[i], this.drawPile[j]] = [
        this.drawPile[j],
        this.drawPile[i]
      ];
    }
  }

  deal(number) {
    if (this.drawPile.length == 0) this.shuffle();
    let cards = this.drawPile.splice(-number);
    if (number == 1) return cards[0];
    return cards;
  }

  discard(card) {
    this.discardPile.push(card);
  }

  weakMatch(card, newColor = false) {
    let lastCard = this.discardPile.slice(-1)[0];
    if (card.color == e.color.COLORLESS) return true;
    if (newColor) {
      return card.value == lastCard.value || card.color == newColor;
    } else {
      return card.value == lastCard.value || card.color == lastCard.color;
    }
  }

  strongMatch(card) {
    let lastCard = this.discardPile.slice(-1)[0];
    return card.color == lastCard.color && card.value == lastCard.value;
  }
}

module.exports = Deck;
