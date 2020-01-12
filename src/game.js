$("#game-title").html(title);
$("#game-start").hide();
$("#game-main").hide();
$("#disconnect").hide();
$("#stats").hide();

const cardSize = 6;
const cardSpace = 1.2;

var role = -1;
var sequence = null;
var ready = false;
var started = false;
var totalPlayer = 0;
var lastCardClicked = false;
var isSwap = false;
var argsOld = false;
var disconnect = false;

$("#form-intro").submit(e => {
  e.preventDefault();
  socket.emit("rolePlayer", $("#name").val());
  return false;
});

$("#socket-roleSpectator").click(() => {
  socket.emit("roleSpectator");
});

$("#socket-readyToStart").click(() => {
  socket.emit("readyToStart");
});

$("#uno").click(() => {
  socket.emit("uno");
});

socket.on("closeIntro", (rl, sq, rd) => {
  role = rl;
  sequence = sq;
  ready = rd;
  started = false;

  $("#game-intro").hide();
  $("#game-start").show();
  $("#game-main").hide();
  $("#stats").show();
  $("html").css({ overflow: "auto" });

  showGame();

  if (sequence == null || ready) hideReadyToStart();
  else showReadyToStart();

  setStartTitle();
});

socket.on("win", () => {
  $("#show-stats").addClass("is-active");
});

socket.on("closeStart", () => {
  socket.emit("updateGame");

  showGame();
});

socket.on("ready", () => {
  ready = true;
  hideReadyToStart();
  setStartTitle();
});

socket.on("updateGame", args => {
  updateGameTable(args);
});

socket.on("askForUpdate", () => {
  socket.emit("updateGame");
});

socket.on("setCount", (args, readyCount) => {
  totalPlayer = args.playerTotal;
  $("#num-undecided").text(args.undecidedTotal);
  $("#num-spectator").text(args.spectatorTotal);
  $("#num-player").text(args.playerTotal);
  $("#num-ready").text(readyCount);

  started = args.started;

  let order = [];
  for (let player in args.otherPlayers) {
    player = args.otherPlayers[player];
    order.push({
      name: player.name,
      points: player.points
    });
  }

  order.sort((a, b) => {
    if (a.points > b.points) return 1;
    else return -1;
  });

  $("#allStats").html("");
  $("#winner").html("");
  $("#winner").show();
  for (let i = 0; i < order.length; i++) {
    $("#allStats").append(
      "<div class='level-item has-text-centered'><div><p class='heading'><i class='fas fa-medal'></i> " +
        order[i].name +
        "</p><p class='title'>" +
        order[i].points +
        "</p></div></div>"
    );
  }

  if (args.winner != -1)
    $("#winner").append(args.otherPlayers[args.winner].name + " Won!<hr>");
  else $("#winner").hide();
});

socket.on("swap", () => {
  isSwap = true;
});

$("#show-stats").click(function(event) {
  event.stopPropagation();
  $("#show-stats").removeClass("is-active");
});

$("#stats").click(function(event) {
  event.stopPropagation();
  $("#show-stats").addClass("is-active");
});

socket.on("newColor", () => {
  $("#choose-color").addClass("is-active");
  $("#color1").click(function(event) {
    event.stopPropagation();
    $("#choose-color").removeClass("is-active");
    socket.emit("newColor", 1);
  });

  $("#color2").click(function(event) {
    event.stopPropagation();
    $("#choose-color").removeClass("is-active");
    socket.emit("newColor", 2);
  });

  $("#color3").click(function(event) {
    event.stopPropagation();
    $("#choose-color").removeClass("is-active");
    socket.emit("newColor", 3);
  });

  $("#color4").click(function(event) {
    event.stopPropagation();
    $("#choose-color").removeClass("is-active");
    socket.emit("newColor", 4);
  });
});

socket.on("disconnected", () => {
  disconnect = true;
  $("#disconnect").show();
});

socket.on("connected", () => {
  disconnect = false;
  $("#disconnect").hide();
});

function showGame() {
  if (role != -1 && started) {
    $("html").css({ overflow: "hidden" });
    $("#game-intro").hide();
    $("#game-start").hide();
    $("#game-main").show();
  }
}

function updateGameTable(args) {
  if (disconnect) return;

  if (!started) return;

  if (args == argsOld) return;
  else argsOld = args;

  let maxDiscardShow = 3;
  let maxOthersShow = 7;

  $("#gameTable").html(
    "<div class='keepInline'> <article class='stack' id='deck'></article> <article class='stack' id='discard'></article></div>"
  );

  for (let i = 0; i < totalPlayer; i++) {
    let sequence = (i + args.sequence) % totalPlayer;
    let id = "player-" + sequence;
    let turn = "";
    if (args.currentPlayer == sequence && args.pauseForSpecial != 5)
      turn = "turn";
    if (args.pauseForSpecial == 6 && isSwap) turn = "swap";
    $("#gameTable").append(
      "<div class='keepInline stack " +
        turn +
        "'><div id='" +
        id +
        "'><span class='playerData is-uppercase'>" +
        args.otherPlayers[sequence].name +
        "</span></div></div>"
    );

    if (args.pauseForSpecial == 6 && isSwap)
      $("#" + id).click(function() {
        socket.emit("swap", this.id[this.id.length - 1]);
      });

    if (role == 0)
      $("#" + id).click(function() {
        socket.emit("changeWatch", this.id[this.id.length - 1]);
      });
  }

  $("#deck").append(selectCard(false, true));
  $("#deck").click(() => {
    socket.emit("draw");
  });

  for (let i = maxDiscardShow - 1; i >= 0; i--) {
    let index = args.discardPile.length - 1 - i;
    if (index >= 0) $("#discard").append(selectCard(args.discardPile[index], false, args.newColor));
  }

  //SLAP
  if (args.pauseForSpecial == 5) {
    let index = args.discardPile[args.discardPile.length - 1].cID;
    $("#discard").addClass("turn");
    $("#" + index).click(() => {
      socket.emit("slap");
    });
  }

  for (let player in args.otherPlayers) {
    player = args.otherPlayers[player];
    if (player.sequence == args.sequence) continue;
    for (let i = 0; i < player.handSize; i++) {
      if (i == maxOthersShow) {
        let extra = player.handSize;
        $("#player-" + player.sequence).append(
          "<span class='otherCards'>" + extra + " Cards</span>"
        );
        break;
      }
      $("#player-" + player.sequence).prepend(selectCard(false, true));
    }
  }

  for (let i = 0; i < args.hand.length; i++) {
    $("#player-" + args.sequence).prepend(selectCard(args.hand[i]));
    $("#" + args.hand[i].cID).click(function(event) {
      if (args.pauseForSpecial != 6 || !isSwap) {
        event.stopPropagation();
        if (lastCardClicked !== this.id) makeActive(this.id);
        else socket.emit("play", this.id);
      }
    });
  }

  setUpCircle();
}

$("#gameTable").click(() => {
  makeActive();
});

function hideReadyToStart() {
  $("#socket-readyToStart").hide();
}

function showReadyToStart() {
  $("#socket-readyToStart").show();
}

function setStartTitle() {
  if (role && ready) {
    $("#title-spectator").html("Spectators");
    $("#title-player").html("Players");
    $("#title-ready").html("<b>Ready (You)</b>");
  } else if (role) {
    $("#title-spectator").html("Spectators");
    $("#title-player").html("<b>Players (You)</b>");
    $("#title-ready").html("Ready");
  } else {
    $("#title-spectator").html("<b>Spectators (You)</b>");
    $("#title-player").html("Players");
    $("#title-ready").html("Ready");
  }
}

function selectCard(card, back = false, newColor = false) {
  if(card && newColor && card.color == 0) card.color = newColor;
  let idClass = "<img id='" + card.cID + "' class='card'";

  if (back) card = { color: 0, value: "back" };
  let name = "Card " + card.color + " " + card.value;
  altTitle = "' alt='" + name + "' title='" + name + "'>";

  let start = "src='dist/images/";
  //let image = "card.jpg";
  let image = card.color + card.value + ".jpg";

  return idClass + start + image + altTitle;
}

function makeActive(id = false) {
  if (lastCardClicked) {
    $("#" + lastCardClicked).removeClass("active");
    lastCardClicked = false;
  }

  if (id) {
    $("#" + id).addClass("active");
    lastCardClicked = id;
  }
}

function setUpCircle() {
  var elements = $("#gameTable").children("div:not(:first-child)");
  //var radius = window.innerHeight > window.innerWidth ? window.innerWidth / 2 : window.innerHeight / 2;

  elements.each((i, element) => {
    let rotate = (360 / elements.length) * i;
    let rotateReverse = -rotate;
    let angle = (rotate * Math.PI) / 180;
    let a = window.innerHeight / 2;
    let b = window.innerWidth / 2;
    let rotateEllipse =
      (a * b) /
      Math.sqrt(
        Math.pow(a, 2) * Math.pow(Math.sin(angle), 2) +
          Math.pow(b, 2) * Math.pow(Math.cos(angle), 2)
      );
    let axis = b > a ? "0px" : "0px";
    if (i != 0) rotateReverse = 0;

    let width =
      cardSize +
      cardSpace *
        ($(element)
          .children("div")
          .children().length -
          1);

    $(element)
      .children("div")
      .css({
        width: width + "em"
      });

    $(element).css({
      transform:
        "translate(-50%, -50%) rotate(" +
        rotate +
        "deg) translateY(calc(" +
        rotateEllipse +
        "px - " +
        axis +
        ")) rotate(" +
        rotateReverse +
        "deg)"
    });
  });
}

$(window).resize(() => {
  setUpCircle();
});
