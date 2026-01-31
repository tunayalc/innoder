export * from './colors';
export * from './spacing';
export * from './typography';

export const theme = {
  colors: require('./colors').colors,
  spacing: require('./spacing').spacing,
  borderRadius: require('./spacing').borderRadius,
  fontSize: require('./typography').fontSize,
  fontWeight: require('./typography').fontWeight,
};

export default theme;
