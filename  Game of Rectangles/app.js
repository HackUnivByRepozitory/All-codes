"use strict";

let canv, ctx; // canvas and context
let maxx, maxy; // canvas dimensions
let grid;
let mousePosition;
let rectangles;
let explics;
const bgColor = "#000";
let ui, uiv;
// for animation
let messages;
let splash;
let firstRun = true;

// styles for lines
const LINE_ATTR_HOVER_NO = {
  color: "#f00",
  lineDash: [10, 10],
  lineWidth: 3
};
const LINE_ATTR_HOVER_YES = {
  color: "#0f0",
  lineDash: [10, 10],
  lineWidth: 3
};
const LINE_ATTR_CHOICE = {
  color: "#0f0",
  lineDash: [5, 5],
  lineWidth: 2
};

const LINE_ATTR_TARGET = {
  lineWidth: 1.5,
  color: "#fff"
};

let tolMouse = 10; // tolerance on mouse position

// shortcuts for Math.
const mrandom = Math.random;
const mfloor = Math.floor;
const mround = Math.round;
const mceil = Math.ceil;
const mabs = Math.abs;
const mmin = Math.min;
const mmax = Math.max;

const mPI = Math.PI;
const mPIS2 = Math.PI / 2;
const mPIS3 = Math.PI / 3;
const m2PI = Math.PI * 2;
const m2PIS3 = (Math.PI * 2) / 3;
const msin = Math.sin;
const mcos = Math.cos;
const matan2 = Math.atan2;

const mhypot = Math.hypot;
const msqrt = Math.sqrt;

const rac3 = msqrt(3);
const rac3s2 = rac3 / 2;

//------------------------------------------------------------------------
function isMiniature() {
  return location.pathname.includes("/fullcpgrid/");
}

function alea(mini, maxi) {
  // random number in given range

  if (typeof maxi == "undefined") return mini * mrandom(); // range 0..mini

  return mini + mrandom() * (maxi - mini); // range mini..maxi
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function intAlea(mini, maxi) {
  // random integer in given range (mini..maxi - 1 or 0..mini - 1)
  //
  if (typeof maxi == "undefined") return mfloor(mini * mrandom()); // range 0..mini - 1
  return mini + mfloor(mrandom() * (maxi - mini)); // range mini .. maxi - 1
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function lerp(v0, v1, alpha) {
  return v0 * (1 - alpha) + v1 * alpha;
}

//------------------------------------------------------------------------
function setMenu(open) {
  const menu = document.getElementById("menu");
  const ctrl = document.querySelector("#controls");
  splash.classList.add("hidden");
  if (open) {
    menu.classList.remove("hidden");
    ctrl.innerHTML = "close controls";
  } else {
    fclose(); // hide instructions too
    menu.classList.add("hidden");
    ctrl.innerHTML = "&#x2261";
  }
} //

function toggleMenu() {
  const menu = document.getElementById("menu");
  setMenu(menu.classList.contains("hidden"));
} // toggleMenu

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function prepareUI() {
  document.querySelector("#controls").addEventListener("click", toggleMenu);

  ui = {}; // User Interface HTML elements
  uiv = {}; // User Interface values of controls

  ["numbered", "level", "instructions", "start"].forEach(
    (ctrlName) => (ui[ctrlName] = document.getElementById(ctrlName))
  );

  readUI();

  ui.instructions.addEventListener("click", startExplic);
  ui.start.addEventListener("click", startGame);
}
function readUI() {
  uiv.numbered = ui.numbered.checked;
  uiv.level = parseInt(ui.level.value, 10);
}

function startExplic() {
  fclose(); // in case already in progress
  explics[0].page.classList.add("disp");
}
function startGame() {
  readUI();
  messages.push({ message: "reset" });
}

//------------------------------------------------------------------------
//------------------------------------------------------------------------

class Rectangle {
  static #radius = 7;

  constructor(kx0, ky0, nx, ny, grid) {
    this.kx0 = kx0;
    this.kx1 = kx0 + nx - 1;
    this.ky0 = ky0;
    this.ky1 = ky0 + ny - 1;
    this.hue = intAlea(360);
    this.sat = 30 + mround(70 * (1 - alea(1) * alea(1)));
    for (let ky = ky0; ky <= this.ky1; ++ky) {
      grid[ky] = grid[ky] || [];
      for (let kx = kx0; kx <= this.kx1; ++kx) {
        grid[ky][kx] = { rect: this };
      }
    }
    this.grid = grid;
    this.num = rectangles.length + 1;
  }

  setCoords() {
    this.ux0 = this.grid.offsx + this.kx0 * this.grid.len; // u for "unmargined"
    this.uy0 = this.grid.offsy + this.ky0 * this.grid.len;
    this.ux1 = this.grid.offsx + (this.kx1 + 1) * this.grid.len;
    this.uy1 = this.grid.offsy + (this.ky1 + 1) * this.grid.len;
    this.x0 = this.ux0 + 1;
    this.y0 = this.uy0 + 1;
    this.x1 = this.ux1 - 1;
    this.y1 = this.uy1 - 1;
  }

  draw(partial) {
    /* partial is optional
        if used, the rectangle will be drawn with one edge in a position different from the normal one
        */

    let edge, pos;
    let radius = Rectangle.#radius;
    let { x0, x1, y0, y1 } = this;

    if (partial) {
      ({ edge, pos } = partial);
      switch (edge) {
        case 0:
          y0 = mmin(y1 - this.grid.len + 2, mmax(y0, pos));
          break;
        case 1:
          x1 = mmax(x0 + this.grid.len - 2, mmin(x1, pos));
          break;
        case 2:
          y1 = mmax(y0 + this.grid.len - 2, mmin(y1, pos));
          break;
        case 3:
          x0 = mmin(x1 - this.grid.len + 2, mmax(x0, pos));
          break;
      }
    }

    if (2 * radius > x1 - x0) radius = (x1 - x0) / 2;
    if (2 * radius > y1 - y0) radius = (y1 - y0) / 2;
    let gr;

    let dx = (x1 - (x0 + y1 - y0)) / 2;

    gr = ctx.createLinearGradient(x0, y1, x1 - dx, y0 - dx);

    gr.addColorStop(0, `hsl(${this.hue} ${this.sat}% 25%)`);
    gr.addColorStop(0.4, `hsl(${this.hue} ${this.sat}% 45%)`);
    gr.addColorStop(0.5, `hsl(${this.hue} ${this.sat}% 50%)`);
    gr.addColorStop(0.6, `hsl(${this.hue} ${this.sat}% 55%)`);
    gr.addColorStop(1, `hsl(${this.hue} ${this.sat}% 75%)`);

    ctx.beginPath();
    ctx.moveTo((x0 + x1) / 2, y0);
    ctx.arcTo(x1, y0, x1, y1, radius);
    ctx.arcTo(x1, y1, x0, y1, radius);
    ctx.arcTo(x0, y1, x0, y0, radius);
    ctx.arcTo(x0, y0, x1, y0, radius);
    ctx.closePath();
    ctx.fillStyle = gr;
    ctx.fill();
    if (uiv.numbered) {
      ctx.fillStyle = "#fff";
      ctx.fillText(this.num, (x0 + x1) / 2, (y0 + y1) / 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#000";
      ctx.strokeText(this.num, (x0 + x1) / 2, (y0 + y1) / 2);
    }
  } // draw

  drawEdge(edge, attrib) {
    const radius = Rectangle.#radius;
    switch (edge) {
      case 0:
        drawLine(
          this.x0 + radius,
          this.uy0,
          this.x1 - radius,
          this.uy0,
          attrib
        );
        break;
      case 1:
        drawLine(
          this.ux1,
          this.y0 + radius,
          this.ux1,
          this.y1 - radius,
          attrib
        );
        break;
      case 2:
        drawLine(
          this.x0 + radius,
          this.uy1,
          this.x1 - radius,
          this.uy1,
          attrib
        );
        break;
      case 3:
        drawLine(
          this.ux0,
          this.y0 + radius,
          this.ux0,
          this.y1 - radius,
          attrib
        );
        break;
    }
  } // drawEdge

  posTarget(edge, target) {
    let lTarget0 = target * this.grid.len;
    let lTarget1 = (target + 1) * this.grid.len;
    switch (edge) {
      case 0:
        return this.grid.offsy + lTarget0;
      case 1:
        return this.grid.offsx + lTarget1;
      case 2:
        return this.grid.offsy + lTarget1;
      case 3:
        return this.grid.offsx + lTarget0;
    }
  }
  drawTarget(edge, target, attrib) {
    let pos = this.posTarget(edge, target);
    switch (edge) {
      case 0:
      case 2:
        drawLine(this.x0, pos, this.x1, pos, attrib);
        break;
      case 1:
      case 3:
        drawLine(pos, this.y0, pos, this.y1, attrib);
        break;
    }
  } // drawEdge
} // class Rectangle
//------------------------------------------------------------------------
function drawLine(x0, y0, x1, y1, attrib) {
  let color = "#fff";
  if (attrib && attrib.color !== undefined) color = attrib.color;
  ctx.strokeStyle = color;
  if (attrib && attrib.lineWidth !== undefined)
    ctx.lineWidth = attrib.lineWidth;
  else ctx.lineWidth = 2;
  if (attrib && attrib.lineDash !== undefined) ctx.setLineDash(attrib.lineDash);
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.setLineDash([]);
}
//------------------------------------------------------------------------

function findReducibles() {
  let kRect, rect, neigh;
  let possib = [];
  let sides = [0, 1, 2, 3];
  rectangles.forEach((rect, kRect) => {
    // shuffle sides
    let k1 = intAlea(4);
    [sides[3], sides[k1]] = [sides[k1], sides[3]];
    k1 = intAlea(3);
    [sides[2], sides[k1]] = [sides[k1], sides[2]];
    k1 = intAlea(2);
    [sides[1], sides[k1]] = [sides[k1], sides[1]];

    for (let kSide = 0; kSide < 4; ++kSide) {
      switch (sides[kSide]) {
        case 0:
          if (rect.kx0 == 0) break;
          neigh = grid[rect.ky0][rect.kx0 - 1].rect;
          if (neigh.ky0 != rect.ky0) break; // not same top edge : reject
          if (neigh.ky1 == rect.ky1) break; // same opposite edge : reject
          if (neigh.ky1 < rect.ky1)
            possib.push([
              { rect: rect, edge: 0, target: neigh.ky1 + 1 },
              { rect: neigh, edge: 1, target: rect.kx1 }
            ]);
          else
            possib.push([
              { rect: neigh, edge: 0, target: rect.ky1 + 1 },
              { rect: rect, edge: 3, target: neigh.kx0 }
            ]);
          // possib.push({ rect, edge: sides[kSide], neigh });
          break;
        case 1:
          if (rect.ky0 == 0) break;
          neigh = grid[rect.ky0 - 1][rect.kx1].rect;
          if (neigh.kx1 != rect.kx1) break; // not same right edge : reject
          if (neigh.kx0 == rect.kx0) break; // same opposite edge : reject
          if (neigh.kx0 > rect.kx0)
            possib.push([
              { rect: rect, edge: 1, target: neigh.kx0 - 1 },
              { rect: neigh, edge: 2, target: rect.ky1 }
            ]);
          else
            possib.push([
              { rect: neigh, edge: 1, target: rect.kx0 - 1 },
              { rect: rect, edge: 0, target: neigh.ky0 }
            ]);
          // possib.push({ rect, edge: sides[kSide], neigh });
          break;
        case 2:
          if (rect.kx1 == grid.nbx - 1) break;
          neigh = grid[rect.ky1][rect.kx1 + 1].rect;
          if (neigh.ky1 != rect.ky1) break; // not same bottom edge : reject
          if (neigh.ky0 == rect.ky0) break; // same opposite edge : reject
          if (neigh.ky0 > rect.ky0)
            possib.push([
              { rect: rect, edge: 2, target: neigh.ky0 - 1 },
              { rect: neigh, edge: 3, target: rect.kx0 }
            ]);
          else
            possib.push([
              { rect: neigh, edge: 2, target: rect.ky0 - 1 },
              { rect: rect, edge: 1, target: neigh.kx1 }
            ]);
          // possib.push({ rect, edge: sides[kSide], neigh });
          break;
        case 3:
          if (rect.ky1 == grid.nby - 1) break;
          neigh = grid[rect.ky1 + 1][rect.kx0].rect;
          if (neigh.kx0 != rect.kx0) break; // not same right edge : reject
          if (neigh.kx1 == rect.kx1) break; // same opposite edge : reject
          if (neigh.kx1 < rect.kx1)
            possib.push([
              { rect: rect, edge: 3, target: neigh.kx1 + 1 },
              { rect: neigh, edge: 0, target: rect.ky0 }
            ]);
          else
            possib.push([
              { rect: neigh, edge: 3, target: rect.kx1 + 1 },
              { rect: rect, edge: 2, target: neigh.ky1 }
            ]);
          // possib.push({ rect, edge: sides[kSide], neigh });
          break;
      } // switch kSide
    } // for kSide
  }); // rectangles.forEach

  return possib;
} // findReducibles
//------------------------------------------------------------------------

function findEdges(p) {
  // the edge or edges close to the mouse position given in p

  let tEdges = [];

  rectangles.forEach((rect) => {
    if (p.x > rect.x0 && p.x < rect.x1) {
      if (mabs(p.y - rect.uy0) < tolMouse) tEdges.push({ rect, edge: 0 });
      if (mabs(p.y - rect.uy1) < tolMouse) tEdges.push({ rect, edge: 2 });
    }
    if (p.y > rect.y0 && p.y < rect.y1) {
      if (mabs(p.x - rect.ux0) < tolMouse) tEdges.push({ rect, edge: 3 });
      if (mabs(p.x - rect.ux1) < tolMouse) tEdges.push({ rect, edge: 1 });
    }
  }); // rectangles.forEach
  if (tEdges.length > 1) {
    let nbh = tEdges.reduce(
      (s, ed) => s + ([0, 2].includes(ed.edge) ? 1 : 0),
      0
    );

    if (nbh >= tEdges.length) {
      tEdges = tEdges.filter((ed) => [0, 2].includes(ed.edge));
    } else {
      tEdges = tEdges.filter((ed) => [1, 3].includes(ed.edge));
    }
  }
  return tEdges;
} // findEdges

//------------------------------------------------------------------------

function shuffleOnce() {
  const possibleMovements = findReducibles();
  if (possibleMovements.length == 0) {
    console.log("it was not that unlikely");
    return false;
  }
  const oneMove = possibleMovements[intAlea(possibleMovements.length)];
  let { rect: rect0, edge: edge0, target: target0 } = oneMove[0];
  let { rect: rect1, edge: edge1, target: target1 } = oneMove[1];

  rect0[["ky0", "kx1", "ky1", "kx0"][edge0]] = target0;
  switch (edge1) {
    case 0:
      for (let ky = target1; ky < rect1.ky0; ++ky) {
        for (let kx = rect1.kx0; kx <= rect1.kx1; kx++)
          grid[ky][kx].rect = rect1;
      }
      rect1.ky0 = target1;
      break;
    case 1:
      for (let kx = rect1.kx1 + 1; kx <= target1; ++kx) {
        for (let ky = rect1.ky0; ky <= rect1.ky1; ky++)
          grid[ky][kx].rect = rect1;
      }
      rect1.kx1 = target1;
      break;
    case 2:
      for (let ky = rect1.ky1 + 1; ky <= target1; ++ky) {
        for (let kx = rect1.kx0; kx <= rect1.kx1; kx++)
          grid[ky][kx].rect = rect1;
      }
      rect1.ky1 = target1;
      break;
    case 3:
      for (let kx = target1; kx < rect1.kx0; ++kx) {
        for (let ky = rect1.ky0; ky <= rect1.ky1; ky++)
          grid[ky][kx].rect = rect1;
      }
      rect1.kx0 = target1;
      break;
  }
}
//------------------------------------------------------------------------
function createConfig(nx, ny) {
  /* initiate game for ny rows of nx 2x2 squares, plus right and bottom edges of 1x1 squares
   */
  grid = [];
  grid.nbx = 2 * nx + 1;
  grid.nby = 2 * ny + 1;
  grid.len = mmin(
    150,
    mfloor(mmin((maxx - 20) / grid.nbx, (maxy - 20) / grid.nby))
  );

  grid.offsx = mround((maxx - grid.nbx * grid.len) / 2);
  grid.offsy = mround((maxy - grid.nby * grid.len) / 2);
  rectangles = [];
  for (let ky = 0; ky < ny; ++ky) {
    for (let kx = 0; kx < nx; ++kx) {
      rectangles.push(new Rectangle(2 * kx, 2 * ky, 2, 2, grid)); // 2 x 2 squares
    }
    rectangles.push(new Rectangle(2 * nx, 2 * ky, 1, 1, grid)); // 1 x 1 squares in rightmost column
    rectangles.push(new Rectangle(2 * nx, 2 * ky + 1, 1, 1, grid));
  } // for ky
  for (let kx = 0; kx < 2 * nx + 1; ++kx) {
    rectangles.push(new Rectangle(kx, 2 * ny, 1, 1, grid)); // 1 x 1 squares in last row
  }
} // createConfig
//------------------------------------------------------------------------
function checkOne(x, y, numRect) {
  const r = grid[y][x].rect;
  if (r.kx0 != x || r.ky0 != y) return false;
  if (uiv.numbered && r.num != numRect) return false;
  return true; // may have wrong size, but this will be detected when checking another piece.
} // checkOne
//------------------------------------------------------------------------
function checkIfEnd() {
  // checking must be done in the order used to create the pieces
  let nRect = 0;
  const nx = (grid.nbx - 1) / 2;
  const ny = (grid.nby - 1) / 2;
  for (let ky = 0; ky < ny; ++ky) {
    for (let kx = 0; kx < nx; ++kx) {
      if (!checkOne(2 * kx, 2 * ky, ++nRect)) return false; // 2 x 2 squares
    }
    if (!checkOne(2 * nx, 2 * ky, ++nRect)) return false; // 1 x 1 squares in rightmost column
    if (!checkOne(2 * nx, 2 * ky + 1, ++nRect)) return false;
  } // for ky
  for (let kx = 0; kx < 2 * nx + 1; ++kx) {
    if (!checkOne(kx, 2 * ny, ++nRect)) return false; // 1 x 1 squares in last row
  }
  return true;
}
//------------------------------------------------------------------------
//------------------------------------------------------------------------

let animate;

{
  // scope for animate

  let animState = 0;
  let reduce;
  let xa, xb, ya, yb; // coordinates for interpolation
  let x0, y0, x1, y1;
  let x0d, y0d, x1d, y1d; // area to delete for image refresh
  let target, tInit;
  let lMov;
  let possibleMovements;
  let theseLm;
  let red;
  let prevTime;

  animate = function (tStamp) {
    let message, alpha;

    message = messages.shift();
    if (message && message.message == "reset") animState = 0;
    window.requestAnimationFrame(animate);

    switch (animState) {
      case 0:
        startOver();
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, maxx, maxy);
        rectangles.forEach((rect) => rect.setCoords());
        rectangles.forEach((rect) => rect.draw());
        canv.style.cursor = "pointer";
        ++animState;

      case 1:
        ++animState;

      case 2:
        if (!message || message.message != "mousedown") return;
        for (let k = 0; k < 10000; ++k) shuffleOnce();
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, maxx, maxy);
        rectangles.forEach((rect) => rect.setCoords());
        rectangles.forEach((rect) => rect.draw());
        ++animState;

      case 3:
        animState = 11;
        break;

      case 11:
        possibleMovements = findReducibles();
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, maxx, maxy);
        rectangles.forEach((rect) => rect.draw());
        canv.style.cursor = "pointer";
        ++animState;
        break;

      case 12:
        if (
          !message ||
          (message.message != "move" && message.message != "mousedown")
        )
          break;
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, maxx, maxy);
        rectangles.forEach((rect) => rect.draw());

        let tEdges = findEdges(mousePosition);
        if (tEdges.length == 0) {
          canv.style.cursor = "pointer";
          return;
        }
        lMov = [];
        // search for this edge among possibleMovements
        possibleMovements.forEach((possMov) => {
          tEdges.forEach((locEdge) => {
            if (
              locEdge.rect == possMov[0].rect &&
              locEdge.edge == possMov[0].edge
            )
              lMov.push(possMov);
          });
        }); // possibleMovements.forEach

        if (lMov.length == 0) {
          tEdges[0].rect.drawEdge(tEdges[0].edge, LINE_ATTR_HOVER_NO);
          canv.style.cursor = "pointer";
        } else {
          lMov.forEach((mov) => {
            mov[0].rect.drawEdge(mov[0].edge, LINE_ATTR_HOVER_YES);
            mov[0].rect.drawTarget(
              mov[0].edge,
              mov[0].target,
              LINE_ATTR_TARGET
            );
          });
          canv.style.cursor = "grab";
          if (message.message == "mousedown") {
            ++animState;
            canv.style.cursor = "grabbing";
          }
        } // else if (possMov.length == 0)

        break;

      case 13:
        if (!message) return;
        if (message.message == "mouseup") {
          ++animState;
          break;
        }
        if (message.message == "mouseleave") {
          animState = 11;
          break;
        }
        if (message.message != "move") return;

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, maxx, maxy);
        rectangles.forEach((rect) => {
          let isLMov = lMov.find((lm) => lm[0].rect == rect);
          if (isLMov) {
            // resizing this rectangle
            let partial = { edge: isLMov[0].edge };
            partial.pos = [
              mousePosition.y,
              mousePosition.x,
              mousePosition.y,
              mousePosition.x
            ][isLMov[0].edge];
            rect.draw(partial);
          } else rect.draw(); // plain rectangle
        });
        lMov.forEach((lm) => {
          lm[0].rect.drawTarget(lm[0].edge, lm[0].target, LINE_ATTR_TARGET);
        });

        break;

      case 14:
        // button released, check which possibility was picked, if any
        canv.style.cursor = "pointer";
        theseLm = [];
        lMov.forEach((lm) => {
          if (
            mabs(
              [
                mousePosition.y,
                mousePosition.x,
                mousePosition.y,
                mousePosition.x
              ][lm[0].edge] - lm[0].rect.posTarget(lm[0].edge, lm[0].target)
            ) < tolMouse
          ) {
            theseLm.push(lm);
          }
        });
        if (theseLm.length == 0) {
          animState = 11; // button was not released where expected - may be edge should go back smoothly to its place
          break;
        }
        /* the selected move(s) is in theseLm - very most likely only one but may be two
            let us complete 1st part, and check whether 2nd part can be done automatically or not
            */
        theseLm[0][0].rect[["ky0", "kx1", "ky1", "kx0"][theseLm[0][0].edge]] =
          theseLm[0][0].target;
        theseLm[0][0].rect.setCoords();

        if (theseLm.length == 1) {
          animState = 102;
          break;
        } // no choice

        // choice : highlight possibillities
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, maxx, maxy);
        rectangles.forEach((rect) => rect.draw());
        theseLm.forEach((lm) => {
          lm[1].rect.drawEdge(0, LINE_ATTR_CHOICE);
          lm[1].rect.drawEdge(1, LINE_ATTR_CHOICE);
          lm[1].rect.drawEdge(2, LINE_ATTR_CHOICE);
          lm[1].rect.drawEdge(3, LINE_ATTR_CHOICE);
        });
        animState++;
        break;

      case 15:
        if (!message || message.message != "mousedown") return;
        for (let k = theseLm.length - 1; k >= 0; --k) {
          let { rect } = theseLm[k][1];
          let { x, y } = mousePosition;
          if (x > rect.x0 && x < rect.x1 && y > rect.y0 && y < rect.y1) {
            // mouse in one of possibilities
            theseLm = [theseLm[k]];
            animState = 102;
            break;
          }
        }
        break;

      case 102: // get ready to grow 2nd rectangle
        tInit = performance.now();
        red = theseLm[0][1];
        red.rect.when = tInit;
        x0 = red.rect.x0;
        x0d = x0 - 1;
        x1 = red.rect.x1;
        x1d = x1 + 1;
        y0 = red.rect.y0;
        y0d = y0 - 1;
        y1 = red.rect.y1;
        y1d = y1 + 1;
        switch (red.edge) {
          case 0:
            target = grid.offsy + red.target * grid.len + 1;
            red.rect.ky0 = red.target;
            y0d = target - 1;
            break;
          case 1:
            target = grid.offsx + (red.target + 1) * grid.len - 1;
            red.rect.kx1 = red.target;
            x1d = target + 1;
            break;
          case 2:
            target = grid.offsy + (red.target + 1) * grid.len - 1;
            red.rect.ky1 = red.target;
            y1d = target + 1;
            break;
          case 3:
            target = grid.offsx + red.target * grid.len + 1;
            red.rect.kx0 = red.target;
            x0d = target - 1;
            break;
        }
        ++animState;

        break;

      case 103: // 2nd phase : grow 2nd rectangle
        alpha = (performance.now() - tInit) / 500; // to be done : make duration proportional to change (= constant speed)
        alpha = mmin(1, alpha);

        switch (red.edge) {
          case 0:
            red.rect.y0 = lerp(y0, target, alpha);
            break;
          case 1:
            red.rect.x1 = lerp(x1, target, alpha);
            break;
          case 2:
            red.rect.y1 = lerp(y1, target, alpha);
            break;
          case 3:
            red.rect.x0 = lerp(x0, target, alpha);
            break;
        }
        ctx.fillStyle = bgColor;
        ctx.fillRect(x0d, y0d, x1d - x0d, y1d - y0d); // delete previous rect
        red.rect.draw();

        if (alpha == 1) {
          tInit = performance.now();
          red.rect[["ky0", "kx1", "ky1", "kx0"][red.edge]] = red.target;
          red.rect.setCoords();
          // clean screen
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, maxx, maxy);
          rectangles.forEach((rect) => rect.draw());

          ++animState;
        }
        break;

      case 104: // update grid
        for (let ky = red.rect.ky0; ky <= red.rect.ky1; ++ky) {
          for (let kx = red.rect.kx0; kx <= red.rect.kx1; ++kx) {
            grid[ky][kx].rect = red.rect;
          } // for kx
        } // for ky
        if (!checkIfEnd()) animState = 11;
        // ready for next move
        else animState = 110;
        break;

      case 110: // you win!
        prevTime = tStamp;
        splash.style.fontSize = "0%";
        splash.classList.remove("hidden");
        ++animState;
        break;

      case 111:
        let pc = ((tStamp - prevTime) / 1000) * 400; //  for 1000 ms expansion to 400% size
        if (pc >= 400) pc = 400;
        splash.style.fontSize = `${mround(pc)}%`;
        if (pc == 400) ++animState; // end of animation
    } // switch
  }; // animate
} // scope for animate

//------------------------------------------------------------------------
//------------------------------------------------------------------------

function startOver() {
  // canvas dimensions

  maxx = window.innerWidth;
  maxy = window.innerHeight;

  canv.width = maxx;
  canv.height = maxy;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, maxx, maxy);

  createConfig([0, 1, 2, 2, 3, 3][uiv.level], [0, 1, 1, 2, 2, 3][uiv.level]);

  tolMouse = mmin(grid.len / 4, 30); // be tolerant...

  ctx.font = `bold ${mmin(grid.len / 2, 48)}px sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  setMenu(firstRun); // to display menu initially

  firstRun = false;
} // startOver

//------------------------------------------------------------------------
//------------------------------------------------------------------------

function mouseDown(event) {
  mousePosition = { x: event.clientX, y: event.clientY };
  if (event.buttons != 1) return; // ignore if not primary button
  messages.push({ message: "mousedown" }, event);
} // mouseDown

//------------------------------------------------------------------------

function mouseUp(event) {
  messages.push({ message: "mouseup", event });
} // mouseUp
//------------------------------------------------------------------------

function mouseLeave(event) {
  messages.push({ message: "mouseleave", event });
} // mouseLeave

//------------------------------------------------------------------------
function mouseMove(event) {
  mousePosition = { x: event.clientX, y: event.clientY };
  if (messages.length && messages.at(-1).message == "move") messages.pop();
  messages.push({ message: "move", event });
} // mouseMove

//------------------------------------------------------------------------
function fclose() {
  explics.forEach((explic) => explic.page.classList.remove("disp"));
} // fclose
//------------------------------------------------------------------------
function fnext(event) {
  let kpage = explics.findIndex(
    (explic) => explic.page.querySelector("button.next") == event.currentTarget
  );
  if (kpage == -1) return;
  explics[kpage].page.classList.remove("disp");
  if (explics[kpage + 1]) {
    explics[kpage + 1].page.classList.add("disp");
  } else fclose();
} // fnext
//------------------------------------------------------------------------
//------------------------------------------------------------------------
// beginning of execution

{
  canv = document.createElement("canvas");
  canv.style.position = "absolute";
  document.body.appendChild(canv);
  ctx = canv.getContext("2d");
  //      canv.setAttribute('title', 'click me');
} // CANVAS creation
canv.addEventListener("mousedown", mouseDown);
canv.addEventListener("mouseup", mouseUp);
canv.addEventListener("mouseleave", mouseLeave);
canv.addEventListener("mousemove", mouseMove);

prepareUI();

explics = ["explic1", "explic2", "explic3"].map((id, k) => ({
  page: document.getElementById(id),
  k
}));

explics.forEach((explic) => {
  if (explic.page.querySelector("button.next"))
    explic.page.querySelector("button.next").addEventListener("click", fnext);
});
explics.forEach((explic) =>
  explic.page.querySelector("button.close").addEventListener("click", fclose)
);

messages = [{ message: "reset" }];

requestAnimationFrame(animate);

splash = document.getElementById("splash");
splash.classList.add("hidden");
