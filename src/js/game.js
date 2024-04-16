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
    radius: 18,
  },
  {} // TODO - remove this
]);

const Game = deepFreeze({
  height: 600,
  width: 300,
  background: "#FFD59D",
  ground: {
    height: 45,
    background: "#29A5BB",
  },
  dropDelay: 100,
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
  const index = Math.floor(Math.random() * (Assets.length - 1));
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
    updatePointer({ engine });
  }, Game.dropDelay);
}

function onCanvasClick({ canvas, engine }) {
  canvas.addEventListener("mousedown", function(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top;
    onDropFruit({ engine, x, y });
  })
}

function registerListeners({ canvas, engine }) {
  onCanvasClick({ canvas, engine });
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
