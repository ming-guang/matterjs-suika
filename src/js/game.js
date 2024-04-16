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
      density: 0.1,
      frictionAir: 0.05,
      resitution: 0.5,
      frinction: 0.1,
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

function start() {
  const [, engine, render] = setup();
  Render.run(render);
  const runner = Runner.create();
  Runner.run(runner, engine);
}

document.addEventListener("DOMContentLoaded", function() {
  start();
});
