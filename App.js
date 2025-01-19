import React, { useEffect, useState } from "react";
import {
  Canvas,
  Group,
  Image,
  matchFont,
  Text,
  useImage,
} from "@shopify/react-native-skia";
import { Platform, useWindowDimensions } from "react-native";
import {
  useSharedValue,
  Easing,
  withTiming,
  withSequence,
  withRepeat,
  useFrameCallback,
  useDerivedValue,
  interpolate,
  Extrapolation,
  useAnimatedReaction,
  runOnJS,
  cancelAnimation,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

const GRAVITY = 9.81 * 100;
const JUMP_VELOCITY = -400;
const PIPE_WIDTH = 104;
const PIPE_HEIGHT = 640;

const App = () => {
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStartOfGame, setIsStartOfGame] = useState(true);
  const { width, height } = useWindowDimensions();

  const fontFamily = Platform.select({ ios: "", default: "serif" });
  const fontStyle = {
    fontFamily,
    fontSize: 40,
    fontWeight: "bold",
  };
  const font = matchFont(fontStyle);

  const readyToStart = useImage(require("./assets/sprites/message.png"));
  const background = useImage(require("./assets/sprites/background-night.png"));
  const bird = useImage(require("./assets/sprites/redbird-midflap.png"));
  const gameOverImage = useImage(require("./assets/sprites/gameover.png"));
  const pipeBottom = useImage(require("./assets/sprites/pipe-red.png"));
  const pipeTop = useImage(require("./assets/sprites/pipe-red-top.png"));
  const ground = useImage(require("./assets/sprites/base.png"));

  const startGame = useSharedValue(false);
  const pipeOffset = useSharedValue(0);
  const gameOver = useSharedValue(false);
  const x = useSharedValue(width);
  const birdY = useSharedValue(height / 3);
  const birdYVelocity = useSharedValue(0);

  useEffect(() => {
    if (!isStartOfGame) moveTheMap();
  }, []);

  const birdPos = {
    x: width / 4,
  };

  const moveTheMap = () => {
    x.value = withRepeat(
      withSequence(
        withTiming(-150, { duration: 3000, easing: Easing.linear }),
        withTiming(width, { duration: 0 })
      ),
      -1
    );
  };

  const birdCenterX = useDerivedValue(() => birdPos.x + 50);
  const birdCenterY = useDerivedValue(() => birdY.value + 40);

  const obstacles = useDerivedValue(() => {
    const allObstacles = [];

    // Bottom Pipe
    allObstacles.push({
      x: x.value,
      y: height - 320 + pipeOffset.value,
      h: PIPE_HEIGHT,
      w: PIPE_WIDTH,
    });

    // Top Pipe
    allObstacles.push({
      x: x.value,
      y: pipeOffset.value - 320,
      h: PIPE_HEIGHT,
      w: PIPE_WIDTH,
    });

    return allObstacles;
  });

  const isPointInsideObstacle = (point, rect) => {
    "worklet";
    if (gameOver.value) {
      return false;
    }
    if (
      point.x >= rect.x &&
      point.x <= rect.x + rect.w &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.h
    ) {
      return true;
    }
  };

  // Scoring System
  useAnimatedReaction(
    () => x.value,
    (current, previous) => {
      // Randomize pipe offset
      if (current <= -100 && previous >= -100) {
        pipeOffset.value = Math.floor(Math.random() * 400) - 200;
      }
      const middle = birdPos.x;
      if (
        current !== previous &&
        previous &&
        current <= middle &&
        previous > middle
      ) {
        runOnJS(setScore)(score + 1);
      }
    }
  );

  // Collision detection
  useAnimatedReaction(
    () => birdY.value,
    (current, previous) => {
      if (current > height - 120) {
        gameOver.value = true;
      }

      if (current <= 0) {
        gameOver.value = true;
      }

      const isColliding = obstacles.value.some((rect) =>
        isPointInsideObstacle(
          { x: birdCenterX.value, y: birdCenterY.value },
          rect
        )
      );

      if (isColliding) {
        gameOver.value = true;
      }
    }
  );

  useAnimatedReaction(
    () => gameOver.value,
    (current, previous) => {
      if (current !== isGameOver) {
        runOnJS(setIsGameOver)(current);
      }
      if (current && !previous) {
        cancelAnimation(x);
      }
    }
  );

  useAnimatedReaction(
    () => startGame.value,
    (current, previous) => {
      if (current && !previous) {
        runOnJS(moveTheMap)();
        runOnJS(setIsStartOfGame)(false);
      }
    }
  );

  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt || gameOver.value || !startGame.value) return;

    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

  const birdTransform = useDerivedValue(() => {
    return [
      {
        rotate: interpolate(
          birdYVelocity.value,
          [-400, 400],
          [-0.5, 0.5],
          Extrapolation.CLAMP
        ),
      },
    ];
  });

  const birdOrigin = useDerivedValue(() => {
    return {
      x: width / 4 + 32,
      y: birdY.value + 24,
    };
  });

  const topPipeY = useDerivedValue(() => pipeOffset.value - 320);
  const bottomPipeY = useDerivedValue(() => height - 320 + pipeOffset.value);

  function restartGame() {
    "worklet";
    birdY.value = height / 3;
    birdYVelocity.value = 0;
    gameOver.value = false;
    x.value = width;
    runOnJS(moveTheMap)();
    runOnJS(setScore)(0);
  }

  const gesture = Gesture.Tap().onStart(() => {
    if (!startGame.value) {
      startGame.value = true;
    }
    if (gameOver.value) {
      restartGame();
    } else {
      birdYVelocity.value = JUMP_VELOCITY;
    }
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
        <Canvas style={{ width, height }}>
          {/* background */}
          <Image image={background} fit="cover" width={width} height={height} />

          {/* Start of game message */}
          {isStartOfGame && (
            <Image
              image={readyToStart}
              x={width / 2 - 360}
              y={height / 2 - 200}
              width={720}
              height={400}
            />
          )}

          {/* pipe */}
          <Image
            image={pipeTop}
            width={PIPE_WIDTH}
            height={PIPE_HEIGHT}
            x={x}
            y={topPipeY}
            rotation={180}
          />
          <Image
            image={pipeBottom}
            width={PIPE_WIDTH}
            height={PIPE_HEIGHT}
            x={x}
            y={bottomPipeY}
          />

          {/* ground */}
          <Image
            image={ground}
            width={width}
            height={150}
            x={0}
            y={height - 75}
            fit={"cover"}
          />

          {/* bird */}
          {!isStartOfGame && (
            <Group origin={birdOrigin} transform={birdTransform}>
              <Image
                image={bird}
                x={birdPos.x}
                y={birdY}
                width={64}
                height={48}
              />
            </Group>
          )}

          {isGameOver && (
            <>
              <Image
                image={gameOverImage}
                x={width / 2 - 180}
                y={height / 2 - 100}
                width={360}
                height={48}
              />
              <Text
                x={width / 2 - 120}
                y={height / 2}
                text="Tap to restart"
                font={font}
              />
            </>
          )}

          {/* Score */}
          {!isStartOfGame && (
            <Text
              x={width / 2 - 30}
              y={100}
              text={score.toString()}
              font={font}
            />
          )}
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
export default App;
