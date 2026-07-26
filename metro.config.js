// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .glb (and .gltf, in case you use that format too) to the list of
// binary asset extensions Metro knows how to bundle. Without this,
// Viro3DObject's `bundle-assets://models/tomato.glb` source can fail
// to resolve at build time, since Metro treats unknown extensions as
// source code, not binary assets.
config.resolver.assetExts.push('glb', 'gltf', 'obj', 'mtl');

module.exports = config;