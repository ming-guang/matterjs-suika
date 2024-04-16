const Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite;

const Assets = deepFreeze([
  {
    index: 0,
    url: "assets/cherries.png",
    radius: 13,
  },
  {
    index: 1,
    url: "assets/strawberry.png",
    radius: 26,
  },
  {
    index: 2,
    url: "assets/grapes.png",
    radius: 39,
  },
  {
    index: 3,
    url: "assets/peach.png",
    radius: 52,
  },
  {
    index: 4,
    url: "assets/pineapple.png",
    radius: 60,
  },
  {
    index: 5,
    url: "assets/melon.png",
    radius: 65,
  },
  {
    index: 6,
    url: "assets/watermelon.png",
    radius: 70,
  },
]);

const Game = deepFreeze({
  height: 750,
  width: 500,
  background: "#FFD59D",
  ground: {
    height: 45,
    background: "#29A5BB",
  },
  dropDelay: 100,
  pointerUpdateDelay: 500,
});

const State = {
  pointer: null,
  fruits: [],
};

function deepFreeze(object) {
  // Retrieve the property names defined on object
  const propNames = Reflect.ownKeys(object);

  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = object[name];

    if ((value && typeof value === "object") || typeof value === "function") {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
}

function resetWorld({ engine }) {
  Composite.allBodies(engine.world).map((body) => {
    Composite.remove(engine.world, body);
  })
}

function drawGround({ engine }) {
  const ground = Bodies.rectangle(
    Game.width / 2,
    Game.height - Game.ground.height / 2,
    Game.width,
    Game.ground.height,
    {
      isStatic: true,
      render: {
        fillStyle: Game.ground.background,
      },
    },
  );
  Composite.add(engine.world, [ground]);
}

function drawWall({ engine }) {
  const wallOptions = [
    Game.height / 2,
    10,
    Game.height,
    {
      isStatic: true,
      render: {
        fillStyle: Game.ground.background,
      },
    },
  ];
  const leftWall = Bodies.rectangle(-5, ...wallOptions);
  const rightWall = Bodies.rectangle(Game.width + 5, ...wallOptions);
  Composite.add(engine.world, [leftWall, rightWall]);
}

function createFruitObject({ x, y, fruit, options }) {
  const body = Bodies.circle(
    x,
    y,
    fruit.radius,
    {
      density: 1,
      frictionAir: 0.00005,
      resitution: 0.8,
      frinction: 0.01,
      render: {
        sprite: {
          texture: fruit.url,
        },
      },
      ...options,
    },
  );
  return {
    fruit,
    body,
  }
}

function insertFruit({ engine, fruitObject }) {
  State.fruits[State.fruits.length] = fruitObject;
  Composite.add(engine.world, [fruitObject.body]);
}

function removeFruit({ engine, fruitObject }) {
  Composite.remove(engine.world, fruitObject.body);
  State.fruits = State.fruits.filter((obj) => obj.body !== fruitObject.body);
}

function pickRandomDropableFruit() {
  const index = Math.floor(Math.random() * (Assets.length / 2));
  return Assets[index];
}

function updatePointer({ engine }) {
  const fruit = pickRandomDropableFruit();
  const fruitObject = createFruitObject({
    x: Game.width / 2,
    y: fruit.radius,
    fruit,
    options: {
      isStatic: true,
    },
  });
  State.pointer = fruitObject;
  insertFruit({ engine, fruitObject });
}

function redrawWorld({ engine }) {
  drawGround({ engine });
  drawWall({ engine });
}

function recalibrate({ engine }) {
  resetWorld({ engine });
  redrawWorld({ engine });
  updatePointer({ engine })
}

function setup() {
  const canvas = document.getElementById("game");
  canvas.height = Game.height;
  canvas.width = Game.width;

  const engine = Engine.create({});
  const render = Render.create({
    element: document.body,
    canvas: canvas,
    engine: engine,
    options: {
      height: Game.height,
      width: Game.width,
      background: Game.background,
      wireframes: false,
    },
  });
  recalibrate({ engine });
  return [canvas, engine, render];
}

function onDropFruit({ engine, x, y }) {
  const fruitObject = State.pointer;
  if (fruitObject === null) {
    return;
  }
  State.pointer = null;
  const targetX = Math.max(fruitObject.fruit.radius, Math.min(Game.width - fruitObject.fruit.radius, x));
  const targetY = fruitObject.fruit.radius * 3;
  Matter.Body.setPosition(fruitObject.body, { x: targetX, y: targetY });
  setTimeout(() => {
    Matter.Body.setStatic(fruitObject.body, false);
  }, Game.dropDelay);
  setTimeout(() => {
    updatePointer({ engine });
  }, Game.pointerUpdateDelay);
}

function registerOnCanvasClick({ canvas, engine }) {
  canvas.addEventListener("mousedown", function(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top;
    onDropFruit({ engine, x, y });
  })
}

function findFruitObjectByBody({ body }) {
  return State.fruits.find((fruitObject) => fruitObject.body === body) || null;
}

function mergeFruitObject({ engine, fruitObjectA, fruitObjectB }) {
  const targetX = (fruitObjectA.body.position.x + fruitObjectB.body.position.x) / 2;
  const targetY = (fruitObjectA.body.position.y + fruitObjectB.body.position.y) / 2;
  const fruit = Assets[fruitObjectA.fruit.index + 1];
  const fruitObject = createFruitObject({ x: targetX, y: targetY, fruit, options: {} });
  removeFruit({ engine, fruitObject: fruitObjectA });
  removeFruit({ engine, fruitObject: fruitObjectB });
  insertFruit({ engine, fruitObject });
}

function onFruitCollide({ engine, fruitObjectA, fruitObjectB }) {
  if (fruitObjectA.fruit !== fruitObjectB.fruit) {
    console.debug({ fruits: [fruitObjectA.fruit, fruitObjectB.fruit] });
    return;
  }
  mergeFruitObject({ engine, fruitObjectA, fruitObjectB });
}

function registerOnObjectCollide({ engine }) {
  Matter.Events.on(engine, "collisionStart", ({ pairs }) => {
    pairs.forEach((pair) => {
      console.debug({ fruits: State.fruits, pair });
      const fruitObjectA = findFruitObjectByBody({ body: pair.bodyA });
      const fruitObjectB = findFruitObjectByBody({ body: pair.bodyB });
      if (fruitObjectA === null || fruitObjectB === null) {
        console.debug({ objects: [fruitObjectA, fruitObjectB] });
        return;
      }
      onFruitCollide({ engine, fruitObjectA, fruitObjectB });
    });
  });
}

function registerListeners({ canvas, engine }) {
  registerOnCanvasClick({ canvas, engine });
  registerOnObjectCollide({ engine });
}

function start() {
  const [canvas, engine, render] = setup();
  registerListeners({ canvas, engine });
  Render.run(render);
  const runner = Runner.create();
  Runner.run(runner, engine);
}

document.addEventListener("DOMContentLoaded", function() {
  start();
});
