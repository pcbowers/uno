const app = require("express")();
const session = require("express-session");
const http = require("http").createServer(app);
const path = require("path");
const port = process.env.PORT || 3001;
const io = require("socket.io")(http);
const Game = require("./includes/Game");
const uuid = require("uuid/v1");
const presets = require("./includes/presets");
const e = presets.enums;

var games = {};

//SET UP  MIDDLEWARE
const entryFiles = [
  path.join(__dirname, "/src/index.html"),
  path.join(__dirname, "/src/game.html"),
  path.join(__dirname, "/src/test.html")
];
const Bundler = require("parcel-bundler");
const bundlerOptions = {
  global: "globalVars",
  publicUrl: "/node/uno/dist"
};
const bundler = new Bundler(entryFiles, bundlerOptions);

const sessionMiddleware = session({
  secret: "vBTt2OAq3kJJm4T9Tcc61htfofAobzPW",
  resave: true,
  saveUninitialized: true,
  cookie: false
});

app.use(bundler.middleware());
app.use(sessionMiddleware);

app.get("/", (req, res) => {
  if (!req.session.pID) req.session.pID = uuid();
  res.sendFile(__dirname + "/dist/index.html");
});

app.get("/*", (req, res) => {
  if (!req.session.pID) req.session.pID = uuid();
  res.sendFile(__dirname + "/dist/game.html");
});

//SET UP SOCKETS

/*
ssh -R 80:localhost:8080 ssh.localhost.run

CHEAT-SHEET
  CLIENT
  socket.emit(id, vars);

  ALL BUT CLIENT
  socket.to(game).emit(id, vars);

  ALL
  io.in(game).emit(id, vars);

*/
io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res, next);
});

io.on("connection", socket => {
  //set session information
  var s = socket.request.session;
  var player;
  if (!s.pID) return;
  else player = s.pID;

  //set up socket connection
  if (checkPath(socket)) {
    let game = getPath(socket);
    socket.join(game);
    if (!(game in games)) games[game] = new Game(game);
    games[game].connectPlayer(player);
    if (!games[game].pauseForDisconnect) {
      io.in(game).emit("connected");
    }
    setCount(io, game);
    if (games[game].isPlayer(player, true)) closeIntro(socket, game, player);
    setCount(io, game);
    io.in(game).emit("askForUpdate");
  } else console.log(player + " joined namespace. Game not chosen");

  socket.on("rolePlayer", name => {
    let game = getPath(socket);
    games[game].setPlayerName(player, name);
    setCount(io, game);
    closeIntro(socket, game, player);
  });

  socket.on("roleSpectator", () => {
    let game = getPath(socket);
    games[game].setPlayerPosition(player, true);
    setCount(io, game);
    closeIntro(socket, game, player);
  });

  socket.on("readyToStart", () => {
    let game = getPath(socket);
    games[game].readyToStart(player);
    checkStart(io, game);
    setCount(io, game);
    socket.emit("ready");
  });

  socket.on("updateGame", () => {
    let game = getPath(socket);
    if (
      games[game].pauseForSpecial == e.special.CHANGE_COLOR &&
      games[game].getLastPlayer() == player
    )
      socket.emit("newColor");

    if (
      games[game].pauseForSpecial == e.special.SWAP &&
      games[game].getLastPlayer() == player
    )
      socket.emit("swap");

    socket.emit("updateGame", games[game].getAllGameItems(player));

    if (games[game].checkWin()) {
      io.in(game).emit("win");
    }

    if (!games[game].started && games[game].freezeNew && games[game].players[player].role != e.role.UNDECIDED) {
      setCount(io, game);
      closeIntro(socket, game, player);
    }
  });

  socket.on("draw", () => {
    let game = getPath(socket);
    games[game].draw(player);
    io.in(game).emit("askForUpdate");
  });

  socket.on("play", cID => {
    let game = getPath(socket);
    games[game].play(player, cID);
    io.in(game).emit("askForUpdate");
  });

  socket.on("newColor", color => {
    let game = getPath(socket);
    games[game].changeColor(player, color);
    io.in(game).emit("askForUpdate");
  });

  socket.on("swap", sequence => {
    let game = getPath(socket);
    games[game].makeSwap(player, sequence);
    io.in(game).emit("askForUpdate");
  });

  socket.on("changeWatch", sequence => {
    let game = getPath(socket);
    games[game].changeWatch(player, sequence);
    io.in(game).emit("askForUpdate");
  });

  socket.on("slap", () => {
    let game = getPath(socket);
    games[game].makeSlap(player);
    io.in(game).emit("askForUpdate");
  });

  socket.on("uno", () => {
    let game = getPath(socket);
    games[game].uno(player);
    io.in(game).emit("askForUpdate");
  });

  //ON DISCONNECT
  socket.on("disconnect", () => {
    if (checkPath(socket)) {
      let game = getPath(socket);
      games[game].disconnectPlayer(player);
      if (games[game].pauseForDisconnect) io.in(game).emit("disconnected");
      io.in(game).emit("askForUpdate");
      setTimeout(
        setCount,
        presets.MAX_DISCONNECT_TIMEOUT_NOT_STARTED + 1,
        io,
        game
      );
      if (io.sockets.adapter.rooms[game] === undefined) {
        console.log("All players left game. Deleting game...");
        games[game].reset(false);
        //TODO add timer
        delete games[game];
      }
    } else console.log(player + " disconnected");
  });
});

function checkPath(socket) {
  return socket.handshake.query.hasOwnProperty("path");
}

function getPath(socket) {
  return socket.handshake.query.path;
}

function setCount(io, game) {
  if (isGame(game)) {
    let readyTotal = games[game].readyToStart();
    io.in(game).emit("setCount", games[game].getAllGameItems(), readyTotal);
    checkStart(io, game);
  }
}

function isGame(game) {
  return games.hasOwnProperty(game);
}

function closeIntro(socket, game, player) {
  player = games[game].players[player];
  socket.emit("closeIntro", player.role, player.sequence, player.readyToStart);
}

function checkStart(io, game) {
  if (games[game].started) {
    io.in(game).emit("closeStart");
  }
}

//RUN SERVER
http.listen(port, () => {
  console.log("Starting server on port " + port);
});
