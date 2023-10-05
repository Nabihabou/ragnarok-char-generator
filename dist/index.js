"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_server_1 = require("@hono/node-server");
const hono_1 = require("hono");
const serve_static_1 = require("@hono/node-server/serve-static");
const merge_images_1 = __importDefault(require("merge-images"));
const canvas_1 = require("canvas");
const app = new hono_1.Hono();
app.use('/static/*', (0, serve_static_1.serveStatic)({ root: './' }));
app.use('/favicon.ico', (0, serve_static_1.serveStatic)({ path: './favicon.ico' }));
app.get('/healthcheck', (ctx) => ctx.text('OK'));
app.get('/generate', (ctx) => {
    // merge images
    const image = (0, merge_images_1.default)([{ src: './static/lk_01.png', x: 0, y: 22 }, { src: './static/head_07.png', x: 8, y: 2 }], {
        Canvas: canvas_1.Canvas,
        Image: canvas_1.Image,
        height: 100,
    }).then((b64) => {
        console.log(b64);
        const b64Data = validateBase64Image(b64);
        const image = Buffer.from(b64Data, 'base64');
        return ctx.body(image);
    }).catch((err) => {
        console.log(err);
        return ctx.text(err);
    });
    return image;
});
function validateBase64Image(base64) {
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if ((matches === null || matches === void 0 ? void 0 : matches.length) !== 3) {
        throw new Error('Invalid input string');
    }
    return matches[2];
}
(0, node_server_1.serve)(app);
