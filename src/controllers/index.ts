//controllers/index.ts

//export all controllers through this  index.js file. This is
//cleaner than importing the files individually in the routes file
export { default as user } from './user';
export { default as auction } from './auction';
export { default as wsaction } from './wscontrol';