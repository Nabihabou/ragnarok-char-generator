import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { Canvas, Image } from 'canvas'
import mergeImages from 'merge-images'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'

const app = new Hono()

app.use('/static/*', serveStatic({ root: './' }))
app.use('/favicon.ico', serveStatic({ path: './favicon.ico' }))
app.get('/healthcheck', (ctx) => ctx.text('OK'))

const HEADS = {
    '01': { src: './static/head/head_01.png' },
    '02': { src: './static/head/head_02.png' },
    '03': { src: './static/head/head_03.png' },
}
const BODIES = {
    'LK': { src: './static/lk_01.png', x: 46, y: 39, head_x: 52, head_y: 18, hat_x: 9, hat_y: -24 },
    'MG': { src: './static/mage_01.png', x: 48, y: 41, head_x: 52, head_y: 18, hat_x: 9, hat_y: -24 },
    'AC': { src: './static/abyss_chaser_01.png', x: 47, y: 39, head_x: 52, head_y: 18, hat_x: 9, hat_y: -24 },
    'AM': { src: './static/arch_mage_01.png', x: 47, y: 39, head_x: 52, head_y: 18, hat_x: 9, hat_y: -24 },
    'BO': { src: './static/biolo_01.png', x: 42, y: 39, head_x: 52, head_y: 17, hat_x: 9, hat_y: -25 },
}
const HATS = {
    '0': { src: './static/empty.png', x: 0, y: 0 }, // No hat specified
    'wildcat_knit_cap': { view_id: 1671, src: './static/wildcat_knit_cap_01.png' },
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

const validate = zValidator('query', z.object({
    sex: z.enum(['M', 'F']).default('M'),
    head: z.string().optional().refine((head) => head! in HEADS, { message: 'Head type not found' }),
    body: z.string().refine((body) => body in BODIES, { message: 'Body type not found' }),
    hat: z.string().refine((hat) => hat in HATS, { message: 'Hat type not found' }).default('0'),
    wing: z.string().refine((wing) => wing in WINGS, { message: 'Wing type not found' }).default('0'),
}))

function getHeadPosition(body: string) {
    return {
        x: BODIES[body as keyof typeof BODIES].head_x,
        y: BODIES[body as keyof typeof BODIES].head_y,
    }
}

function getHatPosition(body: string) {
    return {
        x: BODIES[body as keyof typeof BODIES].hat_x,
        y: BODIES[body as keyof typeof BODIES].hat_y,
    }
}

app.get('/generate', validate, (ctx) => {
    const { head, body, wing, hat } = ctx.req.valid('query')

    // elements
    let elements = [{ ...BODIES[body as keyof typeof BODIES] }, { ...HEADS[head as keyof typeof HEADS], ...getHeadPosition(body) }]
    if (wing) {
        elements.unshift({ ...WINGS[wing as keyof typeof WINGS] })
    }
    if (hat) {
        elements.push({ ...HATS[hat as keyof typeof HATS], ...getHatPosition(body) })
    }

    // merge images
    const image = mergeImages(elements, {
        height: 140,
        width: 140,
        Canvas: Canvas,
        Image: Image,
    }).then((b64) => {
        console.log(`Generating: ${body} (head ${head}) with ${wing} wing and ${hat} hat`)
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
