import React from "react";
import { Canvas, Image, useImage } from "@shopify/react-native-skia";
import { useWindowDimensions } from "react-native";

const App = () => {
  const { width, height } = useWindowDimensions();
  const background = useImage(require("./assets/sprites/background-night.png"));
  const bird = useImage(require("./assets/sprites/redbird-midflap.png"));
  const pipeBottom = useImage(require("./assets/sprites/pipe-red.png"));
  const pipeTop = useImage(require("./assets/sprites/pipe-red-top.png"));
  const ground = useImage(require("./assets/sprites/base.png"));

  const pipeOffset = 0;

  return (
    <Canvas style={{ width, height }}>
      {/* background */}
      <Image image={background} fit="cover" width={width} height={height} />

      {/* pipe */}
      <Image
        image={pipeTop}
        width={103}
        height={640}
        x={width / 2}
        y={pipeOffset - 320}
        rotation={180}
      />

      <Image
        image={pipeBottom}
        width={103}
        height={640}
        x={width / 2}
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
      <Image image={bird} width={64} height={48} x={width / 4} y={height / 2} />
    </Canvas>
  );
};
export default App;
