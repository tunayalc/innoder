module.exports = {
  preset: 'react-native',
  roots: ['<rootDir>/src'],
  transformIgnorePatterns: ['node_modules/(?!((jest-)?react-native|@react-native(-community)?|immer)/)'],
};
