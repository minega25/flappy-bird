import React, { useEffect } from "react";
import {
  Canvas,
  Group,
  Image,
  rotate,
  useImage,
} from "@shopify/react-native-skia";
import { useWindowDimensions } from "react-native";
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
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

const GRAVITY = 9.81 * 100;
const JUMP_VELOCITY = -400;

const App = () => {
  const { width, height } = useWindowDimensions();
  const background = useImage(require("./assets/sprites/background-night.png"));
  const bird = useImage(require("./assets/sprites/redbird-midflap.png"));
  const pipeBottom = useImage(require("./assets/sprites/pipe-red.png"));
  const pipeTop = useImage(require("./assets/sprites/pipe-red-top.png"));
  const ground = useImage(require("./assets/sprites/base.png"));

  const pipeOffset = 0;
  const x = useSharedValue(width);
  const birdY = useSharedValue(height / 3);
  const birdYVelocity = useSharedValue(0);
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

  const gesture = Gesture.Tap().onStart(() => {
    birdYVelocity.value = JUMP_VELOCITY;
  });

  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(-150, { duration: 3000, easing: Easing.linear }),
        withTiming(width, { duration: 0 })
      ),
      -1
    );
  }, []);

  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt) return;

    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
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
            width={103}
            height={640}
            x={x}
            y={pipeOffset - 320}
            rotation={180}
          />

          <Image
            image={pipeBottom}
            width={103}
            height={640}
            x={x}
            y={height - 320 + pipeOffset}
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
              x={width / 4}
              y={birdY}
              width={64}
              height={48}
            />
          </Group>
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
export default App;
