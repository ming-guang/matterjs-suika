const Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite;

const Game = deepFreeze({
  height: 600,
  width: 300,
  background: "#FFD59D",
  ground: {
    height: 45,
    background: "#29A5BB",
  }
});

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

function redrawWorld({ engine }) {
  drawGround({ engine });
}

function recalibrate({ engine }) {
  resetWorld({ engine });
  redrawWorld({ engine });
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
