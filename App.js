import React, { use, useEffect, useState } from "react";
import {
  Canvas,
  Circle,
  Fill,
  Group,
  Image,
  matchFont,
  Text,
  useFont,
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
  const { width, height } = useWindowDimensions();

  const fontFamily = Platform.select({ ios: 'Helvetica', default: 'serif' });
  const fontStyle = {
    fontFamily,
    fontSize: 40,
    fontWeight: 'bold',
  };
  const font = matchFont(fontStyle);

  const background = useImage(require("./assets/sprites/background-night.png"));
  const bird = useImage(require("./assets/sprites/redbird-midflap.png"));
  const pipeBottom = useImage(require("./assets/sprites/pipe-red.png"));
  const pipeTop = useImage(require("./assets/sprites/pipe-red-top.png"));
  const ground = useImage(require("./assets/sprites/base.png"));

  const pipeOffset = useSharedValue(0);
  const gameOver = useSharedValue(false);
  const x = useSharedValue(width);
  const birdY = useSharedValue(height / 3);
  const birdYVelocity = useSharedValue(0);

  useEffect(() => {
    moveTheMap();
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
      if (current <= -100 && previous>= -100) {
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
      if (current && !previous) {
        cancelAnimation(x);
      }
    }
  );

  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt || gameOver.value) return;

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
          <Group origin={birdOrigin} transform={birdTransform}>
            <Image
              image={bird}
              x={birdPos.x}
              y={birdY}
              width={64}
              height={48}
            />
          </Group>


          {/* Score */}
          <Text
            x={width / 2 - 30}
            y={100}
            text={score.toString()}
            font={font}
          />
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
export default App;
