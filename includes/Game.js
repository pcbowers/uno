const presets = require("./presets");
const e = presets.enums;

const Deck = require("./Deck");
const Player = require("./Player");

class Game {
  players;
  timers;
  gID;
  playerTotal = 0;
  spectatorTotal = 0;
  undecidedTotal = 0;

  started;

  deck;
  pauseForDisconnect;
  pauseForSpecial;
  cardDrawn;
  newColor;
  lastPlayer;
  currentPlayer;
  currentDirection;
  nextPlayerStep;
  currentDrawTotal;
  currentSlap;

  constructor(gID = null) {
    console.info("Creating Game Room... ");

    this.gID = gID;
    this.deck = new Deck(0);
    this.timers = [];
    this.reset(false);
  }

  rotateSequence() {
    let sequence = -1;
    let id = false;
    for (let player in this.players) {
      if (this.isPlayer(player)) {
        let tempSequence = this.players[player].sequence;
        if (sequence != -1) this.players[player].sequence = sequence;
        if (!id) id = player;
        sequence = tempSequence;
      }
    }

    if (id) this.players[id].sequence = sequence;
    return true;
  }

  reset(softReset = true) {
    console.info("Resetting game properties");

    if (!softReset) {
      //console.info("Hard resetting");

      for (let timer in this.timers) {
        clearTimeout(this.timers[timer]);
      }

      this.timers = [];
      this.players = {};
      this.playerTotal = 0;
      this.spectatorTotal = 0;
      this.undecidedTotal = 0;
      this.winner = -1;
      this.freezeNew = false;
      this.pauseForDisconnect = false;
    }

    this.started = false;

    for (let player in this.players) {
      this.players[player].reset();
    }

    this.rotateSequence();

    //console.info(this.players);

    this.deck.reset(this.playerTotal);
    this.pauseForSpecial = false;
    this.cardDrawn = false;
    this.newColor = false;
    this.lastPlayer = 0;
    this.currentPlayer = 0;
    this.currentDirection = e.direction.FORWARD;
    this.nextPlayerStep = 1;
    this.currentDrawTotal = 0;
    this.currentSlap = [];
  }

  readyToStart(pID = null) {
    if (pID != null && this.isPlayer(pID)) {
      this.players[pID].readyToStart = true;

      // console.info({
      //   player: this.players[pID],
      //   note: "Player ready to start"
      // });
    }

    let totalReady = 0;
    for (let player in this.players) {
      if (this.isPlayer(player) && this.players[player].readyToStart)
        totalReady++;
    }

    if (
      totalReady == this.playerTotal &&
      this.playerTotal >= presets.MIN_PLAYERS &&
      !this.checkDisconnected() &&
      !this.started
    )
      this.start();

    return totalReady;
  }

  start() {
    console.info("---------- NEW GAME ----------");
    console.info("Starting a new game in game room " + this.gID);

    this.deck.reset(this.playerTotal);
    this.winner = -1;

    for (let player in this.players) {
      if (this.isPlayer(player))
        this.players[player].takeCards(
          this.deck.deal(presets.TOTAL_START_CARDS)
        );
    }

    this.started = true;
    if (!this.freezeNew) this.freezeNew = true;

    //console.info(this.players);
  }

  connectPlayer(pID) {
    if (!this.isPlayer(pID, true, true)) {
      this.addPlayer(pID);
      // console.info({
      //   player: this.players[pID],
      //   note: "New player connected and added"
      // });
    } else {
      // console.info({
      //   player: this.players[pID],
      //   note: "Player connected"
      // });
      this.players[pID].disconnect = false;
    }

    //console.log(Object.keys(this.players));

    this.checkDisconnected();
  }

  addPlayer(pID) {
    this.players[pID] = new Player(pID);
    this.undecidedTotal++;
  }

  disconnectPlayer(pID) {
    if (this.isPlayer(pID, true, true)) {
      this.players[pID].disconnect = true;
      if (this.freezeNew && this.isPlayer(pID)) {
        this.timers.push(
          setTimeout(
            this.removePlayer.bind(this),
            presets.MAX_DISCONNECT_TIMEOUT_STARTED,
            pID
          )
        );

        // console.info({
        //   player: this.players[pID],
        //   note: "Player disconnected"
        // });
      } else {
        this.timers.push(
          setTimeout(
            this.removePlayer.bind(this),
            presets.MAX_DISCONNECT_TIMEOUT_NOT_STARTED,
            pID
          )
        );

        // console.info({
        //   player: this.players[pID],
        //   note: "Spectator disconnected (or game not started)"
        // });
      }

      this.checkDisconnected();
      return true;
    } else return false;
  }

  removePlayer(pID) {
    if (this.isPlayer(pID, true, true)) {
      if (this.players[pID].disconnect) {
        // console.info({
        //   player: this.players[pID],
        //   note: "Player disconnected for too long and is being removed"
        // });

        if (this.freezeNew && this.isPlayer(pID)) this.reset(false);
        else if (this.isPlayer(pID)) this.playerTotal--;
        else if (this.isPlayer(pID, true)) this.spectatorTotal--;
        else this.undecidedTotal--;

        delete this.players[pID];
        this.checkDisconnected();
        return true;
      }
    }

    return false;
  }

  checkDisconnected() {
    for (let player in this.players) {
      player = this.players[player];
      if (player.isPlayer() && player.disconnect) {
        // console.info({
        //   player: player,
        //   note: "Pausing game due to disconnection"
        // });

        this.pauseForDisconnect = true;
        return true;
      }
    }

    //console.info("Players all connected successfully");

    this.pauseForDisconnect = false;
    return false;
  }

  setPlayerName(pID, name = "anonymous player") {
    if (this.isPlayer(pID, true, true)) {
      if (name.length != "") this.players[pID].name = name;

      // console.info({
      //   player: this.players[pID],
      //   note: "Player name set"
      // });

      this.setPlayerPosition(pID);
      return true;
    } else return false;
  }

  setPlayerPosition(pID, spectator = false) {
    if (
      this.isPlayer(pID, true, true) &&
      this.players[pID].role == e.role.UNDECIDED
    ) {
      if (spectator || this.freezeNew) {
        this.players[pID].role = e.role.SPECTATOR;
        this.spectatorTotal++;
        this.undecidedTotal--;
      } else if (!this.freezeNew) {
        this.players[pID].role =
          this.playerTotal < presets.MAX_PLAYERS
            ? e.role.PLAYER
            : e.role.SPECTATOR;
        this.playerTotal++;
        this.undecidedTotal--;
      }

      // console.info({
      //   player: this.players[pID],
      //   note: "Player role set"
      // });
    } else return false;

    if (this.players[pID].role == e.role.PLAYER) {
      this.players[pID].sequence = this.playerTotal - 1;

      // console.info({
      //   player: this.players[pID],
      //   note: "Player sequence set"
      // });
    }

    return true;
  }

  isPlayer(pID, spectatorAllowed = false, allAllowed = false) {
    return (
      this.players.hasOwnProperty(pID) &&
      ((spectatorAllowed && this.players[pID].isSpectator()) ||
        this.players[pID].isPlayer() ||
        allAllowed)
    );
  }

  checkWin() {
    for (let player in this.players) {
      if (this.isPlayer(player) && this.started) {
        if (this.players[player].hand.length == 0) {
          this.tallyPoints();
          this.reset();
          this.winner = this.players[player].sequence;
          return true;
        }
      }
    }

    return false;
  }

  tallyPoints() {
    for (let player in this.players) {
      if (this.isPlayer(player)) {
        player = this.players[player];
        for (let card in player.hand) {
          this.players[player.pID].points += player.hand[card].worth;
        }
      }
    }
    return true;
  }

  play(pID, cID) {
    if (this.isPlayer(pID) && this.players[pID].hasCard(cID)) {
      let card = this.players[pID].giveCard(cID, true);
      if (this.isTurnPlay(pID, card)) {
        card = this.players[pID].giveCard(cID);
        //console.table(card);
        this.deck.discard(card);
        this.cardDrawn = false;
        this.newColor = false;

        let special = this.specialPlay(card);
        this.changeCurrentPlayer(pID);
        return special;
      }
    }

    return false;
  }

  specialPlay(card) {
    //console.table(card);

    if (card.special.includes(e.special.DRAW_2)) this.currentDrawTotal += 2;
    if (card.special.includes(e.special.DRAW_4)) this.currentDrawTotal += 4;

    if (card.special.includes(e.special.REVERSE))
      this.currentDirection =
        this.currentDirection == e.direction.FORWARD
          ? e.direction.BACKWARD
          : e.direction.FORWARD;

    if (card.special.includes(e.special.SKIP)) this.nextPlayerStep = 2;

    if (card.special.includes(e.special.CHANGE_COLOR)) {
      this.pauseForSpecial = e.special.CHANGE_COLOR;
      return e.special.CHANGE_COLOR;
    }

    if (card.special.includes(e.special.SWAP)) {
      this.pauseForSpecial = e.special.SWAP;
      return e.special.SWAP;
    }

    if (card.special.includes(e.special.SLAP)) {
      this.pauseForSpecial = e.special.SLAP;
      return e.special.SLAP;
    }

    return e.special.NOT_SPECIAL;
  }

  draw(pID, changeCurrentPlayer = true) {
    if (this.isPlayer(pID)) {
      if (this.isTurnDraw(pID) || !changeCurrentPlayer) {
        if (!this.currentDrawTotal) {
          let card = this.deck.deal(1);
          this.players[pID].takeCards(card);
          this.cardDrawn = card.cID;
        } else {
          this.players[pID].takeCards(this.deck.deal(this.currentDrawTotal));
          this.currentDrawTotal = 0;
          this.cardDrawn = false;
        }

        this.players[pID].uno = false;
        if (changeCurrentPlayer) this.changeCurrentPlayer(pID);
        return true;
      }
    }

    return false;
  }

  uno(pID) {
    if (this.isPlayer(pID)) {
      for (let player in this.players) {
        if (this.isPlayer(player)) {
          player = this.players[player];
          if (player.pID == pID && player.hand.length == 1) player.uno = true;
          else if (
            player.pID == pID &&
            this.getCurrentPlayer() == pID &&
            player.hand.length <= 2
          )
            player.uno = true;
          else if (player.hand.length == 1 && !player.uno)
            this.players[player.pID].takeCards(this.deck.deal(2));
        }
      }
    }
  }

  isTurnPlay(pID, card) {
    return (
      ((pID == this.getCurrentPlayer() &&
        this.deck.weakMatch(card, this.newColor) &&
        !this.currentDrawTotal) ||
        this.deck.strongMatch(card) ||
        (pID == this.getLastPlayer() &&
          this.deck.weakMatch(card, this.newColor) &&
          this.cardDrawn == card.cID) ||
        (pID == this.getCurrentPlayer() &&
          this.deck.weakMatch(card) &&
          card.special.includes(e.special.DRAW_2))) &&
      !this.pauseForSpecial &&
      !this.pauseForDisconnect
    );
  }

  isTurnDraw(pID) {
    return (
      pID == this.getCurrentPlayer() &&
      !this.pauseForSpecial &&
      !this.pauseForDisconnect
    );
  }

  getCurrentPlayer(lastPlayer = false) {
    let sequence = lastPlayer ? this.lastPlayer : this.currentPlayer;
    for (let player in this.players) {
      if (this.players[player].sequence == sequence) return player;
    }
  }

  getLastPlayer() {
    return this.getCurrentPlayer(true);
  }

  getPlayerID(sequence) {
    for (let player in this.players) {
      if (sequence == this.players[player].sequence)
        return this.players[player].pID;
    }
  }

  changeWatch(pID, sequence) {
    if (
      this.isPlayer(pID, true) &&
      this.isPlayer(this.getPlayerID(sequence)) &&
      this.players[pID].isSpectator()
    ) {
      this.players[pID].watching = sequence;
      return true;
    }

    return false;
  }

  getAllGameItems(pID = null) {
    if (this.isPlayer(pID, true) || pID == null) {
      let args = {};
      args.otherPlayers = {};
      for (let player in this.players) {
        if (this.isPlayer(player)) {
          player = this.players[player];
          args.otherPlayers[player.sequence] = {};
          args.otherPlayers[player.sequence].sequence = player.sequence;
          args.otherPlayers[player.sequence].handSize = player.hand.length;
          args.otherPlayers[player.sequence].name = player.name;
          args.otherPlayers[player.sequence].points = player.points;
        }
      }

      args.playerTotal = this.playerTotal;
      args.spectatorTotal = this.spectatorTotal;
      args.undecidedTotal = this.undecidedTotal;
      args.winner = this.winner;
      args.started = this.started;

      if (this.started && pID != null) {
        if (!this.isPlayer(pID))
          pID = this.getPlayerID(this.players[pID].watching);
        args.currentPlayer = this.currentPlayer;
        args.lastPlayer = this.lastPlayer;
        args.pauseForSpecial = this.pauseForSpecial;
        args.newColor = this.newColor;
        args.discardPile = this.deck.discardPile;
        args.name = this.players[pID].name;
        args.points = this.players[pID].points;
        args.sequence = this.players[pID].sequence;
        args.hand = this.players[pID].hand;
      }

      return args;
    } else return false;
  }

  changeColor(pID, newColor) {
    if (
      this.isPlayer(pID) &&
      this.getLastPlayer() == pID &&
      this.pauseForSpecial == e.special.CHANGE_COLOR
    ) {
      this.newColor = newColor;
      this.pauseForSpecial = false;
      return true;
    } else return false;
  }

  makeSlap(pID) {
    if (this.isPlayer(pID) && this.pauseForSpecial == e.special.SLAP) {
      if (!this.currentSlap.includes(pID)) this.currentSlap.push(pID);
      if (this.currentSlap.length + 1 >= this.playerTotal) {
        for (let player in this.players) {
          //console.log({ player: player, pID: pID });
          if (this.isPlayer(player) && !this.currentSlap.includes(player)) {
            this.currentDrawTotal = 2;
            this.draw(player, false);
            break;
          }
        }
        this.currentSlap = [];
        this.pauseForSpecial = false;
      }

      return true;
    } else return false;
  }

  makeSwap(pID1, sequence) {
    if (
      this.isPlayer(pID1) &&
      this.getLastPlayer() == pID1 &&
      this.pauseForSpecial == e.special.SWAP
    ) {
      let id = this.getPlayerID(sequence);
      let hand1 = this.players[pID1].giveCards();
      let hand2 = this.players[id].giveCards();
      this.players[pID1].takeCards(hand2);
      this.players[id].takeCards(hand1);

      this.pauseForSpecial = false;
      return true;
    } else return false;
  }

  changeCurrentPlayer(pID) {
    Number.prototype.mod = function(n) {
      return ((this % n) + n) % n;
    };

    if (this.currentDirection == e.direction.BACKWARD)
      this.nextPlayerStep = -this.nextPlayerStep;

    this.lastPlayer = this.players[pID].sequence;
    
    this.currentPlayer =
      (this.lastPlayer + this.nextPlayerStep).mod(this.playerTotal);

    this.nextPlayerStep = 1;

    return this.currentPlayer;
  }
}

// var game1 = new Game(18329);

// game1.connectPlayer(1);
// game1.connectPlayer(2);
// game1.connectPlayer(3);
// game1.connectPlayer(4);
// game1.connectPlayer(5);
// game1.connectPlayer(6);
// game1.connectPlayer(7);
// game1.setPlayerName(1);
// game1.setPlayerName(2);
// game1.setPlayerName(3);
// game1.setPlayerName(4);
// game1.setPlayerName(5);
// game1.setPlayerName(6);
// game1.setPlayerName(7);
// game1.readyToStart(1);
// game1.readyToStart(2);
// game1.readyToStart(3);
// game1.readyToStart(4);
// game1.readyToStart(5);
// game1.readyToStart(6);

module.exports = Game;
