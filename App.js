import React, { useEffect } from "react";
import { Canvas, Image, useImage } from "@shopify/react-native-skia";
import { useWindowDimensions } from "react-native";
import {
  useSharedValue,
  Easing,
  withTiming,
  withSequence,
  withRepeat,
  useFrameCallback,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

const GRAVITY = 9.81 * 100;

const App = () => {
  const { width, height } = useWindowDimensions();
  const background = useImage(require("./assets/sprites/background-night.png"));
  const bird = useImage(require("./assets/sprites/redbird-midflap.png"));
  const pipeBottom = useImage(require("./assets/sprites/pipe-red.png"));
  const pipeTop = useImage(require("./assets/sprites/pipe-red-top.png"));
  const ground = useImage(require("./assets/sprites/base.png"));

  const pipeOffset = 0;
  const x = useSharedValue(width);
  const birdY = useSharedValue(0);
  const birdYVelocity = useSharedValue(100);

  const gesture = Gesture.Tap().onStart(() => {
    birdYVelocity.value = -200;
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
          <Image image={bird} width={64} height={48} x={width / 4} y={birdY} />
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
export default App;
