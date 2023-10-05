import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { Canvas, Image } from 'canvas'
import { validator } from 'hono/validator'
import mergeImages from 'merge-images'

const app = new Hono()

app.use('/static/*', serveStatic({ root: './' }))
app.use('/favicon.ico', serveStatic({ path: './favicon.ico' }))
app.get('/healthcheck', (ctx) => ctx.text('OK'))

const ERROR = {
    HEAD_TYPE_NOT_SPECIFIED: 'head type not specified',
    HEAD_TYPE_NOT_FOUND: 'head type not found',
    BODY_TYPE_NOT_SPECIFIED: 'body type not specified',
    BODY_TYPE_NOT_FOUND: 'body type not found',
    WING_TYPE_NOT_SPECIFIED: 'wing type not specified',
    WING_TYPE_NOT_FOUND: 'wing type not found',
    HAT_TYPE_NOT_SPECIFIED: 'hat type not specified',
    HAT_TYPE_NOT_FOUND: 'hat type not found',
}

const HEADS = {
    '01': { src: './static/head_01.png' },
    '02': { src: './static/head_02.png' },
    '03': { src: './static/head_03.png' },
}
const BODIES = {
    'LK': { src: './static/lk_01.png', x: 46, y: 39, head_x: 52, head_y: 18, hat_x: 9, hat_y: -24 },
    'MG': { src: './static/mage_01.png', x: 48, y: 41, head_x: 52, head_y: 18, hat_x: 9, hat_y: -24 },
}
const HATS = {
    '0': { src: './static/empty.png', x: 0, y: 0 }, // No hat specified
    'wildcat_knit_cap': { src: './static/wildcat_knit_cap_01.png' },
    'white_corone': { src: './static/white_corone_01.png' },
    'cowboy_fire': { src: './static/cowboy_fire_01.png' },
    'flapping_angel_wing': { src: './static/flapping_angel_wing_01.png' }
}
const WINGS = {
    '0': { src: './static/empty.png', x: 0, y: 0 }, // No wing specified
    'bloody': { src: './static/bloody_wing_01.png', x: 10, y: 32 },
    'pinkbutterfly': { src: './static/pinkbutterfly_01.png', x: 10, y: 32 },
    'gabriel': { src: './static/gabriel_01.png', x: 30, y: 32 },
}

const validate = validator('query', (value, ctx) => {
    if (!value.head || typeof value.head !== 'string') {
        return ctx.text(ERROR.HEAD_TYPE_NOT_SPECIFIED, 500);
    }
    if (!HEADS[value.head as keyof typeof HEADS]) {
        return ctx.text(ERROR.HEAD_TYPE_NOT_FOUND, 500);
    }

    if (!value.body || typeof value.body !== 'string') {
        return ctx.text(ERROR.BODY_TYPE_NOT_SPECIFIED, 500);
    }
    if (!BODIES[value.body as keyof typeof BODIES]) {
        return ctx.text(ERROR.BODY_TYPE_NOT_FOUND, 500)
    }

    if (value.wing && typeof value.wing !== 'string') {
        return ctx.text(ERROR.WING_TYPE_NOT_SPECIFIED, 500);
    }
    if (value.wing && !WINGS[value.wing as keyof typeof WINGS]) {
        return ctx.text(ERROR.WING_TYPE_NOT_FOUND, 500)
    }

    if (value.hat && typeof value.hat !== 'string') {
        return ctx.text(ERROR.HAT_TYPE_NOT_SPECIFIED, 500)
    }
    if (value.hat && !HATS[value.hat as keyof typeof HATS]) {
        return ctx.text(ERROR.HAT_TYPE_NOT_FOUND, 500)
    }
    return {
        head: value.head as keyof typeof HEADS,
        body: value.body as keyof typeof BODIES,
        wing: (value.wing || '0') as keyof typeof WINGS,
        hat: (value.hat || '0') as keyof typeof HATS
    }
})

function getHeadPosition(body: keyof typeof BODIES) {
    return {
        x: BODIES[body].head_x,
        y: BODIES[body].head_y,
    }
}

function getHatPosition(body: keyof typeof BODIES) {
    return {
        x: BODIES[body].hat_x,
        y: BODIES[body].hat_y,
    }
}

app.get('/generate', validate, (ctx) => {
    const { head, body, wing, hat } = ctx.req.valid('query')

    // elements
    let elements = [{ ...BODIES[body] }, { ...HEADS[head], ...getHeadPosition(body) }]
    if (wing) {
        elements.unshift({ ...WINGS[wing] })
    }
    if (hat) {
        elements.push({ ...HATS[hat], ...getHatPosition(body) })
    }

    // merge images
    const image = mergeImages(elements, {
        height: 140,
        width: 140,
        Canvas: Canvas,
        Image: Image,
    }).then((b64) => {
        console.log('generation successful')
        const b64Data = validateBase64Image(b64)
        const image = Buffer.from(b64Data, 'base64')
        return ctx.body(image)
    }).catch((err) => {
        console.log(err)
        return ctx.text(err)
    })

    return image
})

function validateBase64Image(base64: string) {
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)

    if (!matches || matches?.length !== 3) {
        throw new Error('Invalid input string')
    }

    return matches[2]
}

serve(app)
