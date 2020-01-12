let special = {
  NOT_SPECIAL: 0,
  DRAW_2: 1,
  DRAW_4: 2,
  SKIP: 3,
  REVERSE: 4,
  SLAP: 5,
  SWAP: 6,
  CHANGE_COLOR: 7
};

let color = {
  RED: 1,
  1: 1,
  BLUE: 2,
  2: 2,
  GREEN: 3,
  3: 3,
  YELLOW: 4,
  4: 4,
  COLORLESS: 0,
  0: 0
};

let role = {
  PLAYER: 1,
  SPECTATOR: 0,
  UNDECIDED: -1
};

let direction = {
  FORWARD: 1,
  BACKWARD: 0
};

let cards = [
  {
    value: "0",
    worth: 0,
    sets: 1, //# of sets (this # is multiplied by the number of colors)
    color: true, //does this card have colors
    specials: [special.SWAP],
    specialsForTwoPlayers: [special.SWAP]
  },
  {
    value: "1",
    worth: 1,
    sets: 2, //# of sets (this # is multiplied by the number of colors)
    color: true, //does this card have colors
    specials: [],
    specialsForTwoPlayers: []
  },
  {
    value: "2",
    worth: 2,
    sets: 2, //# of sets (this # is multiplied by the number of colors)
    color: true, //does this card have colors
    specials: [],
    specialsForTwoPlayers: []
  },
  {
    value: "3",
    worth: 3,
    sets: 2, //# of sets (this # is multiplied by the number of colors)
    color: true, //does this card have colors
    specials: [],
    specialsForTwoPlayers: []
  },
  {
    value: "4",
    worth: 4,
    sets: 2, //# of sets (this # is multiplied by the number of colors)
    color: true, //does this card have colors
    specials: [],
    specialsForTwoPlayers: []
  },
  {
    value: "5",
    worth: 5,
    sets: 2, //# of sets (this # is multiplied by the number of colors)
    color: true, //does this card have colors
    specials: [],
    specialsForTwoPlayers: []
  },
  {
    value: "6",
    worth: 6,
    sets: 2, //# of sets (this # is multiplied by the number of colors)
    color: true, //does this card have colors
    specials: [special.SLAP],
    specialsForTwoPlayers: []
  },
  {
    value: "7",
    worth: 7,
    sets: 2, //# of sets (this # is multiplied by the number of colors)
    color: true, //does this card have colors
    specials: [],
    specialsForTwoPlayers: []
  },
  {
    value: "8",
    worth: 8,
    sets: 2, //# of sets (this # is multiplied by the number of colors)
    color: true, //does this card have colors
    specials: [],
    specialsForTwoPlayers: []
  },
  {
    value: "9",
    worth: 9,
    sets: 2, //# of sets (this # is multiplied by the number of colors)
    color: true, //does this card have colors
    specials: [],
    specialsForTwoPlayers: []
  },
  {
    value: "reverse",
    worth: 20,
    sets: 2, //# of sets (this # is multiplied by the number of colors)
    color: true, //does this card have colors
    specials: [special.REVERSE],
    specialsForTwoPlayers: [special.SKIP]
  },
  {
    value: "skip",
    worth: 20,
    sets: 2, //# of sets (this # is multiplied by the number of colors)
    color: true, //does this card have colors
    specials: [special.SKIP],
    specialsForTwoPlayers: [special.SKIP]
  },
  {
    value: "draw_2",
    worth: 20,
    sets: 2, //# of sets (this # is multiplied by the number of colors)
    color: true, //does this card have colors
    specials: [special.DRAW_2],
    specialsForTwoPlayers: [special.DRAW_2]
  },
  {
    value: "wild",
    worth: 50,
    sets: 1, //# of sets (this # is multiplied by the number of colors)
    color: false, //does this card have colors
    specials: [special.CHANGE_COLOR],
    specialsForTwoPlayers: [special.CHANGE_COLOR]
  },
  {
    value: "wild_4",
    worth: 50,
    sets: 1, //# of sets (this # is multiplied by the number of colors)
    color: false, //does this card have colors
    specials: [special.CHANGE_COLOR, special.DRAW_4],
    specialsForTwoPlayers: [special.CHANGE_COLOR, special.DRAW_4]
  }
];

module.exports = {
  CARDS: cards,
  MAX_PLAYERS: 6,
  MIN_PLAYERS: 2,
  MAX_COLORS: 4,
  TOTAL_START_CARDS: 7,
  MAX_DISCONNECT_TIMEOUT_STARTED: 30000, //milliseconds = 30 seconds
  MAX_DISCONNECT_TIMEOUT_NOT_STARTED: 5000, //milliseconds = 5 seconds;
  enums: {
    special: special,
    color: color,
    role: role,
    direction: direction
  }
};
