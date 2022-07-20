import React from 'react';
import {
  MongoDBLogoMark,
  css,
} from '@mongodb-js/compass-components';

const containerStyles = css({
  position: 'relative',
  width: 500,
  height: 500
});

type LogoMarkColor = 'white' | 'green-dark-2' | 'black' | 'green-base';

type Flower = {
  x: number;
  y: number;
  petals: {
    color: LogoMarkColor;
    scale: number;
    height: number;
    width: number;
    rotation: number;
  }[]
};

function createFlowers() {
  const flowers: Flower[] = [];

  const whiteAndBlackFlowers = Math.random() > 0.5;

  let basePetalColor: LogoMarkColor = whiteAndBlackFlowers ? 'white' : 'green-dark-2';
  const alternatePetalColor: LogoMarkColor = whiteAndBlackFlowers ? 'black' : 'green-base';

  const alternatePetalColors = Math.random() > 0.1;
  if (!alternatePetalColors) {
    basePetalColor = Math.random() > 0.5 ? 'green-dark-2' : 'green-base';
    if (Math.random() > 0.7) {
      basePetalColor = 'black';
    }
  }

  const amtOfFlowers = Math.floor(Math.random() * 20) + 5;
  for (let i = 0; i < amtOfFlowers; i++) {

    const petals = [];
    const basePetalSize = 20 + Math.floor(Math.random() * 20);

    const alternatePetalScale = Math.random();

    const amtOfPetals = 3 + Math.floor(Math.random() * 20);
    let rotation = 0;
    const minimumPetalSizeForFullRotation = (Math.PI * 2) / amtOfPetals;
    const rotationPerPetal = Math.max((Math.PI / 20) + Math.random() * Math.random() * Math.PI, minimumPetalSizeForFullRotation);
    for (let k = 0; k < amtOfPetals; k++) {
      const petalSize = basePetalSize; // k % 2 === 0 ? basePetalSize : alternatePetalSize;

      rotation += rotationPerPetal;
      petals.push({
        height: petalSize,
        width: petalSize * 0.46875, // 18.75 / 40 (original logomark size ratio)

        color: (alternatePetalColors && k % 2 === 0) ? alternatePetalColor : basePetalColor,

        scale: k % 2 === 0 ? 1 : alternatePetalScale,

        rotation
      });
    }
    flowers.push({
      x: Math.floor(Math.random() * 500),
      y: Math.floor(Math.random() * 500),
      petals
    });
  }
  return flowers;
}

const LeafyFlower: React.FunctionComponent = () => {
  const flowersToRender = createFlowers();

  return (
    <div className={containerStyles}>
      {flowersToRender.map((flower, flowerIndex) => (
        <div
          style={{
            position: 'absolute',
            left: flower.x,
            top: flower.y,
          }}
          key={flowerIndex}
        >
          {flower.petals.map((petal, petalIndex) => (
            <MongoDBLogoMark
              key={`${flowerIndex}-${petalIndex}`}
              height={petal.height}
              color={petal.color}
              style={{
                position: 'absolute',

                transformOrigin: `${petal.width / 2}px ${petal.height}px`,
                transform: `rotate(${petal.rotation}rad) scale(${petal.scale})`
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export { LeafyFlower };
