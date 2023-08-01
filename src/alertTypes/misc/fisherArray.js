const rearangeArray = (inflexionPoints) => {
  const inflexionPointsRearanged = [];
  let isPop = false;
  while (inflexionPoints.length > 0) {
    if (isPop) inflexionPointsRearanged.push(inflexionPoints.pop());
    else inflexionPointsRearanged.push(inflexionPoints.shift());
    isPop = !isPop;
  }
  return inflexionPointsRearanged;
};

const getArrayWithout0 = (inflexionPoints) => {
  const indexOfZero = inflexionPoints.indexOf(0);
  if (indexOfZero !== -1)
    // eslint-disable-next-line no-param-reassign
    inflexionPoints = [
      ...inflexionPoints.slice(0, indexOfZero),
      ...inflexionPoints.slice(indexOfZero + 1, inflexionPoints.length),
    ];
  return inflexionPoints;
};

const getFormatedArray = () => {
  let inflexionPoints = process.env.FISHER_INFLEXION_POINTS.split(", ")
    .map((inflexionPointString) => parseFloat(inflexionPointString))
    .sort((a, b) => a - b);
  inflexionPoints = inflexionPoints.filter(
    (inflexionPoint, index) => inflexionPoint !== inflexionPoints[index + 1]
  );
  if (
    inflexionPoints.length <= 1 ||
    (inflexionPoints.length <= 2 && inflexionPoints.includes(0))
  )
    throw new Error(
      "Fisher Inflexion Points array must contain at least 2 non-zero elements"
    );
  if (!(inflexionPoints[0] < 0))
    throw new Error(
      "Fisher Inflexion Points array must contain at least 1 negative element"
    );
  if (!(inflexionPoints[inflexionPoints.length - 1] > 0))
    throw new Error(
      "Fisher Inflexion Points array must contain at least 1 positive element"
    );
  return inflexionPoints;
};

const fisherArray = (() => {
  let inflexionPoints = getFormatedArray();
  const lowExtreme = inflexionPoints[0];
  const highExtreme = inflexionPoints[inflexionPoints.length - 1];
  const hasZero = inflexionPoints.indexOf(0) !== -1;
  inflexionPoints = hasZero
    ? getArrayWithout0(inflexionPoints)
    : inflexionPoints;
  inflexionPoints = rearangeArray(inflexionPoints);
  return { lowExtreme, highExtreme, hasZero, inflexionPoints };
})();

module.exports = fisherArray;
